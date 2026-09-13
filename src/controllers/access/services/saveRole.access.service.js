import { prisma } from "../../../config/database.js";
import { ApiError } from "../../../utils/api-error.js";

function validateRoleBody(body) {
  const name = typeof body.name === "string" ? body.name.trim().toLowerCase() : "";
  const permissionIds = body.permissionIds;
  if (!name || !/^[a-z][a-z0-9_-]{1,49}$/.test(name)) throw new ApiError(422, "Validation failed", { name: ["Use 2-50 lowercase letters, numbers, underscores, or hyphens."] });
  if (!Array.isArray(permissionIds) || permissionIds.some((id) => !Number.isInteger(Number(id)))) throw new ApiError(422, "Validation failed", { permissionIds: ["The permissionIds field must be an array of integer IDs."] });
  return { name, description: body.description?.trim() || null, permissionIds: [...new Set(permissionIds.map(Number))] };
}

export async function saveRoleService(id, body) {
  const data = validateRoleBody(body);
  if (data.name === "software_engineer") throw new ApiError(403, "The software_engineer role is protected");
  const roleId = id === undefined ? undefined : Number(id);
  if (id !== undefined && !Number.isInteger(roleId)) throw new ApiError(422, "Invalid role identifier");
  if (roleId) {
    const existingRole = await prisma.role.findUnique({ where: { id: roleId } });
    if (!existingRole) throw new ApiError(404, "Role not found");
    if (existingRole.name === "software_engineer") throw new ApiError(403, "The software_engineer role cannot be changed");
  }
  const found = await prisma.permission.count({ where: { id: { in: data.permissionIds } } });
  if (found !== data.permissionIds.length) throw new ApiError(422, "One or more permissions do not exist");

  return prisma.$transaction(async (tx) => {
    const role = roleId
      ? await tx.role.update({ where: { id: roleId }, data: { name: data.name, description: data.description } })
      : await tx.role.create({ data: { name: data.name, description: data.description } });
    await tx.rolePermission.deleteMany({ where: { roleId: role.id } });
    if (data.permissionIds.length) await tx.rolePermission.createMany({ data: data.permissionIds.map((permissionId) => ({ roleId: role.id, permissionId })) });
    return role;
  });
}

export async function deleteRoleService(id) {
  const roleId = Number(id);
  const role = await prisma.role.findUnique({ where: { id: roleId }, include: { _count: { select: { users: true } } } });
  if (!role) throw new ApiError(404, "Role not found");
  if (role.name === "software_engineer") throw new ApiError(403, "The software_engineer role cannot be deleted");
  if (role._count.users) throw new ApiError(409, "Remove assigned users before deleting this role");
  await prisma.role.delete({ where: { id: roleId } });
}

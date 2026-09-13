import { prisma } from "../../../config/database.js";
import { sync } from "../../../database/custom-functions/sync.js";
import { ApiError } from "../../../utils/api-error.js";
import { authUserInclude, toAuthUser } from "../../../utils/auth-response.js";
import { hashPassword } from "../../../utils/password.js";

export async function listUsersService() {
  const users = await prisma.user.findMany({ include: authUserInclude, orderBy: { name: "asc" } });
  return users.map(toAuthUser);
}

export async function createUserService(body) {
  const name = typeof body.name === "string" ? body.name.trim() : "";
  const email = typeof body.email === "string" ? body.email.trim().toLowerCase() : "";
  const password = typeof body.password === "string" ? body.password : "";
  const roleIds = Array.isArray(body.roleIds) ? [...new Set(body.roleIds.map(Number))] : [];
  if (!name || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || password.length < 8 || roleIds.some((id) => !Number.isInteger(id))) {
    throw new ApiError(422, "Validation failed", { user: ["Name, valid email, password of at least 8 characters, and valid roleIds are required."] });
  }
  if (await prisma.role.count({ where: { id: { in: roleIds } } }) !== roleIds.length) throw new ApiError(422, "One or more roles do not exist");
  const protectedRole = await prisma.role.findUnique({ where: { name: "software_engineer" } });
  if (protectedRole && roleIds.includes(protectedRole.id)) throw new ApiError(403, "The software_engineer role cannot be assigned through the API");
  const user = await prisma.user.create({ data: {
    name,
    email,
    passwordHash: await hashPassword(password),
    roles: { create: roleIds.map((roleId) => ({ roleId })) },
  }, include: authUserInclude });
  return toAuthUser(user);
}

export async function setUserRolesService(userIdValue, roleIdsValue) {
  const userId = Number(userIdValue);
  if (!Number.isInteger(userId) || !Array.isArray(roleIdsValue) || roleIdsValue.some((id) => !Number.isInteger(Number(id)))) {
    throw new ApiError(422, "Validation failed", { roleIds: ["The roleIds field must be an array of integer IDs."] });
  }
  const roleIds = [...new Set(roleIdsValue.map(Number))];
  const protectedRole = await prisma.role.findUnique({ where: { name: "software_engineer" } });
  const targetHasProtectedRole = protectedRole && await prisma.userRole.findUnique({
    where: { userId_roleId: { userId, roleId: protectedRole.id } },
  });
  if (targetHasProtectedRole) throw new ApiError(403, "The software engineer's role cannot be changed");
  if (protectedRole && roleIds.includes(protectedRole.id)) throw new ApiError(403, "The software_engineer role cannot be assigned through the API");
  const count = await prisma.role.count({ where: { id: { in: roleIds } } });
  if (count !== roleIds.length) throw new ApiError(422, "One or more roles do not exist");
  await prisma.$transaction(async (tx) => {
    await tx.user.findUniqueOrThrow({ where: { id: userId } });
    await sync({
      tx,
      model: "userRole",
      ownerField: "userId",
      ownerId: userId,
      relatedField: "roleId",
      relatedIds: roleIds,
    });
  });
  const user = await prisma.user.findUniqueOrThrow({ where: { id: userId }, include: authUserInclude });
  return toAuthUser(user);
}

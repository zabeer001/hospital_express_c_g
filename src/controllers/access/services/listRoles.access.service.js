import { prisma } from "../../../config/database.js";

export function listRolesService() {
  return prisma.role.findMany({
    include: { permissions: { include: { permission: true } }, _count: { select: { users: true } } },
    orderBy: { name: "asc" },
  }).then((roles) => roles.map((role) => ({
    id: role.id,
    name: role.name,
    description: role.description,
    userCount: role._count.users,
    permissions: role.permissions.map(({ permission }) => permission.name).sort(),
  })));
}

export function listPermissionOptionsService() {
  return prisma.permission.findMany({ orderBy: { name: "asc" } });
}

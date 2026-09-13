import { sync } from "../../src/database/custom-functions/sync.js";

const rolePermissions = {
  software_engineer: "*",
};

class RoleSeeder {
  async run(prisma, permissions) {
    const permissionByName = new Map(permissions.map((permission) => [permission.name, permission.id]));
    const roles = {};

    for (const [name, granted] of Object.entries(rolePermissions)) {
      const role = await prisma.role.upsert({
        where: { name },
        update: {},
        create: { name, description: name === "software_engineer" ? "Protected platform owner with unrestricted access" : null },
      });
      const names = granted === "*" ? [...permissionByName.keys()] : granted;
      await sync({
        tx: prisma,
        model: "rolePermission",
        ownerField: "roleId",
        ownerId: role.id,
        relatedField: "permissionId",
        relatedIds: names.map((permissionName) => permissionByName.get(permissionName)),
      });
      roles[name] = role;
    }

    return roles;
  }
}

export { RoleSeeder, rolePermissions };

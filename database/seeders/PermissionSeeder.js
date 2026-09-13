const permissions = [
  "dashboard.view",
  "doctors.index", "doctors.show", "doctors.create", "doctors.update", "doctors.delete",
  "patients.index", "patients.show", "patients.create", "patients.update", "patients.delete",
  "patients.complete-visit", "roles.manage", "users.manage",
];

class PermissionSeeder {
  async run(prisma) {
    for (const name of permissions) {
      await prisma.permission.upsert({ where: { name }, update: {}, create: { name } });
    }
    return prisma.permission.findMany({ orderBy: { name: "asc" } });
  }
}

export { PermissionSeeder, permissions };

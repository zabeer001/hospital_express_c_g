import { hashPassword } from "../../src/utils/password.js";

const accountDefinitions = [
  { role: "software_engineer", nameKey: "SOFTWARE_ENGINEER_NAME", emailKey: "SOFTWARE_ENGINEER_EMAIL", passwordKey: "SOFTWARE_ENGINEER_PASSWORD" },
];

class UserSeeder {
  async run(prisma, roles) {
    for (const definition of accountDefinitions) {
      const email = String(process.env[definition.emailKey] || "").trim().toLowerCase();
      const name = String(process.env[definition.nameKey] || "").trim();
      const password = String(process.env[definition.passwordKey] || "");
      if (!name || !email || password.length < 8) {
        throw new Error(`${definition.nameKey}, ${definition.emailKey}, and ${definition.passwordKey} (minimum 8 characters) are required in .env`);
      }
      const passwordHash = await hashPassword(password);
      const user = await prisma.user.upsert({
        where: { email },
        update: { name, passwordHash, isActive: true },
        create: { name, email, passwordHash },
      });

      // Exactly one account may own the protected role: the account configured
      // by the real environment used for this seeder run.
      await prisma.userRole.deleteMany({ where: { roleId: roles[definition.role].id, userId: { not: user.id } } });
      await prisma.userRole.deleteMany({ where: { userId: user.id } });
      await prisma.userRole.create({ data: { userId: user.id, roleId: roles[definition.role].id } });
    }
  }
}

export { UserSeeder, accountDefinitions };

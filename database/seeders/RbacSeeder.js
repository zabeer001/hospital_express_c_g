import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { resolve } from "node:path";
import { pathToFileURL } from "node:url";
import { PermissionSeeder } from "./PermissionSeeder.js";
import { RoleSeeder } from "./RoleSeeder.js";
import { UserSeeder } from "./UserSeeder.js";

const prisma = new PrismaClient();

class RbacSeeder {
  async run(client = prisma) {
    await client.$transaction(async (transaction) => {
      const permissions = await new PermissionSeeder().run(transaction);
      const roles = await new RoleSeeder().run(transaction, permissions);
      await new UserSeeder().run(transaction, roles);
    });
  }
}

if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  new RbacSeeder()
    .run()
    .then(() => console.log("RBAC permissions and roles were seeded; the protected account was synchronized when configured."))
    .catch((error) => {
      console.error("RBAC seeding failed:", error);
      process.exitCode = 1;
    })
    .finally(async () => prisma.$disconnect());
}

export { RbacSeeder };

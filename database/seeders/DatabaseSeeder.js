import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { BookingSeeder } from "./BookingSeeder.js";
import { DoctorSeeder } from "./DoctorSeeder.js";
import { PatientSeeder } from "./PatientSeeder.js";
import { PermissionSeeder } from "./PermissionSeeder.js";
import { RoleSeeder } from "./RoleSeeder.js";
import { UserSeeder } from "./UserSeeder.js";

const prisma = new PrismaClient();

class DatabaseSeeder {
  async run() {
    await prisma.$transaction(async (transaction) => {
      await transaction.booking.deleteMany();
      await transaction.patient.deleteMany();
      await transaction.doctor.deleteMany();

      const doctors = await new DoctorSeeder().run(transaction);
      const patients = await new PatientSeeder().run(transaction);
      await new BookingSeeder().run(transaction, patients, doctors);
      const permissions = await new PermissionSeeder().run(transaction);
      const roles = await new RoleSeeder().run(transaction, permissions);
      await new UserSeeder().run(transaction, roles);
    });
  }
}

new DatabaseSeeder()
  .run()
  .then(() => {
    console.log("Database seeded with hospital data, RBAC permissions, roles, and core users.");
  })
  .catch((error) => {
    console.error("Database seeding failed:", error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

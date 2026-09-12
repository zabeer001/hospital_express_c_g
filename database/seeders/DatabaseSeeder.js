import { PrismaClient } from "@prisma/client";
import { DoctorSeeder } from "./DoctorSeeder.js";
import { PatientSeeder } from "./PatientSeeder.js";

const prisma = new PrismaClient();

class DatabaseSeeder {
  async run() {
    await prisma.$transaction(async (transaction) => {
      await transaction.patient.deleteMany();
      await transaction.doctor.deleteMany();

      const doctors = await new DoctorSeeder().run(transaction);
      await new PatientSeeder().run(transaction, doctors);
    });
  }
}

new DatabaseSeeder()
  .run()
  .then(() => {
    console.log("Database seeded with 24 doctors and 28 patients.");
  })
  .catch((error) => {
    console.error("Database seeding failed:", error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

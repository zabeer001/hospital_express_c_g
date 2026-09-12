import { faker } from "@faker-js/faker";
import { patientFactory } from "../factories/PatientFactory.js";

class PatientSeeder {
  static count = 28;

  async run(prisma, doctors) {
    for (let index = 0; index < PatientSeeder.count; index += 1) {
      const doctor = faker.helpers.arrayElement(doctors);
      await prisma.patient.create({ data: patientFactory(doctor.id) });
    }
  }
}

export { PatientSeeder };

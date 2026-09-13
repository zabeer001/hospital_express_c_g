import { patientFactory } from "../factories/PatientFactory.js";

class PatientSeeder {
  static count = 28;

  async run(prisma) {
    const patients = [];

    for (let index = 0; index < PatientSeeder.count; index += 1) {
      patients.push(await prisma.patient.create({ data: patientFactory() }));
    }

    return patients;
  }
}

export { PatientSeeder };

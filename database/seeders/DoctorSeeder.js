import { doctorFactory } from "../factories/DoctorFactory.js";

class DoctorSeeder {
  static count = 24;

  async run(prisma) {
    const doctors = [];

    for (let index = 0; index < DoctorSeeder.count; index += 1) {
      doctors.push(await prisma.doctor.create({ data: doctorFactory() }));
    }

    return doctors;
  }
}

export { DoctorSeeder };

import { faker } from "@faker-js/faker";
import { bookingFactory } from "../factories/BookingFactory.js";

class BookingSeeder {
  async run(prisma, patients, doctors) {
    for (const patient of patients) {
      const doctor = faker.helpers.arrayElement(doctors);
      await prisma.booking.create({
        data: bookingFactory(patient.id, doctor.id, patient),
      });
    }
  }
}

export { BookingSeeder };

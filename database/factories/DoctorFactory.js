import { faker } from "@faker-js/faker";

const specializations = [
  "Cardiology",
  "Dermatology",
  "Neurology",
  "Oncology",
  "Orthopedics",
  "Pediatrics",
  "Psychiatry",
  "Radiology",
];

function doctorFactory() {
  const firstName = faker.person.firstName();
  const lastName = faker.person.lastName();

  return {
    name: `Dr. ${firstName} ${lastName}`,
    specialization: faker.helpers.arrayElement(specializations),
    hospital: `${faker.location.city()} ${faker.helpers.arrayElement(["Medical Centre", "General Hospital", "Specialized Hospital", "Clinic"])}`,
    phone: `+880 1${faker.string.numeric(9)}`,
    email: faker.internet
      .email({ firstName, lastName, provider: "hospital.test" })
      .toLowerCase(),
    createdAt: faker.date.recent({ days: 180 }),
  };
}

export { doctorFactory };

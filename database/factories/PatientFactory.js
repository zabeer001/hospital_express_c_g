import { faker } from "@faker-js/faker";

function patientFactory() {
  return {
    name: faker.person.fullName(),
    age: faker.number.int({ min: 1, max: 95 }),
    gender: faker.helpers.arrayElement(["Female", "Male", "Other"]),
    phone: `+880 1${faker.string.numeric(9)}`,
    email: faker.internet.email().toLowerCase(),
  };
}

export { patientFactory };

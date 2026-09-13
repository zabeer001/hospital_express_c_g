import { faker } from "@faker-js/faker";

const conditions = [
  "Allergy",
  "Arthritis",
  "Asthma",
  "Diabetes",
  "Heart condition",
  "Hypertension",
  "Migraine",
];

function patientFactory() {
  const status = faker.helpers.arrayElement(["Active", "Monitoring", "Recovered"]);

  return {
    name: faker.person.fullName(),
    age: faker.number.int({ min: 1, max: 95 }),
    gender: faker.helpers.arrayElement(["Female", "Male", "Other"]),
    phone: `+880 1${faker.string.numeric(9)}`,
    condition: faker.helpers.arrayElement(conditions),
    status,
  };
}

export { patientFactory };

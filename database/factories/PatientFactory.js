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

function patientFactory(doctorId) {
  const status = faker.helpers.arrayElement(["Active", "Monitoring", "Recovered"]);
  const admittedAt = faker.date.recent({ days: 120 });
  const hasAppointment = status !== "Recovered" && faker.datatype.boolean();

  return {
    doctorId,
    name: faker.person.fullName(),
    age: faker.number.int({ min: 1, max: 95 }),
    gender: faker.helpers.arrayElement(["Female", "Male", "Other"]),
    phone: `+880 1${faker.string.numeric(9)}`,
    condition: faker.helpers.arrayElement(conditions),
    status,
    admittedAt,
    appointmentAt: hasAppointment
      ? faker.date.soon({ days: 30 })
      : null,
    visitCompletedAt: status === "Recovered"
      ? faker.date.between({ from: admittedAt, to: new Date() })
      : null,
  };
}

export { patientFactory };

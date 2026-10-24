import { faker } from "@faker-js/faker";

const conditions = ["Allergy", "Arthritis", "Asthma", "Diabetes", "Heart condition", "Hypertension", "Migraine"];

function bookingFactory(patientId, doctorId) {
  const admittedAt = faker.date.recent({ days: 120 });
  const completed = faker.datatype.boolean();
  const hasUpcomingAppointment = !completed && faker.datatype.boolean();
  const appointmentAt = hasUpcomingAppointment
    ? faker.date.soon({ days: 30 })
    : admittedAt;
  const visitCompletedAt = completed
    ? faker.date.between({ from: admittedAt, to: new Date() })
    : null;

  return {
    patientId,
    doctorId,
    appointmentAt,
    admittedAt,
    visitCompletedAt,
    condition: faker.helpers.arrayElement(conditions),
    status: visitCompletedAt ? "Completed" : "Admitted",
  };
}

export { bookingFactory };

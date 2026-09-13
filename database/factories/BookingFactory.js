import { faker } from "@faker-js/faker";

function bookingFactory(patientId, doctorId, patient) {
  const admittedAt = faker.date.recent({ days: 120 });
  const hasUpcomingAppointment = patient.status !== "Recovered" && faker.datatype.boolean();
  const appointmentAt = hasUpcomingAppointment
    ? faker.date.soon({ days: 30 })
    : admittedAt;
  const visitCompletedAt = patient.status === "Recovered"
    ? faker.date.between({ from: admittedAt, to: new Date() })
    : null;

  return {
    patientId,
    doctorId,
    appointmentAt,
    admittedAt,
    visitCompletedAt,
    condition: patient.condition,
    status: visitCompletedAt ? "Completed" : "Admitted",
  };
}

export { bookingFactory };

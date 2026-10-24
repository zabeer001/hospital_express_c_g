const patientFields = ["name", "age", "gender", "phone", "email"];
const patientStatusToBookingStatus = {
  Active: "Confirmed",
  Monitoring: "Admitted",
  Recovered: "Completed",
};

function splitPatientAndBookingData(data) {
  const patientData = Object.fromEntries(
    patientFields
      .filter((field) => data[field] !== undefined)
      .map((field) => [field, data[field]]),
  );

  const bookingData = {};
  for (const field of ["doctorId", "appointmentAt", "admittedAt", "visitCompletedAt"]) {
    if (data[field] !== undefined) bookingData[field] = data[field];
  }
  if (data.condition !== undefined) bookingData.condition = data.condition;
  if (data.status !== undefined) bookingData.status = patientStatusToBookingStatus[data.status];
  if (bookingData.visitCompletedAt) bookingData.status = "Completed";
  else if (bookingData.admittedAt) bookingData.status = "Admitted";

  return { patientData, bookingData };
}

function getPatientBookingInclude(where) {
  return {
    bookings: {
      ...(where && { where }),
      include: { doctor: { select: { name: true, specialization: true } } },
      orderBy: { appointmentAt: "desc" },
      take: 1,
    },
  };
}

const patientBookingInclude = getPatientBookingInclude();

export { getPatientBookingInclude, patientBookingInclude, splitPatientAndBookingData };

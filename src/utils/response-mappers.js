function toDoctorResponse(record, upcomingCount, patientCount) {
  if (!record) return null;
  const { _count, ...doctor } = record;
  return {
    ...doctor,
    ...(patientCount !== undefined && { patientCount }),
    ...(patientCount === undefined && _count && { patientCount: _count.bookings ?? _count.patients }),
    ...(upcomingCount !== undefined && { upcomingCount }),
  };
}

function toPatientResponse(record) {
  if (!record) return null;
  const { bookings, doctor: directDoctor, ...patient } = record;
  const booking = bookings?.[0];
  const doctor = booking?.doctor || directDoctor;
  const admittedAt = booking ? booking.admittedAt : patient.admittedAt;
  const appointmentAt = booking ? booking.appointmentAt : patient.appointmentAt;
  const visitCompletedAt = booking ? booking.visitCompletedAt : patient.visitCompletedAt;
  return {
    ...patient,
    ...(booking && {
      bookingId: booking.id,
      bookingStatus: booking.status,
      doctorId: booking.doctorId,
    }),
    admittedAt: admittedAt instanceof Date
      ? admittedAt.toISOString().slice(0, 10)
      : admittedAt || undefined,
    appointmentAt: appointmentAt || undefined,
    visitCompletedAt: visitCompletedAt || undefined,
    ...(doctor && {
      doctorName: doctor.name,
      ...(doctor.specialization !== undefined && {
        doctorSpecialization: doctor.specialization,
      }),
    }),
  };
}

function toBookingResponse(record) {
  if (!record) return null;
  const { patient, doctor, ...booking } = record;
  return {
    ...booking,
    ...(patient && { patient }),
    ...(doctor && { doctor }),
  };
}

export { toBookingResponse, toDoctorResponse, toPatientResponse };

function toDoctorResponse(record, upcomingCount) {
  if (!record) return null;
  const { _count, ...doctor } = record;
  return {
    ...doctor,
    ...(_count && { patientCount: _count.patients }),
    ...(upcomingCount !== undefined && { upcomingCount }),
  };
}

function toPatientResponse(record) {
  if (!record) return null;
  const { doctor, ...patient } = record;
  return {
    ...patient,
    admittedAt: patient.admittedAt instanceof Date
      ? patient.admittedAt.toISOString().slice(0, 10)
      : patient.admittedAt,
    appointmentAt: patient.appointmentAt || undefined,
    visitCompletedAt: patient.visitCompletedAt || undefined,
    ...(doctor && {
      doctorName: doctor.name,
      ...(doctor.specialization !== undefined && {
        doctorSpecialization: doctor.specialization,
      }),
    }),
  };
}

export { toDoctorResponse, toPatientResponse };

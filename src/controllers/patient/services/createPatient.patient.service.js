import { prisma } from "../../../config/database.js";
import { toPatientResponse } from "../../../utils/response-mappers.js";
import { validatePatient } from "../../../validators/patient.validator.js";
import { ensureDoctorExists } from "./utils/ensureDoctorExists.util.js";
import { patientBookingInclude, splitPatientAndBookingData } from "./utils/patientBookingData.util.js";

export async function createPatientService(body) {
  const data = await validatePatient(body);
  await ensureDoctorExists(data.doctorId);
  const { patientData, bookingData } = splitPatientAndBookingData(data);
  const patient = await prisma.patient.create({
    data: {
      ...patientData,
      bookings: { create: bookingData },
    },
    include: patientBookingInclude,
  });
  return toPatientResponse(patient);
}

import { prisma } from "../../../config/database.js";
import { ApiError } from "../../../utils/api-error.js";
import { toPatientResponse } from "../../../utils/response-mappers.js";
import { validateId } from "../../../validators/common.js";
import { validatePatient } from "../../../validators/patient.validator.js";
import { getPatientService } from "./getPatient.patient.service.js";
import { ensureDoctorExists } from "./utils/ensureDoctorExists.util.js";
import { patientBookingInclude, splitPatientAndBookingData } from "./utils/patientBookingData.util.js";

export async function updatePatientService(id, body) {
  const patientId = await validateId(id);
  await getPatientService(patientId);
  const data = await validatePatient(body, { partial: true });

  if (!Object.keys(data).length) {
    throw new ApiError(422, "Provide at least one patient field to update");
  }
  if (data.doctorId) await ensureDoctorExists(data.doctorId);

  const { patientData, bookingData } = splitPatientAndBookingData(data);
  const patient = await prisma.$transaction(async (tx) => {
    if (Object.keys(patientData).length) {
      await tx.patient.update({ where: { id: patientId }, data: patientData });
    }

    if (Object.keys(bookingData).length) {
      const booking = await tx.booking.findFirst({
        where: { patientId },
        orderBy: { appointmentAt: "desc" },
        select: { id: true },
      });
      if (!booking) throw new ApiError(409, "Patient does not have a booking to update");
      await tx.booking.update({ where: { id: booking.id }, data: bookingData });
    }

    return tx.patient.findUnique({ where: { id: patientId }, include: patientBookingInclude });
  });
  return toPatientResponse(patient);
}

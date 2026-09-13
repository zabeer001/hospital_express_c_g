import { prisma } from "../../../config/database.js";
import { toPatientResponse } from "../../../utils/response-mappers.js";
import { validateId } from "../../../validators/common.js";
import { validateVisitCompletion } from "../../../validators/patient.validator.js";
import { getPatientService } from "./getPatient.patient.service.js";
import { ApiError } from "../../../utils/api-error.js";
import { patientBookingInclude } from "./utils/patientBookingData.util.js";

export async function completePatientVisitService(id, body) {
  const patientId = await validateId(id);
  await getPatientService(patientId);
  const { completedAt } = await validateVisitCompletion(body);
  const booking = await prisma.booking.findFirst({
    where: { patientId, visitCompletedAt: null, status: { not: "Cancelled" } },
    orderBy: { appointmentAt: "desc" },
    select: { id: true },
  });
  if (!booking) throw new ApiError(409, "Patient does not have an active booking to complete");

  const patient = await prisma.$transaction(async (tx) => {
    await tx.booking.update({
      where: { id: booking.id },
      data: { visitCompletedAt: completedAt, status: "Completed" },
    });
    return tx.patient.findUnique({ where: { id: patientId }, include: patientBookingInclude });
  });
  return toPatientResponse(patient);
}

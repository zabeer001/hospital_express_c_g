import { prisma } from "../../../config/database.js";
import { ApiError } from "../../../utils/api-error.js";
import { toPatientResponse } from "../../../utils/response-mappers.js";
import { validateId } from "../../../validators/common.js";
import { patientBookingInclude } from "./utils/patientBookingData.util.js";

export async function getPatientService(id) {
  const patientId = await validateId(id);
  const patient = await prisma.patient.findUnique({
    where: { id: patientId },
    include: patientBookingInclude,
  });

  if (!patient) throw new ApiError(404, "Patient not found");
  return toPatientResponse(patient);
}

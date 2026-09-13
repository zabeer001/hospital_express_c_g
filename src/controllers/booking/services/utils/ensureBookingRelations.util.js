import { prisma } from "../../../../config/database.js";
import { ApiError } from "../../../../utils/api-error.js";

async function ensureBookingRelationsExist({ patientId, doctorId }) {
  const [patient, doctor] = await Promise.all([
    patientId === undefined
      ? true
      : prisma.patient.findUnique({ where: { id: patientId }, select: { id: true } }),
    doctorId === undefined
      ? true
      : prisma.doctor.findUnique({ where: { id: doctorId }, select: { id: true } }),
  ]);

  const details = {};
  if (!patient) details.patientId = ["The selected patient does not exist."];
  if (!doctor) details.doctorId = ["The selected doctor does not exist."];
  if (Object.keys(details).length) throw new ApiError(422, "Validation failed", details);
}

export { ensureBookingRelationsExist };

import { prisma } from "../../../../config/database.js";
import { ApiError } from "../../../../utils/api-error.js";

export async function ensureDoctorExists(doctorId) {
  const doctor = await prisma.doctor.findUnique({ where: { id: doctorId }, select: { id: true } });
  if (!doctor) throw new ApiError(422, "Assigned doctor does not exist", { doctorId });
}

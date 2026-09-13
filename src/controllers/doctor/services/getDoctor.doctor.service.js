import { prisma } from "../../../config/database.js";
import { ApiError } from "../../../utils/api-error.js";
import { toDoctorResponse } from "../../../utils/response-mappers.js";
import { validateId } from "../../../validators/common.js";

export async function getDoctorService(id) {
  const doctorId = await validateId(id);
  const doctor = await prisma.doctor.findUnique({
    where: { id: doctorId },
  });

  if (!doctor) throw new ApiError(404, "Doctor not found");

  const [upcomingCount, patients] = await Promise.all([
    prisma.booking.count({
      where: {
        doctorId,
        appointmentAt: { gte: new Date() },
        visitCompletedAt: null,
        status: { not: "Cancelled" },
      },
    }),
    prisma.booking.findMany({
      where: { doctorId },
      distinct: ["patientId"],
      select: { patientId: true },
    }),
  ]);

  return toDoctorResponse(doctor, upcomingCount, patients.length);
}

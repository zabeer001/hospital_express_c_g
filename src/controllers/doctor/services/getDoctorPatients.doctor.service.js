import { prisma } from "../../../config/database.js";
import { getPagination, getPaginationMeta } from "../../../utils/pagination.js";
import { toPatientResponse } from "../../../utils/response-mappers.js";
import { validateId } from "../../../validators/common.js";
import { getDoctorService } from "./getDoctor.doctor.service.js";

export async function getDoctorPatientsService(id, query) {
  const doctorId = await validateId(id);
  await getDoctorService(doctorId);
  const paging = getPagination(query);
  const where = { doctorId };

  if (query.upcoming === "true") {
    where.appointmentAt = { gte: new Date() };
    where.visitCompletedAt = null;
  }

  const [patients, total] = await Promise.all([
    prisma.patient.findMany({
      where,
      include: { doctor: { select: { name: true, specialization: true } } },
      orderBy: { updatedAt: "desc" },
      skip: paging.offset,
      take: paging.limit,
    }),
    prisma.patient.count({ where }),
  ]);

  return {
    data: patients.map(toPatientResponse),
    meta: getPaginationMeta(paging.page, paging.limit, total),
  };
}

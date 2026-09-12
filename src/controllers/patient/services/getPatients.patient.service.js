import { prisma } from "../../../config/database.js";
import { getPagination, getPaginationMeta } from "../../../utils/pagination.js";
import { toPatientResponse } from "../../../utils/response-mappers.js";
import { validateId } from "../../../validators/common.js";

export async function getPatientsService(query) {
  const paging = getPagination(query);
  const where = {};
  const search = query.search?.trim();

  if (search) {
    where.OR = [
      ...["name", "phone", "condition"].map((field) => ({
        [field]: { contains: search, mode: "insensitive" },
      })),
      { doctor: { name: { contains: search, mode: "insensitive" } } },
    ];
  }
  if (query.doctorId !== undefined) where.doctorId = await validateId(query.doctorId, "doctorId");
  if (query.condition?.trim()) where.condition = query.condition.trim();
  if (query.status) where.status = query.status;
  if (query.admittedFrom || query.admittedTo) {
    where.admittedAt = {};
    if (query.admittedFrom) where.admittedAt.gte = new Date(`${query.admittedFrom}T00:00:00.000Z`);
    if (query.admittedTo) where.admittedAt.lte = new Date(`${query.admittedTo}T00:00:00.000Z`);
  }
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

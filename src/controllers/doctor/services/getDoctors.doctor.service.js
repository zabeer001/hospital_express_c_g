import { prisma } from "../../../config/database.js";
import { getPagination, getPaginationMeta } from "../../../utils/pagination.js";
import { toDoctorResponse } from "../../../utils/response-mappers.js";

function buildWhere(query) {
  const where = {};
  const search = query.search?.trim();

  if (search) {
    where.OR = ["name", "email", "hospital", "specialization"].map((field) => ({
      [field]: { contains: search, mode: "insensitive" },
    }));
  }
  if (query.specialization?.trim()) where.specialization = query.specialization.trim();
  if (query.hospital?.trim()) where.hospital = query.hospital.trim();
  if (query.createdFrom || query.createdTo) {
    where.createdAt = {};
    if (query.createdFrom) where.createdAt.gte = new Date(`${query.createdFrom}T00:00:00.000Z`);
    if (query.createdTo) where.createdAt.lte = new Date(`${query.createdTo}T23:59:59.999Z`);
  }

  return where;
}

export async function getDoctorsService(query) {
  const paging = getPagination(query);
  const where = buildWhere(query);
  const [doctors, total] = await Promise.all([
    prisma.doctor.findMany({
      where,
      include: { _count: { select: { patients: true } } },
      orderBy: { createdAt: "desc" },
      skip: paging.offset,
      take: paging.limit,
    }),
    prisma.doctor.count({ where }),
  ]);

  const upcoming = await prisma.patient.groupBy({
    by: ["doctorId"],
    where: {
      doctorId: { in: doctors.map((doctor) => doctor.id) },
      appointmentAt: { gte: new Date() },
      visitCompletedAt: null,
    },
    _count: { _all: true },
  });
  const upcomingByDoctor = new Map(upcoming.map((row) => [row.doctorId, row._count._all]));

  return {
    data: doctors.map((doctor) => toDoctorResponse(doctor, upcomingByDoctor.get(doctor.id) || 0)),
    meta: getPaginationMeta(paging.page, paging.limit, total),
  };
}

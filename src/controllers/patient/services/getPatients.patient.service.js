import { prisma } from "../../../config/database.js";
import { getPagination, getPaginationMeta } from "../../../utils/pagination.js";
import { toPatientResponse } from "../../../utils/response-mappers.js";
import { validateId } from "../../../validators/common.js";
import { getPatientBookingInclude } from "./utils/patientBookingData.util.js";

export async function getPatientsService(query) {
  const paging = getPagination(query);
  const where = {};
  const bookingWhere = {};
  const search = query.search?.trim();

  if (search) {
    where.OR = [
      ...["name", "phone", "condition"].map((field) => ({
        [field]: { contains: search, mode: "insensitive" },
      })),
      { bookings: { some: { doctor: { name: { contains: search, mode: "insensitive" } } } } },
    ];
  }
  if (query.doctorId !== undefined) bookingWhere.doctorId = await validateId(query.doctorId, "doctorId");
  if (query.condition?.trim()) where.condition = query.condition.trim();
  if (query.status) where.status = query.status;
  if (query.admittedFrom || query.admittedTo) {
    bookingWhere.admittedAt = {};
    if (query.admittedFrom) bookingWhere.admittedAt.gte = new Date(`${query.admittedFrom}T00:00:00.000Z`);
    if (query.admittedTo) bookingWhere.admittedAt.lte = new Date(`${query.admittedTo}T23:59:59.999Z`);
  }
  if (query.upcoming === "true") {
    bookingWhere.appointmentAt = { gte: new Date() };
    bookingWhere.visitCompletedAt = null;
    bookingWhere.status = { not: "Cancelled" };
  }
  if (Object.keys(bookingWhere).length) where.bookings = { some: bookingWhere };
  const bookingInclude = getPatientBookingInclude(
    Object.keys(bookingWhere).length ? bookingWhere : undefined,
  );

  const [patients, total] = await Promise.all([
    prisma.patient.findMany({
      where,
      include: bookingInclude,
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

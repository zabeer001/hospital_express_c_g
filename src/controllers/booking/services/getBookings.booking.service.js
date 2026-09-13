import { prisma } from "../../../config/database.js";
import { getPagination, getPaginationMeta } from "../../../utils/pagination.js";
import { toBookingResponse } from "../../../utils/response-mappers.js";
import { validateId, validateInput } from "../../../validators/common.js";
import { bookingStatuses } from "../../../validators/booking.validator.js";
import { bookingInclude } from "./utils/bookingInclude.util.js";

async function buildWhere(query) {
  const where = {};
  const search = query.search?.trim();

  if (search) {
    where.OR = [
      { condition: { contains: search, mode: "insensitive" } },
      { patient: { name: { contains: search, mode: "insensitive" } } },
      { doctor: { name: { contains: search, mode: "insensitive" } } },
    ];
  }
  if (query.patientId !== undefined) where.patientId = await validateId(query.patientId, "patientId");
  if (query.doctorId !== undefined) where.doctorId = await validateId(query.doctorId, "doctorId");
  if (query.status !== undefined) {
    await validateInput(query, { status: `in:${bookingStatuses.join(",")}` });
    where.status = query.status;
  }
  if (query.appointmentFrom || query.appointmentTo) {
    const rules = {};
    if (query.appointmentFrom) rules.appointmentFrom = "dateFormat:YYYY-MM-DD";
    if (query.appointmentTo) rules.appointmentTo = "dateFormat:YYYY-MM-DD";
    await validateInput(query, rules);
    where.appointmentAt = {};
    if (query.appointmentFrom) {
      where.appointmentAt.gte = new Date(`${query.appointmentFrom}T00:00:00.000Z`);
    }
    if (query.appointmentTo) {
      where.appointmentAt.lte = new Date(`${query.appointmentTo}T23:59:59.999Z`);
    }
  }
  return where;
}

export async function getBookingsService(query) {
  const paging = getPagination(query);
  const where = await buildWhere(query);
  const [bookings, total] = await Promise.all([
    prisma.booking.findMany({
      where,
      include: bookingInclude,
      orderBy: { appointmentAt: "desc" },
      skip: paging.offset,
      take: paging.limit,
    }),
    prisma.booking.count({ where }),
  ]);

  return {
    data: bookings.map(toBookingResponse),
    meta: getPaginationMeta(paging.page, paging.limit, total),
  };
}

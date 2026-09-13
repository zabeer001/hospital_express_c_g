import { prisma } from "../../../config/database.js";
import { getPagination, getPaginationMeta } from "../../../utils/pagination.js";
import { toDoctorResponse } from "../../../utils/response-mappers.js";

function buildWhere(query) {
  // Prisma's `where` object is built dynamically from the URL query string.
  // If a filter was not sent, it is not added, so Prisma will not filter by it.
  const where = {};
  const search = query.search?.trim();

  if (search) {
    // `OR` means a doctor is included when the search text occurs in at least
    // one of these fields. `mode: "insensitive"` makes the match ignore case.
    // Prisma generates SQL similar to: name ILIKE '%search%' OR email ILIKE ...
    where.OR = ["name", "email", "hospital", "specialization"].map((field) => ({
      [field]: { contains: search, mode: "insensitive" },
    }));
  }

  // These are exact-value filters. They are combined with the search filter
  // using AND because they are separate properties on the same `where` object.
  if (query.specialization?.trim()) where.specialization = query.specialization.trim();
  if (query.hospital?.trim()) where.hospital = query.hospital.trim();

  if (query.createdFrom || query.createdTo) {
    // Build a date range for Doctor.createdAt. `gte` means greater than or
    // equal to; `lte` means less than or equal to. The boundaries cover each
    // complete date in UTC.
    where.createdAt = {};
    if (query.createdFrom) where.createdAt.gte = new Date(`${query.createdFrom}T00:00:00.000Z`);
    if (query.createdTo) where.createdAt.lte = new Date(`${query.createdTo}T23:59:59.999Z`);
  }

  return where;
}

export async function getDoctorsService(query) {
  // Convert `page` and `limit` into Prisma's `skip` and `take` pagination.
  const paging = getPagination(query);

  // This is where the request filters are prepared before querying Prisma.
  const where = buildWhere(query);

  // Run both independent database queries concurrently:
  // - findMany returns only the doctors for the requested page.
  // - count returns the total matching rows for pagination metadata.
  const [doctors, total] = await Promise.all([
    prisma.doctor.findMany({
      where,
      // Newest doctors appear first.
      orderBy: { createdAt: "desc" },
      // Example: page 2 with limit 20 uses skip 20 and take 20.
      skip: paging.offset,
      take: paging.limit,
    }),
    prisma.doctor.count({ where }),
  ]);

  // The remaining queries calculate statistics only for doctors on this page,
  // rather than loading booking rows for every doctor in the database.
  const doctorIds = doctors.map((doctor) => doctor.id);
  const [upcoming, doctorPatients] = await Promise.all([
    // Group future active bookings by doctor and count each doctor's bookings.
    prisma.booking.groupBy({
      by: ["doctorId"],
      where: {
        doctorId: { in: doctorIds },
        appointmentAt: { gte: new Date() },
        visitCompletedAt: null,
        status: { not: "Cancelled" },
      },
      _count: { _all: true },
    }),
    // Return one row per unique doctor/patient pair. A patient with multiple
    // bookings for the same doctor must count as only one patient.
    prisma.booking.findMany({
      where: { doctorId: { in: doctorIds } },
      distinct: ["doctorId", "patientId"],
      select: { doctorId: true, patientId: true },
    }),
  ]);

  // Convert the grouped query results into lookup maps so each doctor can get
  // its counts without repeatedly scanning the full result arrays.
  const upcomingByDoctor = new Map(upcoming.map((row) => [row.doctorId, row._count._all]));
  const patientsByDoctor = doctorPatients.reduce((counts, row) => {
    counts.set(row.doctorId, (counts.get(row.doctorId) || 0) + 1);
    return counts;
  }, new Map());

  return {
    // Add patientCount and upcomingCount to every doctor response. Doctors
    // without matching bookings receive zero for both counts.
    data: doctors.map((doctor) => toDoctorResponse(
      doctor,
      upcomingByDoctor.get(doctor.id) || 0,
      patientsByDoctor.get(doctor.id) || 0,
    )),
    meta: getPaginationMeta(paging.page, paging.limit, total),
  };
}

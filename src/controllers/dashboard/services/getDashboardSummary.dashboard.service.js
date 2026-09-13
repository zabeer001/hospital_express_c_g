import { prisma } from "../../../config/database.js";
import { toPatientResponse } from "../../../utils/response-mappers.js";
import { patientBookingInclude } from "../../patient/services/utils/patientBookingData.util.js";

function monthKey(date) {
  return date.toISOString().slice(0, 7);
}

function recentMonthStarts(count) {
  const current = new Date();
  current.setUTCDate(1);
  current.setUTCHours(0, 0, 0, 0);

  return Array.from({ length: count }, (_, index) => {
    const month = new Date(current);
    month.setUTCMonth(current.getUTCMonth() - (count - index - 1));
    return month;
  });
}

export async function getDashboardSummaryService() {
  const months = recentMonthStarts(6);
  const [
    totalDoctors,
    totalPatients,
    activePatients,
    newThisMonth,
    statuses,
    conditions,
    admissions,
    doctorPatients,
    recentPatients,
  ] = await Promise.all([
    prisma.doctor.count(),
    prisma.patient.count(),
    prisma.patient.count({ where: { status: "Active" } }),
    prisma.booking.count({ where: { admittedAt: { gte: months.at(-1) } } }),
    prisma.patient.groupBy({ by: ["status"], _count: { _all: true }, orderBy: { status: "asc" } }),
    prisma.patient.groupBy({
      by: ["condition"],
      _count: { _all: true },
      orderBy: [{ _count: { condition: "desc" } }, { condition: "asc" }],
      take: 10,
    }),
    prisma.booking.findMany({
      where: { admittedAt: { gte: months[0] } },
      select: { admittedAt: true },
    }),
    prisma.booking.findMany({
      distinct: ["doctorId", "patientId"],
      select: { doctorId: true, patientId: true },
    }),
    prisma.patient.findMany({
      include: patientBookingInclude,
      orderBy: { updatedAt: "desc" },
      take: 5,
    }),
  ]);

  const busiestDoctorGroups = [...doctorPatients.reduce((counts, row) => {
    counts.set(row.doctorId, (counts.get(row.doctorId) || 0) + 1);
    return counts;
  }, new Map()).entries()]
    .map(([doctorId, patientCount]) => ({ doctorId, patientCount }))
    .sort((left, right) => right.patientCount - left.patientCount)
    .slice(0, 5);

  const doctors = await prisma.doctor.findMany({
    where: { id: { in: busiestDoctorGroups.map((row) => row.doctorId) } },
    select: { id: true, name: true, specialization: true },
  });
  const doctorsById = new Map(doctors.map((doctor) => [doctor.id, doctor]));
  const monthlyCounts = admissions.reduce((counts, row) => {
    const key = monthKey(row.admittedAt);
    counts.set(key, (counts.get(key) || 0) + 1);
    return counts;
  }, new Map());

  return {
    metrics: { totalDoctors, totalPatients, activePatients, newThisMonth },
    patientStatuses: statuses.map((row) => ({ status: row.status, count: row._count._all })),
    topConditions: conditions.map((row) => ({ condition: row.condition, count: row._count._all })),
    monthlyAdmissions: months.map((month) => ({
      month: monthKey(month),
      count: monthlyCounts.get(monthKey(month)) || 0,
    })),
    busiestDoctors: busiestDoctorGroups.map((row) => ({
      ...doctorsById.get(row.doctorId),
      patientCount: row.patientCount,
    })),
    recentPatients: recentPatients.map(toPatientResponse),
  };
}

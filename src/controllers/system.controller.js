import { prisma } from "../config/database.js";

function info(req, res) {
  res.json({
    name: "Hospital Management API",
    version: "1.0.0",
    documentation: "/api",
  });
}

function documentation(req, res) {
  res.json({
    endpoints: {
      health: "GET /api/health",
      doctors: "GET|POST /api/doctors",
      doctor: "GET|PATCH|DELETE /api/doctors/:id",
      doctorPatients: "GET /api/doctors/:id/patients?upcoming=true",
      patients: "GET|POST /api/patients",
      patient: "GET|PATCH|DELETE /api/patients/:id",
      completeVisit: "PATCH /api/patients/:id/complete-visit",
      dashboard: "GET /api/dashboard/summary",
    },
  });
}

async function health(req, res) {
  await prisma.$queryRaw`SELECT 1`;
  res.json({ data: { status: "ok", database: "connected" } });
}

export { documentation, health, info };

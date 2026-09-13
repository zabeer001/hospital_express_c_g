import { prisma } from "../config/database.js";
import { sendSuccess } from "../utils/api-response.js";

function info(req, res) {
  return sendSuccess(res, {
    message: "API information retrieved successfully",
    data: {
      name: "Hospital tracker API",
      version: "1.0.0",
      documentation: "/api",
    },
  });
}

function documentation(req, res) {
  return sendSuccess(res, {
    message: "API documentation retrieved successfully",
    data: { endpoints: {
      health: "GET /api/health",
      signIn: "POST /api/auth/signin",
      refresh: "POST /api/auth/refresh",
      profile: "GET /api/auth/profile",
      signOut: "POST /api/auth/signout",
      doctors: "GET|POST /api/doctors",
      doctor: "GET|PATCH|DELETE /api/doctors/:id",
      doctorPatients: "GET /api/doctors/:id/patients?upcoming=true",
      bookings: "GET|POST /api/bookings",
      booking: "GET|PATCH|DELETE /api/bookings/:id",
      patients: "GET|POST /api/patients",
      patient: "GET|PATCH|DELETE /api/patients/:id",
      completeVisit: "PATCH /api/patients/:id/complete-visit",
      dashboard: "GET /api/dashboard/summary",
    } },
  });
}

async function health(req, res) {
  await prisma.$queryRaw`SELECT 1`;
  return sendSuccess(res, {
    message: "API is healthy",
    data: { status: "ok", database: "connected" },
  });
}

export { documentation, health, info };

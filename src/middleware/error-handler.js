import { Prisma } from "@prisma/client";
import { ApiError } from "../utils/api-error.js";

function errorHandler(error, req, res, next) {
  if (res.headersSent) return next(error);

  if (error instanceof ApiError) {
    return res.status(error.status).json({
      error: { message: error.message, ...(error.details && { details: error.details }) },
    });
  }

  if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
    return res.status(409).json({ error: { message: "A record with that unique value already exists" } });
  }
  if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2003") {
    return res.status(409).json({ error: { message: "This record is referenced by another record" } });
  }
  if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2023") {
    return res.status(400).json({ error: { message: "Invalid identifier or field format" } });
  }
  if (error.status && error.status >= 400 && error.status < 500) {
    return res.status(error.status).json({ error: { message: error.message } });
  }

  console.error(error);
  return res.status(500).json({ error: { message: "Internal server error" } });
}

export { errorHandler };

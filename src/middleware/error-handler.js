import { Prisma } from "@prisma/client";
import { sendError } from "../utils/api-response.js";
import { ApiError } from "../utils/api-error.js";

function errorHandler(error, req, res, next) {
  if (res.headersSent) return next(error);

  if (error instanceof ApiError) {
    return sendError(res, {
      statusCode: error.status,
      message: error.message,
      details: error.details,
    });
  }

  if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
    return sendError(res, { statusCode: 409, message: "A record with that unique value already exists" });
  }
  if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2003") {
    return sendError(res, { statusCode: 409, message: "This record is referenced by another record" });
  }
  if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2023") {
    return sendError(res, { statusCode: 400, message: "Invalid identifier or field format" });
  }
  if (error instanceof Prisma.PrismaClientValidationError) {
    return sendError(res, { statusCode: 422, message: "Validation failed" });
  }
  if (error.status && error.status >= 400 && error.status < 500) {
    return sendError(res, { statusCode: error.status, message: error.message });
  }

  console.error(error);
  return sendError(res);
}

export { errorHandler };

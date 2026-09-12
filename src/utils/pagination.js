import { ApiError } from "./api-error.js";

function getPagination(query) {
  const page = Number(query.page || 1);
  const limit = Number(query.limit || 100);

  if (!Number.isInteger(page) || page < 1 || !Number.isInteger(limit) || limit < 1 || limit > 100) {
    throw new ApiError(400, "page must be at least 1 and limit must be between 1 and 100");
  }

  return { page, limit, offset: (page - 1) * limit };
}

function getPaginationMeta(page, limit, total) {
  return { page, limit, total, totalPages: Math.ceil(total / limit) };
}

export { getPagination, getPaginationMeta };

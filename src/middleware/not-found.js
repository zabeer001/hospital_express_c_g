import { sendError } from "../utils/api-response.js";

function notFound(req, res) {
  return sendError(res, {
    statusCode: 404,
    message: `Route ${req.method} ${req.originalUrl} was not found`,
  });
}

export { notFound };

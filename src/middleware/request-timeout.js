import { env } from "../config/env.js";
import { sendError } from "../utils/api-response.js";

function requestTimeout(req, res, next) {
  const timer = setTimeout(() => {
    if (res.headersSent || res.writableEnded) return;
    sendError(res, {
      statusCode: 504,
      message: "Request timed out",
    });
  }, env.requestTimeoutMs);

  const clearTimer = () => clearTimeout(timer);
  res.once("finish", clearTimer);
  res.once("close", clearTimer);

  return next();
}

export { requestTimeout };

function sendSuccess(res, {
  statusCode = 200,
  message = "Request completed successfully",
  data = null,
  meta,
} = {}) {
  if (res.headersSent || res.writableEnded) return res;
  return res.status(statusCode).json({
    success: true,
    message,
    data,
    ...(meta !== undefined && { meta }),
  });
}

function sendError(res, {
  statusCode = 500,
  message = "Internal server error",
  details,
} = {}) {
  if (res.headersSent || res.writableEnded) return res;
  return res.status(statusCode).json({
    success: false,
    message,
    ...(details !== undefined && { details }),
  });
}

export { sendError, sendSuccess };

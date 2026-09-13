import { ApiError } from "../utils/api-error.js";

function authorize(...requiredPermissions) {
  return function permissionMiddleware(req, res, next) {
    const granted = new Set(req.auth?.authorization.permissions || []);
    if (!requiredPermissions.every((permission) => granted.has(permission))) {
      return next(new ApiError(403, "You are not authorized to perform this action", { requiredPermissions }));
    }
    return next();
  };
}

export { authorize };

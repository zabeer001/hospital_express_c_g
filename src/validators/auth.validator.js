import { ApiError } from "../utils/api-error.js";
import { validateInput } from "./common.js";

async function validateSignIn(body) {
  await validateInput(body, { email: "required|string|email|maxLength:255", password: "required|string" });
  return { email: body.email.trim().toLowerCase(), password: body.password };
}

async function validatePasswordChange(body) {
  await validateInput(body, { currentPassword: "required|string", password: "required|string" });
  if (body.password.length < 8) throw new ApiError(422, "Validation failed", { password: ["The password must be at least 8 characters."] });
  if (body.password !== body.passwordConfirmation) throw new ApiError(422, "Validation failed", { passwordConfirmation: ["The password confirmation does not match."] });
  return { currentPassword: body.currentPassword, password: body.password };
}

export { validatePasswordChange, validateSignIn };

import { nullableDate, rulesFor, validateInput } from "./common.js";

const genders = ["Female", "Male", "Other"];
const statuses = ["Active", "Monitoring", "Recovered"];
const requiredDefinitions = {
  doctorId: "integer|between:1,2147483647",
  appointmentAt: "dateiso",
  name: "string|maxLength:150",
  age: "integer|between:0,120",
  gender: `in:${genders.join(",")}`,
};
const optionalDefinitions = {
  phone: "nullable|string|maxLength:40",
  condition: "nullable|string|maxLength:180",
  status: `in:${statuses.join(",")}`,
  admittedAt: "nullable|dateFormat:YYYY-MM-DD",
  visitCompletedAt: "nullable|dateiso",
};

async function validatePatient(body, { partial = false } = {}) {
  const rules = rulesFor(body, requiredDefinitions, partial);
  for (const [field, rule] of Object.entries(optionalDefinitions)) {
    if (body[field] !== undefined) rules[field] = rule;
  }
  await validateInput(body, rules);

  const result = {};
  for (const field of [...Object.keys(requiredDefinitions), ...Object.keys(optionalDefinitions)]) {
    if (body[field] !== undefined) result[field] = body[field];
  }
  for (const field of ["name", "gender", "phone", "condition", "status"]) {
    if (result[field] !== undefined && result[field] !== null) result[field] = String(result[field]).trim();
  }
  if (result.doctorId !== undefined) result.doctorId = Number(result.doctorId);
  if (result.age !== undefined) result.age = Number(result.age);
  if (result.admittedAt !== undefined && result.admittedAt !== null) {
    result.admittedAt = new Date(`${result.admittedAt}T00:00:00.000Z`);
  }
  if (result.appointmentAt !== undefined) result.appointmentAt = nullableDate(result.appointmentAt);
  if (result.visitCompletedAt !== undefined) result.visitCompletedAt = nullableDate(result.visitCompletedAt);
  return result;
}

async function validateVisitCompletion(body) {
  if (body.completedAt === undefined) return { completedAt: new Date() };
  await validateInput(body, { completedAt: "required|dateiso" });
  return { completedAt: new Date(body.completedAt) };
}

export { genders, statuses, validatePatient, validateVisitCompletion };

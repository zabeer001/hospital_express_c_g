import { nullableDate, rulesFor, validateInput } from "./common.js";

const bookingStatuses = ["Pending", "Confirmed", "Admitted", "Completed", "Cancelled"];
const requiredDefinitions = {
  patientId: "integer|between:1,2147483647",
  doctorId: "integer|between:1,2147483647",
  appointmentAt: "dateiso",
};
const optionalDefinitions = {
  admittedAt: "nullable|dateiso",
  visitCompletedAt: "nullable|dateiso",
  condition: "nullable|string|maxLength:180",
  status: `in:${bookingStatuses.join(",")}`,
};

async function validateBooking(body, { partial = false } = {}) {
  const rules = rulesFor(body, requiredDefinitions, partial);
  for (const [field, rule] of Object.entries(optionalDefinitions)) {
    if (body[field] !== undefined) rules[field] = rule;
  }
  await validateInput(body, rules);

  const data = {};
  for (const field of [...Object.keys(requiredDefinitions), ...Object.keys(optionalDefinitions)]) {
    if (body[field] !== undefined) data[field] = body[field];
  }
  for (const field of ["patientId", "doctorId"]) {
    if (data[field] !== undefined) data[field] = Number(data[field]);
  }
  for (const field of ["appointmentAt", "admittedAt", "visitCompletedAt"]) {
    if (data[field] !== undefined) data[field] = nullableDate(data[field]);
  }
  for (const field of ["condition", "status"]) {
    if (data[field] !== undefined && data[field] !== null) data[field] = String(data[field]).trim();
  }
  if (data.visitCompletedAt && data.status === undefined) data.status = "Completed";
  else if (data.admittedAt && data.status === undefined) data.status = "Admitted";
  return data;
}

export { bookingStatuses, validateBooking };

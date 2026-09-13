import { rulesFor, validateInput } from "./common.js";

const requiredDefinitions = {
  name: "string|maxLength:150",
  specialization: "string|maxLength:120",
};
const optionalDefinitions = {
  hospital: "nullable|string|maxLength:180",
  phone: "nullable|string|maxLength:40",
  email: "nullable|email|maxLength:255",
};

async function validateDoctor(body, { partial = false } = {}) {
  const rules = rulesFor(body, requiredDefinitions, partial);
  for (const [field, rule] of Object.entries(optionalDefinitions)) {
    if (body[field] !== undefined) rules[field] = rule;
  }
  await validateInput(body, rules);

  const result = {};
  for (const field of [
    ...Object.keys(requiredDefinitions),
    ...Object.keys(optionalDefinitions),
  ]) {
    if (body[field] === undefined) continue;
    result[field] = body[field] === null ? null : String(body[field]).trim();
  }
  return result;
}

export { validateDoctor };

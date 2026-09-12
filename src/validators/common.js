import { ApiError } from "../utils/api-error.js";

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function isInteger(value) {
  return value !== "" && Number.isInteger(Number(value));
}

function isCalendarDate(value) {
  if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const date = new Date(`${value}T00:00:00.000Z`);
  return !Number.isNaN(date.getTime()) && date.toISOString().slice(0, 10) === value;
}

function isIsoDate(value) {
  return typeof value === "string"
    && /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}(?::\d{2}(?:\.\d{1,3})?)?(?:Z|[+-]\d{2}:\d{2})?$/.test(value)
    && !Number.isNaN(Date.parse(value));
}

function validationMessage(field, rule, parameters) {
  if (rule === "required") return `The ${field} field is mandatory.`;
  if (rule === "nullable") return null;
  if (rule === "string") return `The ${field} must be a string.`;
  if (rule === "email") return `The ${field} must be a valid email address.`;
  if (rule === "integer") return `The ${field} must be an integer.`;
  if (rule === "maxLength") return `The ${field} may not be greater than ${parameters[0]} characters.`;
  if (rule === "between") return `The ${field} must be between ${parameters[0]} and ${parameters[1]}.`;
  if (rule === "in") return `The selected ${field} is invalid.`;
  if (rule === "dateFormat") return `The ${field} must match the format ${parameters[0]}.`;
  if (rule === "dateiso") return `The ${field} must be a valid ISO date.`;
  return `The ${field} is invalid.`;
}

function failsRule(value, rule, parameters) {
  if (rule === "required") return value === undefined || value === null || value === "";
  if (rule === "string") return typeof value !== "string";
  if (rule === "email") return typeof value !== "string" || !emailPattern.test(value);
  if (rule === "integer") return !isInteger(value);
  if (rule === "maxLength") return String(value).length > Number(parameters[0]);
  if (rule === "between") return Number(value) < Number(parameters[0]) || Number(value) > Number(parameters[1]);
  if (rule === "in") return !parameters.includes(String(value));
  if (rule === "dateFormat") return parameters[0] !== "YYYY-MM-DD" || !isCalendarDate(value);
  if (rule === "dateiso") return !isIsoDate(value);
  return false;
}

async function validateInput(input, rules, customMessages = {}) {
  const errors = {};

  for (const [field, definition] of Object.entries(rules)) {
    const value = input[field];
    const fieldRules = definition.split("|");
    const nullable = fieldRules.includes("nullable");

    if ((value === undefined || value === null || value === "") && nullable) continue;

    for (const ruleDefinition of fieldRules) {
      const [rule, parameterList = ""] = ruleDefinition.split(":");
      const parameters = parameterList.split(",").filter(Boolean);
      if (!failsRule(value, rule, parameters)) continue;

      errors[field] = [
        customMessages[`${field}.${rule}`]
          || validationMessage(field, rule, parameters),
      ];
      break;
    }
  }

  if (Object.keys(errors).length > 0) {
    throw new ApiError(422, "Validation failed", errors);
  }
}

function rulesFor(input, definitions, partial) {
  return Object.fromEntries(
    Object.entries(definitions)
      .filter(([field]) => !partial || input[field] !== undefined)
      .map(([field, rules]) => [field, `required|${rules}`]),
  );
}

function nullableDate(value) {
  if (value === undefined) return undefined;
  if (value === null || value === "") return null;
  return new Date(value);
}

async function validateId(value, field = "id") {
  await validateInput({ [field]: value }, { [field]: "required|integer|between:1,2147483647" });
  return Number(value);
}

export { nullableDate, rulesFor, validateId, validateInput };

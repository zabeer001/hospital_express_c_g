import test from "node:test";
import assert from "node:assert/strict";
import { toDoctorResponse, toPatientResponse } from "../src/utils/response-mappers.js";

test("doctor response mapper exposes relation counts", () => {
  const doctor = toDoctorResponse({ id: "doctor-id", name: "Doctor", _count: { patients: 4 } }, 2);
  assert.equal(doctor.patientCount, 4);
  assert.equal(doctor.upcomingCount, 2);
});

test("patient response mapper normalizes dates and nullable fields", () => {
  const patient = toPatientResponse({
    id: "patient-id",
    doctorId: 1,
    name: "Patient",
    age: 35,
    admittedAt: new Date("2026-09-12T00:00:00.000Z"),
    appointmentAt: null,
    visitCompletedAt: null,
  });
  assert.equal(patient.age, 35);
  assert.equal(patient.admittedAt, "2026-09-12");
  assert.equal(patient.appointmentAt, undefined);
});

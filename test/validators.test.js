import test from "node:test";
import assert from "node:assert/strict";
import { validateDoctor } from "../src/validators/doctor.validator.js";
import { validatePatient } from "../src/validators/patient.validator.js";

test("doctor validator returns the frontend-compatible fields", async () => {
  const doctor = await validateDoctor({
    name: " Dr. Test ",
    specialization: "Cardiology",
    hospital: "City Hospital",
    phone: "+880 1700 000 000",
    email: "doctor@example.com",
  });
  assert.equal(doctor.name, "Dr. Test");
  assert.equal(doctor.email, "doctor@example.com");
});

test("doctor validator rejects malformed email", async () => {
  await assert.rejects(
    () => validateDoctor({ name: "Doctor", specialization: "General", hospital: "Hospital", phone: "1234567", email: "bad" }),
    { status: 422 },
  );
});

test("doctor validator accepts optional contact fields", async () => {
  const doctor = await validateDoctor({ name: "Dr. Minimal", specialization: "General" });
  assert.deepEqual(doctor, { name: "Dr. Minimal", specialization: "General" });
});

test("patient validator coerces age and accepts dashboard values", async () => {
  const patient = await validatePatient({
    doctorId: "1",
    name: "Patient",
    age: "42",
    gender: "Female",
    phone: "+880 1700 000 000",
    condition: "Hypertension",
    status: "Active",
    admittedAt: "2026-09-12",
    appointmentAt: "2026-09-13T10:30",
  });
  assert.equal(patient.age, 42);
  assert.equal(patient.doctorId, 1);
  assert.equal(patient.status, "Active");
});

test("patient validator rejects out-of-range ages", async () => {
  await assert.rejects(
    () => validatePatient({
      doctorId: 1,
      name: "Patient",
      age: 121,
      gender: "Other",
      phone: "1234567",
      condition: "Checkup",
      status: "Monitoring",
      admittedAt: "2026-09-12",
    }),
    { status: 422 },
  );
});

test("patient validator uses integer Prisma relation ids", async () => {
  await assert.rejects(
    () => validatePatient({
      doctorId: "10000000-0000-4000-8000-000000000001",
      name: "Patient",
      age: 30,
      gender: "Female",
    }),
    { status: 422 },
  );
});

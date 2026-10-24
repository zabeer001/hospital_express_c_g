ALTER TABLE "Patient" ADD COLUMN IF NOT EXISTS "email" TEXT;
CREATE INDEX IF NOT EXISTS "Patient_email_idx" ON "Patient"("email");

UPDATE "Booking" AS booking
SET "condition" = patient."condition"
FROM "Patient" AS patient
WHERE booking."patientId" = patient."id"
  AND booking."condition" IS NULL
  AND patient."condition" IS NOT NULL;

DROP INDEX IF EXISTS "Patient_status_idx";
ALTER TABLE "Patient"
  DROP COLUMN IF EXISTS "condition",
  DROP COLUMN IF EXISTS "status";

DROP TYPE IF EXISTS "PatientStatus";

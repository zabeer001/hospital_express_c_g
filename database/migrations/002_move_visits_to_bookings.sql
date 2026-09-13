DO $$ BEGIN
  CREATE TYPE "BookingStatus" AS ENUM ('Pending', 'Confirmed', 'Admitted', 'Completed', 'Cancelled');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

CREATE TABLE IF NOT EXISTS "Booking" (
  "id" SERIAL PRIMARY KEY,
  "patientId" INTEGER NOT NULL REFERENCES "Patient"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
  "doctorId" INTEGER NOT NULL REFERENCES "Doctor"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
  "appointmentAt" TIMESTAMP(3) NOT NULL,
  "admittedAt" TIMESTAMP(3),
  "visitCompletedAt" TIMESTAMP(3),
  "condition" TEXT,
  "status" "BookingStatus" NOT NULL DEFAULT 'Pending',
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

INSERT INTO "Booking" (
  "patientId",
  "doctorId",
  "appointmentAt",
  "admittedAt",
  "visitCompletedAt",
  "condition",
  "status",
  "createdAt",
  "updatedAt"
)
SELECT
  "id",
  "doctorId",
  COALESCE("appointmentAt", "admittedAt"),
  "admittedAt",
  "visitCompletedAt",
  "condition",
  CASE
    WHEN "visitCompletedAt" IS NOT NULL OR "status" = 'Recovered' THEN 'Completed'::"BookingStatus"
    ELSE 'Admitted'::"BookingStatus"
  END,
  "createdAt",
  "updatedAt"
FROM "Patient"
WHERE NOT EXISTS (
  SELECT 1 FROM "Booking" WHERE "Booking"."patientId" = "Patient"."id"
);

DROP INDEX IF EXISTS "Patient_doctorId_idx";
DROP INDEX IF EXISTS "Patient_admittedAt_idx";
DROP INDEX IF EXISTS "Patient_appointmentAt_idx";

ALTER TABLE "Patient"
  DROP COLUMN IF EXISTS "doctorId",
  DROP COLUMN IF EXISTS "admittedAt",
  DROP COLUMN IF EXISTS "appointmentAt",
  DROP COLUMN IF EXISTS "visitCompletedAt";

CREATE INDEX IF NOT EXISTS "Patient_name_idx" ON "Patient"("name");
CREATE INDEX IF NOT EXISTS "Patient_phone_idx" ON "Patient"("phone");
CREATE INDEX IF NOT EXISTS "Patient_gender_idx" ON "Patient"("gender");
CREATE INDEX IF NOT EXISTS "Patient_createdAt_idx" ON "Patient"("createdAt");
CREATE INDEX IF NOT EXISTS "Booking_patientId_idx" ON "Booking"("patientId");
CREATE INDEX IF NOT EXISTS "Booking_doctorId_idx" ON "Booking"("doctorId");
CREATE INDEX IF NOT EXISTS "Booking_appointmentAt_idx" ON "Booking"("appointmentAt");
CREATE INDEX IF NOT EXISTS "Booking_status_idx" ON "Booking"("status");

SELECT setval(
  pg_get_serial_sequence('"Booking"', 'id'),
  COALESCE((SELECT MAX("id") FROM "Booking"), 1)
);

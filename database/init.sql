DO $$ BEGIN
  CREATE TYPE "PatientGender" AS ENUM ('Female', 'Male', 'Other');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE "PatientStatus" AS ENUM ('Active', 'Monitoring', 'Recovered');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

CREATE TABLE IF NOT EXISTS "Doctor" (
  "id" SERIAL PRIMARY KEY,
  "name" TEXT NOT NULL,
  "specialization" TEXT NOT NULL,
  "hospital" TEXT,
  "phone" TEXT,
  "email" TEXT UNIQUE,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS "Patient" (
  "id" SERIAL PRIMARY KEY,
  "doctorId" INTEGER NOT NULL REFERENCES "Doctor"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
  "name" TEXT NOT NULL,
  "age" INTEGER NOT NULL CHECK ("age" BETWEEN 0 AND 120),
  "gender" "PatientGender" NOT NULL,
  "phone" TEXT,
  "condition" TEXT,
  "status" "PatientStatus" NOT NULL DEFAULT 'Active',
  "admittedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "appointmentAt" TIMESTAMP(3),
  "visitCompletedAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS "Patient_doctorId_idx" ON "Patient"("doctorId");
CREATE INDEX IF NOT EXISTS "Patient_status_idx" ON "Patient"("status");
CREATE INDEX IF NOT EXISTS "Patient_admittedAt_idx" ON "Patient"("admittedAt");
CREATE INDEX IF NOT EXISTS "Patient_appointmentAt_idx" ON "Patient"("appointmentAt");

INSERT INTO "Doctor" ("id", "name", "specialization", "hospital", "phone", "email", "createdAt", "updatedAt") VALUES
  (1, 'Dr. Samira Hasan', 'Cardiology', 'Central Medical Centre', '+880 1711 204 810', 'samira.hasan@centralmed.com', '2026-09-08', '2026-09-08'),
  (2, 'Dr. Arif Khan', 'Neurology', 'Northpoint Hospital', '+880 1812 992 140', 'arif.khan@northpoint.com', '2026-08-22', '2026-08-22'),
  (3, 'Dr. Nusrat Jahan', 'Pediatrics', 'Central Medical Centre', '+880 1914 822 315', 'nusrat.jahan@centralmed.com', '2026-08-14', '2026-08-14'),
  (4, 'Dr. Imran Chowdhury', 'Orthopedics', 'Green Life Hospital', '+880 1610 503 612', 'imran.c@greenlife.com', '2026-07-30', '2026-07-30')
ON CONFLICT ("id") DO NOTHING;

INSERT INTO "Patient" ("id", "doctorId", "name", "age", "gender", "phone", "condition", "status", "admittedAt", "appointmentAt", "updatedAt") VALUES
  (1, 1, 'Amina Rahman', 46, 'Female', '+880 1712 440 101', 'Hypertension', 'Active', '2026-09-10', '2026-09-13 09:30', '2026-09-11'),
  (2, 3, 'Rafi Islam', 8, 'Male', '+880 1811 502 712', 'Asthma', 'Monitoring', '2026-09-09', '2026-09-13 11:00', '2026-09-10'),
  (3, 2, 'Jannat Sultana', 37, 'Female', '+880 1912 693 889', 'Migraine', 'Recovered', '2026-09-05', NULL, '2026-09-09'),
  (4, 4, 'Rashed Kabir', 63, 'Male', '+880 1614 590 322', 'Arthritis', 'Monitoring', '2026-08-29', NULL, '2026-09-07'),
  (5, 1, 'Omar Faruk', 51, 'Male', '+880 1915 332 908', 'Heart condition', 'Monitoring', '2026-08-17', '2026-09-14 10:45', '2026-09-05'),
  (6, 3, 'Maliha Ahmed', 12, 'Female', '+880 1917 114 567', 'Allergy', 'Recovered', '2026-07-15', NULL, '2026-08-17')
ON CONFLICT ("id") DO NOTHING;

SELECT setval(pg_get_serial_sequence('"Doctor"', 'id'), COALESCE((SELECT MAX("id") FROM "Doctor"), 1));
SELECT setval(pg_get_serial_sequence('"Patient"', 'id'), COALESCE((SELECT MAX("id") FROM "Patient"), 1));

CREATE TABLE IF NOT EXISTS "User" (
  "id" SERIAL PRIMARY KEY,
  "name" TEXT NOT NULL,
  "email" TEXT NOT NULL UNIQUE,
  "passwordHash" TEXT NOT NULL,
  "isActive" BOOLEAN NOT NULL DEFAULT TRUE,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS "Role" (
  "id" SERIAL PRIMARY KEY,
  "name" TEXT NOT NULL UNIQUE,
  "description" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS "Permission" (
  "id" SERIAL PRIMARY KEY,
  "name" TEXT NOT NULL UNIQUE,
  "description" TEXT
);

CREATE TABLE IF NOT EXISTS "UserRole" (
  "userId" INTEGER NOT NULL REFERENCES "User"("id") ON DELETE CASCADE,
  "roleId" INTEGER NOT NULL REFERENCES "Role"("id") ON DELETE CASCADE,
  PRIMARY KEY ("userId", "roleId")
);

CREATE TABLE IF NOT EXISTS "RolePermission" (
  "roleId" INTEGER NOT NULL REFERENCES "Role"("id") ON DELETE CASCADE,
  "permissionId" INTEGER NOT NULL REFERENCES "Permission"("id") ON DELETE CASCADE,
  PRIMARY KEY ("roleId", "permissionId")
);

CREATE TABLE IF NOT EXISTS "AuthSession" (
  "id" UUID PRIMARY KEY,
  "userId" INTEGER NOT NULL REFERENCES "User"("id") ON DELETE CASCADE,
  "tokenHash" TEXT NOT NULL UNIQUE,
  "expiresAt" TIMESTAMP(3) NOT NULL,
  "revokedAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS "AuthSession_userId_idx" ON "AuthSession"("userId");
CREATE INDEX IF NOT EXISTS "AuthSession_expiresAt_idx" ON "AuthSession"("expiresAt");

INSERT INTO "Permission" ("name") VALUES
  ('dashboard.view'),
  ('doctors.index'), ('doctors.show'), ('doctors.create'), ('doctors.update'), ('doctors.delete'),
  ('patients.index'), ('patients.show'), ('patients.create'), ('patients.update'), ('patients.delete'),
  ('patients.complete-visit'),
  ('roles.manage'), ('users.manage')
ON CONFLICT ("name") DO NOTHING;

INSERT INTO "Role" ("name", "description") VALUES
  ('software_engineer', 'Protected platform owner with unrestricted access')
ON CONFLICT ("name") DO NOTHING;

INSERT INTO "RolePermission" ("roleId", "permissionId")
SELECT r."id", p."id" FROM "Role" r CROSS JOIN "Permission" p
WHERE r."name" = 'software_engineer'
ON CONFLICT DO NOTHING;

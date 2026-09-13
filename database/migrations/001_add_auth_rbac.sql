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

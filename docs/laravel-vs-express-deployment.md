# Laravel and Node/Express Deployment Commands

This project uses Node.js, Express, Prisma, PostgreSQL, and Docker Compose. Its
deployment lifecycle has the same goals as a Laravel deployment, but the tools
and command names are different.

## Quick comparison

| Deployment task | Laravel | This Node/Express project | Run automatically? |
| --- | --- | --- | --- |
| Install locked dependencies | `composer install --no-dev --optimize-autoloader` | `npm ci` followed by `npm prune --omit=dev` | Yes, only when dependency or Prisma inputs changed |
| Update dependency versions | `composer update` | `npm update` | No; dependency updates must be committed separately |
| Generate ORM/runtime code | Usually not required | `npx prisma generate` | Yes, only when dependency or Prisma inputs changed |
| Clear cached application state | `php artisan optimize:clear` | No direct equivalent is needed | Not applicable; API recreation starts a fresh Node process |
| Apply pending migrations | `php artisan migrate --force` | The migration runner applies pending `database/migrations/*.sql` files | Yes, on every deployment; already-applied migrations are skipped |
| Seed RBAC data | `php artisan db:seed --class=RbacSeeder --force` | `npm run db:seed:rbac` | Yes, on every deployment |
| Run the full development seed | `php artisan db:seed --force` | `npm run db:seed` | No; it can replace hospital development data |
| Reload application code | PHP-FPM/container reload | Recreate the API container | Yes, on every deployment |
| Confirm successful deployment | Application/HTTP health check | Docker API health check | Yes, on every deployment |


## Important dependency rule

Production deployments should install the exact versions recorded in the lock
file. Therefore:

- Laravel deployments normally use `composer install`, not `composer update`.
- Node deployments normally use `npm ci`, not `npm update`.

`composer update` and `npm update` resolve newer dependency versions and modify
their respective lock files. They belong in a deliberate dependency-update
change that is reviewed and tested before deployment.

## Laravel workflow

A typical Laravel container deployment may run commands similar to:

```bash
docker compose exec -T app composer install \
  --no-interaction \
  --no-dev \
  --prefer-dist \
  --optimize-autoloader

docker compose exec -T app php artisan optimize:clear
docker compose exec -T app php artisan migrate --force
docker compose exec -T app php artisan db:seed --class=RbacSeeder --force
docker compose exec -T app php artisan optimize
```

The exact cache commands depend on the Laravel application. For example,
`php artisan optimize` builds Laravel's production caches, while
`php artisan optimize:clear` removes stale framework caches before rebuilding
them.

## Node/Express workflow in this project

Run the complete production workflow from the backend repository:

```bash
./cicd/bash.sh production
```

The script performs these operations in order:

1. Pushes the configured Git branch and waits for GitHub CI when run locally.
2. Connects to the VPS and pulls the same branch.
3. Validates `docker-compose.prod.yml`.
4. Starts PostgreSQL and waits for its health check.
5. Calculates a runtime hash from the lock file and Prisma inputs.
6. Runs `npm ci`, `npx prisma generate`, and `npm prune --omit=dev` only when
   those runtime inputs changed.
7. Creates the `_SchemaMigration` ledger if it does not exist.
8. Applies every pending SQL file under `database/migrations` in filename order.
9. Runs the repeatable RBAC seeder.
10. Recreates only the API container and waits for it to become healthy.

The deployment exits immediately if CI, dependency installation, Prisma
generation, a migration, the RBAC seed, or the API health check fails.

## Why there is no `optimize:clear` equivalent

Express does not use Laravel's configuration, route, event, and compiled-view
caches. Node loads the application modules and environment configuration when
the process starts. Recreating the API container starts a fresh Node process,
which loads the deployed source and configuration again.

Deleting the npm cache or `node_modules` on every deployment is not an
equivalent operation and is unnecessary. This project refreshes its persistent
dependency volume only when `package-lock.json` or Prisma inputs change.

## Prisma generation is not a database migration

This command generates the Prisma client used by application code:

```bash
npx prisma generate
```

It does not create or alter PostgreSQL tables. Database changes are applied by
the SQL migration runner in `cicd/bash.sh`.

Do not use `npx prisma db push` as a replacement for the production migration
runner. `db push` synchronizes a schema directly and does not provide this
project's ordered, checksummed migration history.

## How SQL migrations work

Migration files use sortable names such as:

```text
database/migrations/001_add_auth_rbac.sql
database/migrations/002_move_visits_to_bookings.sql
database/migrations/003_example_change.sql
```

For each deployment, the runner:

1. Reads the files in filename order.
2. Calculates each file's SHA-256 checksum.
3. Checks `_SchemaMigration` in PostgreSQL.
4. Skips a migration already recorded with the same checksum.
5. Refuses to continue if an already-applied migration was edited.
6. Runs each pending migration and its ledger insert in one transaction.
7. Uses `ON_ERROR_STOP=1`, so any SQL error fails and rolls back that migration.

After a migration has been deployed, do not edit it. Add a new numbered SQL
file for the next change.

## Seeding behavior

The production deployment always runs:

```bash
npm run db:seed:rbac
```

This seeder synchronizes repeatable access-control data. It can run after every
deployment without replacing doctors or patients. The protected software
engineer account is synchronized only when all three optional
`SOFTWARE_ENGINEER_*` values are configured; missing values do not prevent
roles and permissions from being seeded, while partial account configuration
fails safely.

Do not run the following command in production unless replacing the development
hospital dataset is explicitly intended:

```bash
npm run db:seed
```

The full database seeder deletes and recreates booking, patient, and doctor
seed data.

## Working with containers manually

Use the production Compose definition from the backend directory:

```bash
docker compose --env-file .env.production -f docker-compose.prod.yml ps
```

Open a shell in the running API container:

```bash
docker compose --env-file .env.production -f docker-compose.prod.yml \
  exec api sh
```

Run a disposable API task with the project's dependency volume and environment:

```bash
docker compose --env-file .env.production -f docker-compose.prod.yml \
  run --rm api npm run db:seed:rbac
```

Inspect the API logs:

```bash
docker logs --tail 100 prod_express_api
```

For normal deployments, prefer `./cicd/bash.sh production` so migrations,
seeding, container recreation, and health verification remain one consistent
operation.

## Common HTTP failure meanings

| Status | Meaning in this API |
| --- | --- |
| `401 Unauthorized` | The access token is absent, invalid, expired, or its session is inactive |
| `403 Forbidden` | Authentication succeeded, but the user lacks a required permission |
| `500 Internal Server Error` | An unexpected backend failure occurred, such as application code querying a table whose migration was not applied |

Start production diagnosis with:

```bash
docker logs --tail 100 prod_express_api
```

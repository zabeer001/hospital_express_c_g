# How GitHub Actions Improved Backend Deployment

## Overview

The backend uses a CI-assisted deployment process. The production deployment is still executed by [`cicd/bash.sh`](../../cicd/bash.sh), but GitHub Actions adds an automated quality gate before the local script connects to the production VPS.

The workflow is defined in [`.github/workflows/deploy.yml`](../../.github/workflows/deploy.yml). It runs for every push to `main` and can also be started manually. On GitHub's runner, it installs the exact locked dependencies, generates the Prisma client, and runs the automated test suite.

This is more reliable than using only a Bash script because every pushed commit receives a centralized and repeatable CI result. However, the current GitHub Actions workflow does not connect to the VPS or deploy the application by itself; the Bash helper remains the deployment engine.

## Current CI and Deployment Flow

```text
Developer
  |
  | ./cicd/bash.sh local "message"
  | ./cicd/bash.sh production
  v
GitHub main branch
  |
  | push event
  v
GitHub Actions runner
  |
  | npm ci
  | generate Prisma client
  | run Node.js tests
  v
CI result recorded in GitHub
  |
  | local helper watches the result when GitHub CLI is available
  v
Production VPS
  |
  | pull main
  | validate Docker Compose configuration
  | start PostgreSQL and wait for health
  | refresh dependencies and Prisma client when inputs change
  | apply pending SQL migrations
  | seed RBAC data
  | recreate the API container
  | wait for the API health check
  v
Backend deployment completed
```

## Why This Is Better Than a Bash-Only Process

| Concern | Bash-only process | Process with GitHub Actions |
| --- | --- | --- |
| Test environment | Depends on the developer's machine | Uses a clean Ubuntu runner with Node.js `22.14.0` |
| Dependency installation | May reuse local dependencies | Runs `npm ci` from the committed lockfile |
| Prisma validation | May be skipped manually | Generates the Prisma client on every CI run |
| Automated tests | Developer must remember to run them | Runs `npm test` for every push to `main` |
| Visibility | Results exist only in a terminal | CI status and logs are attached to the commit |
| Reproducibility | Depends on local tools and state | Uses a version-controlled workflow with fixed steps |
| Failure diagnosis | Requires local or VPS log access | GitHub identifies the failed CI step and preserves its output |
| Manual verification | Relies on a personal checklist | The same checks run automatically for each pushed commit |

GitHub Actions therefore strengthens the deployment path even though Bash still performs the production operations.

## Responsibilities of Each Layer

### Local Bash Helper

[`cicd/bash.sh`](../../cicd/bash.sh) supports two modes.

In `local` mode, it:

- Requires a commit message.
- Stages all backend changes.
- Creates a local Git commit when staged changes exist.

In `production` mode from a developer machine, it:

- Verifies that deployment is running from the configured branch, which defaults to `main`.
- Rejects uncommitted tracked changes.
- Pushes the branch to the configured Git remote.
- Uses GitHub CLI, when installed and authenticated, to find and watch the matching Actions run.
- Stops before deployment when the watched CI run fails.
- Connects to the VPS through SSH after the CI-watching step.
- Starts the same script on the VPS in server-side deployment mode.

The available commands are summarized in [`cicd/commands`](../../cicd/commands).

### GitHub Actions

The GitHub Actions workflow provides continuous integration for the deployment candidate.

- It runs automatically on pushes to `main`.
- It also supports manual execution through `workflow_dispatch`.
- It checks out the repository with read-only content permission.
- It uses Node.js `22.14.0` and enables the npm cache.
- It installs dependencies using `npm ci`.
- It generates the Prisma client using `npm run prisma:generate`.
- It runs the built-in Node.js test suite using `npm test`.
- It limits the test job to 25 minutes.
- It keeps a visible result and logs for the commit.

Actions is the automated verification layer in the current design. It does not currently hold VPS credentials, establish an SSH connection, apply migrations, or restart production services.

### Production VPS and Docker Compose

After the push and optional CI watch, the Bash helper connects to the server. On the VPS it:

- Pulls the configured production branch unless the caller already pulled it.
- Selects `.env.production` when present, otherwise `.env`.
- Validates `docker-compose.prod.yml` before changing services.
- Starts PostgreSQL and waits for its health check.
- Calculates a runtime hash from `package-lock.json`, `prisma.config.js`, and the Prisma files.
- Reinstalls dependencies and regenerates the Prisma client only when those runtime inputs changed.
- Creates a database migration ledger when it does not exist.
- Applies each pending SQL migration in a single transaction.
- Refuses to continue if an already-applied migration file has been modified.
- Seeds the RBAC data.
- Recreates only the API service.
- Polls the API container until it becomes healthy and prints recent logs on failure.

This separation keeps CI checks on GitHub's clean runner while retaining environment-specific database and container operations on the VPS.

## How GitHub Actions Helps Deployment

### Automated quality gate

Every push to `main` starts the same dependency installation, Prisma generation, and test sequence. This catches failures before or during the developer's production command rather than depending entirely on somebody remembering a manual checklist.

### Commit-level traceability

Each workflow run is associated with a specific commit, triggering user, timestamp, and result. The team can identify whether the exact code pushed for deployment passed CI.

### Consistent execution environment

CI runs on a clean Ubuntu runner with a fixed Node.js version. This reduces false confidence caused by undeclared packages, stale generated Prisma clients, or other state left on a developer's machine.

### Centralized failure logs

When dependency installation, Prisma generation, or a test fails, GitHub records the failing step and its output. Authorized collaborators can inspect the result without accessing the developer's computer or production server.

### Integration with the local workflow

When GitHub CLI is installed and authenticated, the production helper locates the workflow run for the pushed `HEAD` commit and watches it with `--exit-status`. A failed watched run causes the Bash script to stop instead of continuing to SSH deployment.

## Deployment Safety Provided by Bash

GitHub Actions is only one layer of the current process. The server-side Bash workflow adds separate production safeguards:

1. `set -Eeuo pipefail` stops execution on failed commands, unset variables, and failed pipeline stages.
2. Branch and working-tree checks reduce the risk of pushing unintended local code.
3. Docker Compose configuration is validated before services are changed.
4. PostgreSQL must become healthy before migrations or API startup proceed.
5. Runtime dependencies are refreshed only when their source inputs change.
6. Migration checksums prevent silent modification of previously applied SQL migrations.
7. Each new migration runs transactionally with PostgreSQL's `ON_ERROR_STOP` enabled.
8. Only the API container is recreated after database preparation.
9. Deployment succeeds only after the API container reports a healthy state.

GitHub Actions verifies the code in a neutral environment; the Bash script verifies and changes production state.

## Current Limitations

The current workflow is not full continuous deployment. Important limitations are:

- GitHub Actions stops after testing and does not initiate the VPS deployment.
- Deployment still requires a developer to run `./cicd/bash.sh production`.
- If GitHub CLI is unavailable or unauthenticated, the Bash helper skips watching CI and continues toward the VPS deployment.
- The workflow has no explicit concurrency group for CI runs.
- No GitHub Environment approval protects production because Actions does not own the deployment job.
- VPS credentials remain in local or server environment configuration rather than protected GitHub environment secrets.
- The server pulls the branch name rather than checking out the exact commit SHA reported by CI.
- Database migrations and RBAC seeding occur during deployment and are not automatically rolled back if later startup fails.
- Recreating the API container is an in-place deployment, not a blue-green or rolling release.
- A failed API health check reports logs but does not automatically restore the previous application version.

These limitations do not remove the value of CI, but they mean a green workflow and a successful production deployment are still separate outcomes.

## Recommended Next Steps

1. Add a dedicated deployment job that depends on the test job with `needs: test`.
2. Run the production SSH step from GitHub Actions only after CI succeeds.
3. Protect the deployment job with a GitHub `production` environment and required approval if appropriate.
4. Store an SSH private key, host, user, port, project directory, and container name as protected environment secrets.
5. Use a dedicated least-privileged deployment user instead of root/password authentication.
6. Deploy the exact tested commit SHA rather than pulling whichever commit is currently at the branch tip.
7. Add a production concurrency group so two deployments cannot modify the VPS simultaneously.
8. Record or tag the deployed revision and retain a known-good release for rollback.
9. Add an external HTTP smoke test after the container becomes healthy.
10. Define a rollback strategy for API startup or migration failures.

With these changes, GitHub Actions would move from being a CI quality gate to controlling the complete CI/CD process.

## Summary

The backend no longer relies only on developer-run validation before deployment. GitHub Actions automatically installs locked dependencies, generates the Prisma client, runs tests in a clean environment, and records the result for every push to `main`. The Bash helper still pushes code, connects to the VPS, applies migrations, seeds RBAC data, and restarts the API.

The current design is therefore best described as GitHub Actions-assisted deployment: Actions supplies repeatable CI and traceability, while Bash performs production delivery. Moving the SSH deployment behind a required successful Actions job would complete the transition to fully automated CI/CD.

#!/usr/bin/env bash

set -Eeuo pipefail

MODE="${1:-local}"
MODE_ARGUMENT="${2:-}"
SCRIPT_DIR="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(cd -- "${SCRIPT_DIR}/.." && pwd)"
ENV_FILE="${PROJECT_DIR}/.env"

if [[ ! -f "${ENV_FILE}" ]]; then
    echo "Missing ${ENV_FILE}." >&2
    exit 1
fi

read_env_value() {
    local key="$1"
    local value

    value="$(awk -v target="${key}" '
        $0 !~ /^[[:space:]]*#/ && index($0, target "=") == 1 {
            print substr($0, length(target) + 2)
            exit
        }
    ' "${ENV_FILE}")"
    value="${value%$'\r'}"

    if [[ "${value}" == \"*\" && "${value}" == *\" ]]; then
        value="${value:1:${#value}-2}"
    elif [[ "${value}" == \'*\' && "${value}" == *\' ]]; then
        value="${value:1:${#value}-2}"
    fi

    printf '%s' "${value}"
}

env_or_default() {
    local key="$1"
    local default_value="${2:-}"
    local shell_value="${!key-}"
    local file_value

    if [[ -n "${shell_value}" ]]; then
        printf '%s' "${shell_value}"
        return
    fi

    file_value="$(read_env_value "${key}")"
    printf '%s' "${file_value:-${default_value}}"
}

VPS_PROJECT_DIR="$(env_or_default VPS_PROJECT_DIR)"
VPS_APP_CONTAINER="$(env_or_default VPS_APP_CONTAINER prod_express_api)"
SSH_TARGET="$(env_or_default VPS_ROOT_ACCESS)"
SSH_TARGET="${SSH_TARGET#ssh }"
SSH_PASSWORD="$(env_or_default VPS_PASSWORD)"
SSH_PORT="$(env_or_default VPS_SSH_PORT 22)"
GIT_REMOTE="$(env_or_default DEPLOY_GIT_REMOTE origin)"
GIT_BRANCH="$(env_or_default DEPLOY_GIT_BRANCH main)"

usage() {
    printf '%s\n' \
        "Usage:" \
        "  $0 local \"commit message\"" \
        "  $0 production"
}

require_value() {
    local name="$1"
    local value="$2"

    if [[ -z "${value}" ]]; then
        echo "${name} is not configured in ${ENV_FILE}." >&2
        exit 1
    fi
}

step() {
    printf '\n==> %s\n' "$*"
}

case "${MODE}" in
    local)
        COMMIT_MESSAGE="${MODE_ARGUMENT}"
        ;;
    production|prod)
        MODE=production
        REMOTE_STATE="${MODE_ARGUMENT}"
        if [[ -n "${REMOTE_STATE}" && "${REMOTE_STATE}" != "--already-pulled" ]]; then
            echo "Unknown option: ${REMOTE_STATE}" >&2
            usage >&2
            exit 2
        fi
        ;;
    -h|--help|help)
        usage
        exit 0
        ;;
    *)
        echo "Unknown mode: ${MODE}" >&2
        usage >&2
        exit 2
        ;;
esac

if [[ "${MODE}" == local ]]; then
    cd "${PROJECT_DIR}"

    if [[ -z "${COMMIT_MESSAGE}" ]]; then
        echo "A commit message is required." >&2
        usage >&2
        exit 1
    fi

    step "Staging backend changes"
    git add --all

    if git diff --cached --quiet; then
        echo "No backend changes to commit."
        exit 0
    fi

    step "Creating local commit"
    git commit -m "${COMMIT_MESSAGE}"
    echo "Local commit created. Run '$0 production' to deploy it."
    exit 0
fi

require_value VPS_PROJECT_DIR "${VPS_PROJECT_DIR}"
require_value VPS_APP_CONTAINER "${VPS_APP_CONTAINER}"

IS_VPS=false
if [[ -d "${VPS_PROJECT_DIR}" ]]; then
    NORMALIZED_VPS_DIR="$(cd -- "${VPS_PROJECT_DIR}" && pwd)"
    [[ "${PROJECT_DIR}" == "${NORMALIZED_VPS_DIR}" ]] && IS_VPS=true
fi

if [[ "${IS_VPS}" == false ]]; then
    require_value VPS_ROOT_ACCESS "${SSH_TARGET}"

    if [[ ! "${SSH_TARGET}" =~ ^[A-Za-z0-9._-]+@([A-Za-z0-9.-]+|\[[A-Fa-f0-9:]+\])$ ]]; then
        echo "VPS_ROOT_ACCESS must use the format: ssh user@host" >&2
        exit 1
    fi

    if [[ ! "${SSH_PORT}" =~ ^[0-9]+$ ]] || (( SSH_PORT < 1 || SSH_PORT > 65535 )); then
        echo "VPS_SSH_PORT must be a number from 1 to 65535." >&2
        exit 1
    fi

    cd "${PROJECT_DIR}"

    if [[ "$(git branch --show-current)" != "${GIT_BRANCH}" ]]; then
        echo "Production deployment must run from ${GIT_BRANCH}." >&2
        exit 1
    fi

    if ! git diff --quiet || ! git diff --cached --quiet; then
        echo "Uncommitted changes found. Commit them with the local command first." >&2
        exit 1
    fi

    step "Pushing ${GIT_BRANCH} to ${GIT_REMOTE}"
    git push "${GIT_REMOTE}" "${GIT_BRANCH}"

    if command -v gh >/dev/null 2>&1 && gh auth status >/dev/null 2>&1; then
        HEAD_SHA="$(git rev-parse HEAD)"
        RUN_ID=""
        for attempt in $(seq 1 15); do
            RUN_ID="$(gh run list --workflow deploy.yml --commit "${HEAD_SHA}" --limit 1 --json databaseId --jq '.[0].databaseId')"
            [[ -n "${RUN_ID}" ]] && break
            sleep 2
        done

        if [[ -n "${RUN_ID}" ]]; then
            step "Waiting for GitHub CI"
            gh run watch "${RUN_ID}" --exit-status
        fi
    fi

    printf -v QUOTED_VPS_DIR '%q' "${VPS_PROJECT_DIR}"
    printf -v QUOTED_CONTAINER '%q' "${VPS_APP_CONTAINER}"
    printf -v QUOTED_REMOTE '%q' "${GIT_REMOTE}"
    printf -v QUOTED_BRANCH '%q' "${GIT_BRANCH}"
    REMOTE_COMMAND="cd ${QUOTED_VPS_DIR} && git pull ${QUOTED_REMOTE} ${QUOTED_BRANCH} && chmod +x cicd/bash.sh && env VPS_PROJECT_DIR=${QUOTED_VPS_DIR} VPS_APP_CONTAINER=${QUOTED_CONTAINER} DEPLOY_GIT_REMOTE=${QUOTED_REMOTE} DEPLOY_GIT_BRANCH=${QUOTED_BRANCH} ./cicd/bash.sh production --already-pulled"
    SSH_COMMAND=(ssh -p "${SSH_PORT}" -o StrictHostKeyChecking=accept-new "${SSH_TARGET}" "${REMOTE_COMMAND}")

    step "Connecting to ${SSH_TARGET} and deploying"
    if [[ -n "${SSH_PASSWORD}" ]]; then
        command -v sshpass >/dev/null 2>&1 || {
            echo "sshpass is required when VPS_PASSWORD is set." >&2
            exit 1
        }
        SSHPASS="${SSH_PASSWORD}" sshpass -e "${SSH_COMMAND[@]}"
    else
        "${SSH_COMMAND[@]}"
    fi
    exit $?
fi

cd "${PROJECT_DIR}"

if [[ "${REMOTE_STATE:-}" != "--already-pulled" ]]; then
    step "Pulling ${GIT_BRANCH} from ${GIT_REMOTE}"
    git pull "${GIT_REMOTE}" "${GIT_BRANCH}"
fi

if [[ -f .env.production ]]; then
    VPS_ENV_FILE=.env.production
else
    VPS_ENV_FILE=.env
fi

COMPOSE=(docker compose --env-file "${VPS_ENV_FILE}" -f docker-compose.prod.yml)
"${COMPOSE[@]}" config --quiet

step "Starting PostgreSQL and waiting for it to become healthy"
"${COMPOSE[@]}" up -d --wait db

RUNTIME_HASH="$({
    sha256sum package-lock.json prisma.config.js
    find prisma -type f -print0 | sort -z | xargs -0 sha256sum
} | sha256sum | cut -d' ' -f1)"

if ! "${COMPOSE[@]}" run --rm --no-deps \
    -e EXPECTED_RUNTIME_HASH="${RUNTIME_HASH}" \
    api sh -c 'test "$(cat node_modules/.runtime-hash 2>/dev/null)" = "$EXPECTED_RUNTIME_HASH"'; then
    step "Installing dependencies and generating the Prisma client"
    "${COMPOSE[@]}" run --rm --no-deps --user root \
        -e EXPECTED_RUNTIME_HASH="${RUNTIME_HASH}" \
        api sh -c 'npm ci --include=dev && npx prisma generate && npm prune --omit=dev --package-lock=false && printf "%s" "$EXPECTED_RUNTIME_HASH" > node_modules/.runtime-hash'
else
    step "Dependencies unchanged; skipping npm install"
fi

step "Applying database migrations"
"${COMPOSE[@]}" exec -T db sh -c \
    'psql -v ON_ERROR_STOP=1 -U "$POSTGRES_USER" -d "$POSTGRES_DB"' \
    < database/migrations/001_add_auth_rbac.sql

step "Seeding RBAC data"
"${COMPOSE[@]}" run --rm api npm run db:seed:rbac

step "Recreating only the API container"
"${COMPOSE[@]}" up -d --no-deps --no-build --force-recreate api

for attempt in $(seq 1 18); do
    STATUS="$(docker inspect --format '{{if .State.Health}}{{.State.Health.Status}}{{else}}{{.State.Status}}{{end}}' "${VPS_APP_CONTAINER}")"

    if [[ "${STATUS}" == healthy ]]; then
        docker ps --filter "name=^/${VPS_APP_CONTAINER}$" --format 'deployed: {{.Names}} ({{.Status}})'
        exit 0
    fi

    if [[ "${STATUS}" == unhealthy || "${STATUS}" == exited || "${STATUS}" == dead ]]; then
        docker logs --tail 100 "${VPS_APP_CONTAINER}"
        exit 1
    fi

    sleep 5
done

docker logs --tail 100 "${VPS_APP_CONTAINER}"
echo "API container did not become healthy before the timeout" >&2
exit 1

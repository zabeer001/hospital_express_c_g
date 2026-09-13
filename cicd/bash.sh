#!/usr/bin/env bash

set -Eeuo pipefail

PROJECT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$PROJECT_DIR"

usage() {
  cat <<'EOF'
Usage:
  ./cicd/bash.sh setup
  ./cicd/bash.sh local "your commit message"
  ./cicd/bash.sh production
EOF
}

case "${1:-}" in
  setup)
    if ! command -v gh >/dev/null 2>&1; then
      echo "GitHub CLI (gh) is required for setup." >&2
      exit 1
    fi

    gh auth status || gh auth login -h github.com

    if [ ! -f .env ]; then
      echo "Missing .env in $PROJECT_DIR" >&2
      exit 1
    fi

    set -a
    source .env
    set +a

    : "${VPS_ROOT_ACCESS:?Missing VPS_ROOT_ACCESS in .env}"
    : "${VPS_PASSWORD:?Missing VPS_PASSWORD in .env}"
    : "${VPS_PROJECT_DIR:?Missing VPS_PROJECT_DIR in .env}"
    : "${VPS_APP_CONTAINER:?Missing VPS_APP_CONTAINER in .env}"

    printf '%s' "$VPS_ROOT_ACCESS" | gh secret set VPS_ROOT_ACCESS
    printf '%s' "$VPS_PASSWORD" | gh secret set VPS_PASSWORD
    printf '%s' "$VPS_PROJECT_DIR" | gh secret set VPS_PROJECT_DIR
    printf '%s' "$VPS_APP_CONTAINER" | gh secret set VPS_APP_CONTAINER

    echo "GitHub Actions deployment secrets configured."
    ;;

  local)
    COMMIT_MESSAGE="${2:-}"

    if [ -z "$COMMIT_MESSAGE" ]; then
      echo "A commit message is required." >&2
      usage
      exit 1
    fi

    git add --all

    if git diff --cached --quiet; then
      echo "No backend changes to commit."
      exit 0
    fi

    git commit -m "$COMMIT_MESSAGE"
    echo "Local commit created. Run './cicd/bash.sh production' to deploy it."
    ;;

  production)
    CURRENT_BRANCH="$(git branch --show-current)"

    if [ "$CURRENT_BRANCH" != "main" ]; then
      echo "Production deployment must run from main; current branch: $CURRENT_BRANCH" >&2
      exit 1
    fi

    if ! git diff --quiet || ! git diff --cached --quiet; then
      echo "Uncommitted changes found. Commit them with the local command first." >&2
      exit 1
    fi

    HEAD_SHA="$(git rev-parse HEAD)"
    git push origin main

    if command -v gh >/dev/null 2>&1 && gh auth status >/dev/null 2>&1; then
      RUN_ID=""
      for attempt in $(seq 1 15); do
        RUN_ID="$(gh run list --workflow deploy.yml --commit "$HEAD_SHA" --limit 1 --json databaseId --jq '.[0].databaseId')"
        if [ -n "$RUN_ID" ]; then
          break
        fi
        sleep 2
      done

      if [ -n "$RUN_ID" ]; then
        gh run watch "$RUN_ID" --exit-status
      else
        echo "Push completed. Check GitHub Actions for deployment status."
      fi
    else
      echo "Push completed. Check GitHub Actions for deployment status."
    fi
    ;;

  *)
    usage
    exit 1
    ;;
esac

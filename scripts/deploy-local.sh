#!/usr/bin/env bash

set -euo pipefail

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"

ENVIRONMENT="production"
DRY_RUN=false
SKIP_INSTALL=false
SECRETS_FILE=""

log_info() {
  echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
  echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_warn() {
  echo -e "${YELLOW}[WARN]${NC} $1"
}

log_error() {
  echo -e "${RED}[ERROR]${NC} $1"
}

usage() {
  cat <<EOF
Usage: ./scripts/deploy-local.sh [options]

Options:
  --env <production|staging>  Deployment environment (default: production)
  --dry-run                   Build only, skip deploy
  --skip-install              Skip pnpm install
  --secrets-file <path>       Load env vars from file before deploying
  --help                      Show this help

Required environment variables:
  CLOUDFLARE_ACCOUNT_ID
  CLOUDFLARE_API_TOKEN

Optional environment variables:
  NEXT_PUBLIC_CMS_URL
  NEXT_PUBLIC_SITE_URL
EOF
}

while [[ $# -gt 0 ]]; do
  case "$1" in
    --env)
      ENVIRONMENT="${2:-}"
      shift 2
      ;;
    --dry-run)
      DRY_RUN=true
      shift
      ;;
    --skip-install)
      SKIP_INSTALL=true
      shift
      ;;
    --secrets-file)
      SECRETS_FILE="${2:-}"
      shift 2
      ;;
    --help|-h)
      usage
      exit 0
      ;;
    *)
      log_error "Unknown option: $1"
      usage
      exit 1
      ;;
  esac
done

if [[ "$ENVIRONMENT" != "production" && "$ENVIRONMENT" != "staging" ]]; then
  log_error "Invalid --env value: $ENVIRONMENT"
  exit 1
fi

if [[ -n "$SECRETS_FILE" ]]; then
  if [[ ! -f "$SECRETS_FILE" ]]; then
    log_error "Secrets file not found: $SECRETS_FILE"
    exit 1
  fi
  log_info "Loading secrets from: $SECRETS_FILE"
  # shellcheck disable=SC1090
  source "$SECRETS_FILE"
fi

if [[ -z "${CLOUDFLARE_ACCOUNT_ID:-}" ]]; then
  log_error "CLOUDFLARE_ACCOUNT_ID is required"
  exit 1
fi

if [[ -z "${CLOUDFLARE_API_TOKEN:-}" ]]; then
  log_error "CLOUDFLARE_API_TOKEN is required"
  exit 1
fi

export NEXT_PUBLIC_CMS_URL="${NEXT_PUBLIC_CMS_URL:-https://publicapi.expertbeacon.com}"
if [[ "$ENVIRONMENT" == "staging" ]]; then
  export NEXT_PUBLIC_SITE_URL="${NEXT_PUBLIC_SITE_URL:-https://api-navigator-staging.workers.dev}"
else
  export NEXT_PUBLIC_SITE_URL="${NEXT_PUBLIC_SITE_URL:-https://public-api.org}"
fi

log_info "Environment: $ENVIRONMENT"
log_info "Dry run: $DRY_RUN"
log_info "CMS URL: $NEXT_PUBLIC_CMS_URL"
log_info "Site URL: $NEXT_PUBLIC_SITE_URL"

cd "$PROJECT_ROOT"

if [[ "$SKIP_INSTALL" == false ]]; then
  log_info "Installing dependencies"
  pnpm install --frozen-lockfile
fi

log_info "Building shared package"
pnpm --filter @api-navigator/shared build

log_info "Building frontend worker"
pnpm --filter @api-navigator/frontend build:worker

if [[ "$DRY_RUN" == true ]]; then
  log_success "Dry run complete, deploy skipped"
  exit 0
fi

if [[ "$ENVIRONMENT" == "staging" ]]; then
  log_info "Deploying staging worker"
  pnpm --filter @api-navigator/frontend deploy:worker --env staging
else
  log_info "Deploying production worker"
  pnpm --filter @api-navigator/frontend deploy:worker
fi

log_success "Deployment complete"
log_info "Verify: curl -I ${NEXT_PUBLIC_SITE_URL}"

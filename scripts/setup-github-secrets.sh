#!/bin/bash
# Setup GitHub Secrets for Cloudflare Workers Deployment
# This script configures all necessary secrets for GitHub Actions

set -e

# Color output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${GREEN}🔐 API Navigator - GitHub Secrets Setup${NC}"
echo "=========================================="
echo ""

# Check if gh CLI is installed
if ! command -v gh &> /dev/null; then
    echo -e "${RED}❌ Error: GitHub CLI (gh) is not installed${NC}"
    echo "Install it from: https://cli.github.com/"
    exit 1
fi

# Load environment variables from the secrets file
SECRETS_FILE="/Volumes/SSD/dev/project/timezone/whatismytimezone/.env.local"
if [ -f "$SECRETS_FILE" ]; then
    echo -e "${YELLOW}📝 Loading secrets from ${SECRETS_FILE}${NC}"
    source "$SECRETS_FILE"
else
    echo -e "${RED}❌ Error: Secrets file not found at ${SECRETS_FILE}${NC}"
    exit 1
fi

# Verify required secrets are set
if [ -z "$GITHUB_TOKEN" ]; then
    echo -e "${RED}❌ Error: GITHUB_TOKEN not found${NC}"
    exit 1
fi

if [ -z "$CLOUDFLARE_API_TOKEN" ]; then
    echo -e "${RED}❌ Error: CLOUDFLARE_API_TOKEN not found${NC}"
    exit 1
fi

if [ -z "$CLOUDFLARE_ACCOUNT_ID" ]; then
    echo -e "${RED}❌ Error: CLOUDFLARE_ACCOUNT_ID not found${NC}"
    exit 1
fi

export GITHUB_TOKEN

# Get current user and repository
CURRENT_USER=$(gh api user -q .login)
REPO_NAME="api-navigator"
REPO_FULL="$CURRENT_USER/$REPO_NAME"

echo -e "${YELLOW}🔐 Checking GitHub authentication...${NC}"
if ! gh auth status &> /dev/null; then
    echo -e "${RED}❌ Error: Not authenticated with GitHub${NC}"
    exit 1
fi

echo -e "${GREEN}✅ Authenticated as: ${CURRENT_USER}${NC}"

# Check if repository exists
if ! gh repo view "$REPO_FULL" &> /dev/null; then
    echo -e "${RED}❌ Error: Repository not found: $REPO_FULL${NC}"
    echo "Please run ./scripts/setup-github-repo.sh first"
    exit 1
fi

echo ""
echo -e "${YELLOW}📦 Target Repository: $REPO_FULL${NC}"
echo ""

# Cloudflare KV Namespace IDs (already created)
KV_NAMESPACE_ID="d4c0b50e105c4e83b541ec2ec52e0573"
KV_PREVIEW_NAMESPACE_ID="78821ba5c1614da8984211b260b68e60"

# Default environment variables
NEXT_PUBLIC_CMS_URL="${NEXT_PUBLIC_CMS_URL:-https://cms.api-navigator.com}"
NEXT_PUBLIC_SITE_URL="${NEXT_PUBLIC_SITE_URL:-https://public-api.org}"

echo -e "${YELLOW}🔑 Setting GitHub Secrets...${NC}"
echo ""

# Set Cloudflare API Token
echo "  → CLOUDFLARE_API_TOKEN"
gh secret set CLOUDFLARE_API_TOKEN \
  --body "$CLOUDFLARE_API_TOKEN" \
  --repo "$REPO_FULL"

# Set Cloudflare Account ID
echo "  → CLOUDFLARE_ACCOUNT_ID"
gh secret set CLOUDFLARE_ACCOUNT_ID \
  --body "$CLOUDFLARE_ACCOUNT_ID" \
  --repo "$REPO_FULL"

# Set KV Namespace ID (Production)
echo "  → CLOUDFLARE_KV_NAMESPACE_ID"
gh secret set CLOUDFLARE_KV_NAMESPACE_ID \
  --body "$KV_NAMESPACE_ID" \
  --repo "$REPO_FULL"

# Set KV Preview Namespace ID
echo "  → CLOUDFLARE_KV_PREVIEW_NAMESPACE_ID"
gh secret set CLOUDFLARE_KV_PREVIEW_NAMESPACE_ID \
  --body "$KV_PREVIEW_NAMESPACE_ID" \
  --repo "$REPO_FULL"

# Set Next.js public environment variables (optional)
echo "  → NEXT_PUBLIC_CMS_URL"
gh secret set NEXT_PUBLIC_CMS_URL \
  --body "$NEXT_PUBLIC_CMS_URL" \
  --repo "$REPO_FULL"

echo "  → NEXT_PUBLIC_SITE_URL"
gh secret set NEXT_PUBLIC_SITE_URL \
  --body "$NEXT_PUBLIC_SITE_URL" \
  --repo "$REPO_FULL"

echo ""
echo -e "${GREEN}✅ All secrets configured successfully!${NC}"
echo ""

# List all secrets (names only)
echo -e "${YELLOW}📋 Configured Secrets:${NC}"
gh secret list --repo "$REPO_FULL"

echo ""
echo -e "${GREEN}��� Setup complete!${NC}"
echo ""
echo "Next steps:"
echo "  1. Verify secrets: gh secret list --repo $REPO_FULL"
echo "  2. Trigger deployment: git push deploy main"
echo "  3. Monitor deployment: gh run list --workflow=deploy-frontend.yml --repo $REPO_FULL"
echo ""
echo "GitHub Actions: https://github.com/$REPO_FULL/actions"

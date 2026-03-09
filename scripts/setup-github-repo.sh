#!/bin/bash
# Setup GitHub Repository and Push Code
# This script creates a new GitHub repository and pushes the code

set -e

# Color output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${GREEN}🚀 API Navigator - GitHub Repository Setup${NC}"
echo "=============================================="
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

# Verify GITHUB_TOKEN is set
if [ -z "$GITHUB_TOKEN" ]; then
    echo -e "${RED}❌ Error: GITHUB_TOKEN not found in secrets file${NC}"
    exit 1
fi

export GITHUB_TOKEN

# Check authentication
echo -e "${YELLOW}🔐 Checking GitHub authentication...${NC}"
if ! gh auth status &> /dev/null; then
    echo -e "${RED}❌ Error: Not authenticated with GitHub${NC}"
    exit 1
fi

CURRENT_USER=$(gh api user -q .login)
echo -e "${GREEN}✅ Authenticated as: ${CURRENT_USER}${NC}"
echo ""

# Repository configuration
REPO_NAME="api-navigator"
REPO_VISIBILITY="public"  # Change to "private" if needed
REPO_DESCRIPTION="API Navigator - Public API Directory with Health Monitoring and Real-time Status"

echo -e "${YELLOW}📦 Repository Configuration:${NC}"
echo "  Name: $REPO_NAME"
echo "  Visibility: $REPO_VISIBILITY"
echo "  Description: $REPO_DESCRIPTION"
echo ""

# Check if repository already exists
if gh repo view "$CURRENT_USER/$REPO_NAME" &> /dev/null; then
    echo -e "${YELLOW}⚠️  Repository already exists: $CURRENT_USER/$REPO_NAME${NC}"
    read -p "Do you want to use the existing repository? (y/n) " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        echo -e "${RED}❌ Aborted${NC}"
        exit 1
    fi
else
    # Create new repository
    echo -e "${YELLOW}📝 Creating GitHub repository...${NC}"
    gh repo create "$REPO_NAME" \
        --${REPO_VISIBILITY} \
        --description "$REPO_DESCRIPTION" \
        --confirm

    echo -e "${GREEN}✅ Repository created: https://github.com/$CURRENT_USER/$REPO_NAME${NC}"
fi

# Configure git remote
REMOTE_NAME="deploy"
REMOTE_URL="https://${GITHUB_TOKEN}@github.com/$CURRENT_USER/$REPO_NAME.git"

echo -e "${YELLOW}🔗 Configuring git remote...${NC}"

# Remove existing remote if it exists
if git remote get-url "$REMOTE_NAME" &> /dev/null; then
    git remote remove "$REMOTE_NAME"
    echo "  Removed existing remote: $REMOTE_NAME"
fi

# Add new remote
git remote add "$REMOTE_NAME" "$REMOTE_URL"
echo -e "${GREEN}✅ Remote added: $REMOTE_NAME${NC}"

# Push code
echo ""
echo -e "${YELLOW}📤 Pushing code to GitHub...${NC}"
git push "$REMOTE_NAME" main

echo -e "${GREEN}✅ Code pushed successfully!${NC}"
echo ""

# Clean up Git config to remove token
echo -e "${YELLOW}🧹 Cleaning up git remote URL (removing token)...${NC}"
CLEAN_URL="https://github.com/$CURRENT_USER/$REPO_NAME.git"
git remote set-url "$REMOTE_NAME" "$CLEAN_URL"
echo -e "${GREEN}✅ Remote URL cleaned${NC}"

echo ""
echo -e "${GREEN}🎉 Setup complete!${NC}"
echo ""
echo "Next steps:"
echo "  1. Configure GitHub Secrets: ./scripts/setup-github-secrets.sh"
echo "  2. Trigger deployment: git push deploy main"
echo ""
echo "Repository URL: https://github.com/$CURRENT_USER/$REPO_NAME"
echo "Actions URL: https://github.com/$CURRENT_USER/$REPO_NAME/actions"

#!/usr/bin/env bash
# CoolHan Update Checker (Shell version)
# Usage: bash scripts/check-update.sh

set -euo pipefail

REPO="zmjckim-fa/coolhan"
VERSION_FILE="$HOME/.coolhan-version.json"

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
BOLD='\033[1m'
NC='\033[0m'

echo -e "\n${BLUE}🔍 Checking for updates...${NC}"

# Read installed version
INSTALLED_VERSION=""
if [ -f "$VERSION_FILE" ]; then
    INSTALLED_VERSION=$(python3 -c "import json; d=json.load(open('$VERSION_FILE')); print(d.get('version',''))" 2>/dev/null || \
                       node -e "const d=require('$VERSION_FILE'); console.log(d.version||'')" 2>/dev/null || \
                       grep -o '"version":"[^"]*"' "$VERSION_FILE" | head -1 | cut -d'"' -f4 || echo "")
fi

if [ -z "$INSTALLED_VERSION" ]; then
    echo -e "${YELLOW}⚠️  Install info not found.${NC}"
    echo -e "${CYAN}   Reinstall: curl -fsSL https://raw.githubusercontent.com/${REPO}/main/install.sh | bash${NC}"
    exit 0
fi

echo -e "${BLUE}   Installed version: $INSTALLED_VERSION${NC}"

# Fetch latest release from GitHub API
LATEST=$(curl -sf "https://api.github.com/repos/${REPO}/releases/latest" \
         -H "Accept: application/vnd.github.v3+json" \
         -H "User-Agent: coolhan-update-checker/1.0" \
         2>/dev/null | \
         (python3 -c "import json,sys; d=json.load(sys.stdin); print(d.get('tag_name',''))" 2>/dev/null || \
          grep -o '"tag_name":"[^"]*"' | head -1 | cut -d'"' -f4)) || LATEST=""

if [ -z "$LATEST" ]; then
    echo -e "${YELLOW}⚠️  Update check failed. Check manually: https://github.com/${REPO}/releases${NC}"
    exit 0
fi

# Compare versions (strip 'v' prefix)
INST_CLEAN="${INSTALLED_VERSION#v}"
LATEST_CLEAN="${LATEST#v}"

if [ "$INST_CLEAN" = "$LATEST_CLEAN" ]; then
    echo -e "${GREEN}✅ CoolHan ${INSTALLED_VERSION} — Up to date.${NC}"
else
    # Simple version comparison
    NEEDS_UPDATE=false
    IFS='.' read -ra INST_PARTS <<< "$INST_CLEAN"
    IFS='.' read -ra LATEST_PARTS <<< "$LATEST_CLEAN"

    for i in 0 1 2; do
        INST_PART="${INST_PARTS[$i]:-0}"
        LATEST_PART="${LATEST_PARTS[$i]:-0}"
        if [ "$INST_PART" -lt "$LATEST_PART" ] 2>/dev/null; then
            NEEDS_UPDATE=true
            break
        elif [ "$INST_PART" -gt "$LATEST_PART" ] 2>/dev/null; then
            break
        fi
    done

    if $NEEDS_UPDATE; then
        echo ""
        echo -e "${YELLOW}╔══════════════════════════════════════════════════════════════╗${NC}"
        echo -e "${YELLOW}║${BOLD}  🚀 CoolHan Update Available!                              ${NC}${YELLOW}║${NC}"
        echo -e "${YELLOW}╠══════════════════════════════════════════════════════════════╣${NC}"
        echo -e "${YELLOW}║${NC}  Current: ${RED}${INSTALLED_VERSION}${NC}  →  Latest: ${GREEN}${LATEST}${NC}  ✨ NEW        ${YELLOW}║${NC}"
        echo -e "${YELLOW}╠══════════════════════════════════════════════════════════════╣${NC}"
        echo -e "${YELLOW}║${NC}  ${CYAN}# Linux/macOS:${NC}                                             ${YELLOW}║${NC}"
        echo -e "${YELLOW}║${NC}  ${CYAN}curl -fsSL https://raw.githubusercontent.com/${REPO}/main/install.sh | bash${NC}${YELLOW}║${NC}"
        echo -e "${YELLOW}║${NC}  ${CYAN}# Windows:${NC}                                                 ${YELLOW}║${NC}"
        echo -e "${YELLOW}║${NC}  ${CYAN}iwr https://raw.githubusercontent.com/${REPO}/main/install.ps1 | iex${NC}${YELLOW}║${NC}"
        echo -e "${YELLOW}╚══════════════════════════════════════════════════════════════╝${NC}"
        echo ""
    else
        echo -e "${GREEN}✅ CoolHan ${INSTALLED_VERSION} — Up to date.${NC}"
    fi
fi

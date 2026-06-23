#!/bin/bash

# CoolHan Framework Installer for Linux/macOS
#
# Usage:
#   curl -fsSL https://raw.githubusercontent.com/zmjckim-fa/coolhan/main/install.sh | bash
#   or
#   bash install.sh

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

log_info() {
  echo -e "${BLUE}ℹ️  $1${NC}"
}

log_success() {
  echo -e "${GREEN}✅ $1${NC}"
}

log_error() {
  echo -e "${RED}❌ $1${NC}"
  exit 1
}

log_warn() {
  echo -e "${YELLOW}⚠️  $1${NC}"
}

# Main installation
main() {
  echo -e "\n${BLUE}🚀 CoolHan Framework Installer${NC}\n"

  CURRENT_DIR=$(pwd)
  SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"

  log_info "Install location: $CURRENT_DIR"

  # Step 1: Check Node.js (optional)
  if command -v node &> /dev/null; then
    NODE_VERSION=$(node -v)
    log_success "Node.js installed: $NODE_VERSION"
  else
    log_warn "Node.js is not installed (optional)"
  fi

  # Step 2: Create directories
  echo -e "\n${BLUE}📁 Step 1: Creating directory structure...${NC}"

  mkdir -p "$CURRENT_DIR/.claude"
  mkdir -p "$CURRENT_DIR/.claude/agents"
  mkdir -p "$CURRENT_DIR/.claude/skills"
  mkdir -p "$CURRENT_DIR/.claude/hooks"
  mkdir -p "$CURRENT_DIR/.claude/parsed"
  mkdir -p "$CURRENT_DIR/.claude/analysis"
  mkdir -p "$CURRENT_DIR/.claude/logs"
  mkdir -p "$CURRENT_DIR/.claude/locks"

  log_success "Directories have been created"

  # Step 3: Copy files
  echo -e "\n${BLUE}📋 Step 2: Copying files...${NC}"

  # Copy main files
  for file in CLAUDE.md LICENSE README.md GITHUB_UPLOAD_CHECKLIST.md DOCUMENT_GUIDE.md; do
    if [ -f "$SCRIPT_DIR/$file" ]; then
      cp "$SCRIPT_DIR/$file" "$CURRENT_DIR/$file"
      log_success "Copied: $file"
    fi
  done

  # Copy .claude files
  echo -e "\n${BLUE}⚙️  Step 3: Copying Claude Code configuration...${NC}"

  for file in settings.json COMMIT_PROTOCOL.md DEPLOY_PROTOCOL.md FILE_MANIFEST.md \
              DEPLOYMENT_MANIFEST.md LOCAL_ENVIRONMENT_CONFIG.md STAGING_ENVIRONMENT_CONFIG.md \
              PRODUCTION_ENVIRONMENT_CONFIG.md 00_MASTER_SPECIFICATION_MODULE.md; do
    if [ -f "$SCRIPT_DIR/.claude/$file" ]; then
      cp "$SCRIPT_DIR/.claude/$file" "$CURRENT_DIR/.claude/$file"
      log_success "Copied: $file"
    fi
  done

  # Copy directories
  echo -e "\n${BLUE}🔧 Step 4: Copying validation hooks...${NC}"
  if [ -d "$SCRIPT_DIR/.claude/hooks" ]; then
    cp -r "$SCRIPT_DIR/.claude/hooks"/* "$CURRENT_DIR/.claude/hooks/" 2>/dev/null || true
    log_success "Hooks have been copied"
  fi

  echo -e "\n${BLUE}👥 Step 5: Copying agent configuration...${NC}"
  if [ -d "$SCRIPT_DIR/.claude/agents" ]; then
    cp -r "$SCRIPT_DIR/.claude/agents"/* "$CURRENT_DIR/.claude/agents/" 2>/dev/null || true
    log_success "Agents have been copied"
  fi

  echo -e "\n${BLUE}💡 Step 6: Copying Claude Code skills...${NC}"
  if [ -d "$SCRIPT_DIR/.claude/skills" ]; then
    cp -r "$SCRIPT_DIR/.claude/skills"/* "$CURRENT_DIR/.claude/skills/" 2>/dev/null || true
    log_success "Skills have been copied"
  fi

  echo -e "\n${BLUE}📚 Step 7: Copying knowledge base...${NC}"
  if [ -d "$SCRIPT_DIR/knowledge_base" ]; then
    cp -r "$SCRIPT_DIR/knowledge_base" "$CURRENT_DIR/"
    log_success "Knowledge base has been copied"
  fi

  # Step 8: Git setup
  echo -e "\n${BLUE}📝 Step 8: Git setup...${NC}"

  if command -v git &> /dev/null; then
    if [ ! -f "$CURRENT_DIR/.gitignore" ]; then
      cat > "$CURRENT_DIR/.gitignore" << 'EOF'
# CoolHan Generated
.claude/parsed/
.claude/analysis/
.claude/logs/
.claude/locks/

# Environment
.env
.env.local
.env.production
.env.*.local

# Dependencies
node_modules/
npm-debug.log*

# Build
dist/
build/
*.tsbuildinfo
EOF
      log_success ".gitignore created"
    else
      log_warn ".gitignore already exists"
    fi
  else
    log_warn "Git is not installed"
  fi

  # Write version tracking file
  COOLHAN_VERSION="1.0.4"
  VERSION_FILE="$HOME/.coolhan-version.json"
  CLAUDE_DIR="$CURRENT_DIR/.claude"
  cat > "$VERSION_FILE" << VEOF
{
  "version": "$COOLHAN_VERSION",
  "installed_at": "$(date -u +%Y-%m-%dT%H:%M:%SZ)",
  "repo": "https://github.com/zmjckim-fa/coolhan",
  "install_method": "install.sh",
  "install_dir": "$CLAUDE_DIR",
  "last_check": null,
  "update_available": false
}
VEOF
  log_success "Version information saved: $VERSION_FILE"

  # Final summary
  echo -e "\n$(printf '=%.0s' {1..60})"
  echo -e "\n${GREEN}✨ CoolHan Framework installation complete!${NC}\n"

  echo -e "${BLUE}📂 Installed items:${NC}"
  echo "  ✅ .claude/ - Claude Code configuration"
  echo "  ✅ .claude/hooks/ - Validation hook scripts (8)"
  echo "  ✅ .claude/agents/ - Agent definitions (5)"
  echo "  ✅ .claude/skills/ - Claude Code skills"
  echo "  ✅ knowledge_base/ - Core documents and modules"
  echo "  ✅ CLAUDE.md - Project operations guide"

  echo -e "\n${BLUE}🚀 Next steps:${NC}"
  echo "  1. Read CLAUDE.md"
  echo "  2. Read knowledge_base/00_AI_MASTER_RULES.md"
  echo "  3. Read knowledge_base/00_DEVELOPMENT_LOCKED_MODE.md"
  echo "  4. Start writing project-specific documents"

  echo -e "\n${BLUE}📖 Useful commands:${NC}"
  echo "  npm run spec:validate  - Validate specifications"
  echo "  npm run env:validate   - Detect environment"
  echo "  npm run lock:status    - Deploy lock status"

  echo -e "\n$(printf '=%.0s' {1..60})\n"

  echo -e "${GREEN}Start rule-based, flawless development with CoolHan Framework! 🎯\n${NC}"
}

main

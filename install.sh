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

  log_info "설치 위치: $CURRENT_DIR"

  # Step 1: Check Node.js (optional)
  if command -v node &> /dev/null; then
    NODE_VERSION=$(node -v)
    log_success "Node.js 설치됨: $NODE_VERSION"
  else
    log_warn "Node.js가 설치되지 않았습니다 (선택사항)"
  fi

  # Step 2: Create directories
  echo -e "\n${BLUE}📁 Step 1: 디렉토리 구조 생성...${NC}"

  mkdir -p "$CURRENT_DIR/.claude"
  mkdir -p "$CURRENT_DIR/.claude/agents"
  mkdir -p "$CURRENT_DIR/.claude/skills"
  mkdir -p "$CURRENT_DIR/.claude/hooks"
  mkdir -p "$CURRENT_DIR/.claude/parsed"
  mkdir -p "$CURRENT_DIR/.claude/analysis"
  mkdir -p "$CURRENT_DIR/.claude/logs"
  mkdir -p "$CURRENT_DIR/.claude/locks"

  log_success "디렉토리가 생성되었습니다"

  # Step 3: Copy files
  echo -e "\n${BLUE}📋 Step 2: 파일 복사...${NC}"

  # Copy main files
  for file in CLAUDE.md LICENSE README.md GITHUB_UPLOAD_CHECKLIST.md DOCUMENT_GUIDE.md; do
    if [ -f "$SCRIPT_DIR/$file" ]; then
      cp "$SCRIPT_DIR/$file" "$CURRENT_DIR/$file"
      log_success "복사됨: $file"
    fi
  done

  # Copy .claude files
  echo -e "\n${BLUE}⚙️  Step 3: Claude Code 설정 복사...${NC}"

  for file in settings.json COMMIT_PROTOCOL.md DEPLOY_PROTOCOL.md FILE_MANIFEST.md \
              DEPLOYMENT_MANIFEST.md LOCAL_ENVIRONMENT_CONFIG.md STAGING_ENVIRONMENT_CONFIG.md \
              PRODUCTION_ENVIRONMENT_CONFIG.md 00_MASTER_SPECIFICATION_MODULE.md; do
    if [ -f "$SCRIPT_DIR/.claude/$file" ]; then
      cp "$SCRIPT_DIR/.claude/$file" "$CURRENT_DIR/.claude/$file"
      log_success "복사됨: $file"
    fi
  done

  # Copy directories
  echo -e "\n${BLUE}🔧 Step 4: 검증 훅 복사...${NC}"
  if [ -d "$SCRIPT_DIR/.claude/hooks" ]; then
    cp -r "$SCRIPT_DIR/.claude/hooks"/* "$CURRENT_DIR/.claude/hooks/" 2>/dev/null || true
    log_success "훅이 복사되었습니다"
  fi

  echo -e "\n${BLUE}👥 Step 5: 에이전트 설정 복사...${NC}"
  if [ -d "$SCRIPT_DIR/.claude/agents" ]; then
    cp -r "$SCRIPT_DIR/.claude/agents"/* "$CURRENT_DIR/.claude/agents/" 2>/dev/null || true
    log_success "에이전트가 복사되었습니다"
  fi

  echo -e "\n${BLUE}💡 Step 6: Claude Code 스킬 복사...${NC}"
  if [ -d "$SCRIPT_DIR/.claude/skills" ]; then
    cp -r "$SCRIPT_DIR/.claude/skills"/* "$CURRENT_DIR/.claude/skills/" 2>/dev/null || true
    log_success "스킬이 복사되었습니다"
  fi

  echo -e "\n${BLUE}📚 Step 7: 지식 기반 복사...${NC}"
  if [ -d "$SCRIPT_DIR/knowledge_base" ]; then
    cp -r "$SCRIPT_DIR/knowledge_base" "$CURRENT_DIR/"
    log_success "지식 기반이 복사되었습니다"
  fi

  # Step 8: Git setup
  echo -e "\n${BLUE}📝 Step 8: Git 설정...${NC}"

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
      log_success ".gitignore 생성됨"
    else
      log_warn ".gitignore가 이미 존재합니다"
    fi
  else
    log_warn "Git이 설치되지 않았습니다"
  fi

  # Final summary
  echo -e "\n$(printf '=%.0s' {1..60})"
  echo -e "\n${GREEN}✨ CoolHan Framework 설치 완료!${NC}\n"

  echo -e "${BLUE}📂 설치된 항목:${NC}"
  echo "  ✅ .claude/ - Claude Code 설정"
  echo "  ✅ .claude/hooks/ - 검증 훅 스크립트 (8개)"
  echo "  ✅ .claude/agents/ - 에이전트 정의 (5개)"
  echo "  ✅ .claude/skills/ - Claude Code 스킬"
  echo "  ✅ knowledge_base/ - 핵심 문서 및 모듈"
  echo "  ✅ CLAUDE.md - 프로젝트 운영 가이드"

  echo -e "\n${BLUE}🚀 다음 단계:${NC}"
  echo "  1. CLAUDE.md 읽기"
  echo "  2. knowledge_base/00_AI_MASTER_RULES.md 읽기"
  echo "  3. knowledge_base/00_DEVELOPMENT_LOCKED_MODE.md 읽기"
  echo "  4. 프로젝트 특화 문서 작성 시작"

  echo -e "\n${BLUE}📖 유용한 명령어:${NC}"
  echo "  npm run spec:validate  - 규격 검증"
  echo "  npm run env:validate   - 환경 감지"
  echo "  npm run lock:status    - 배포 락 상태"

  echo -e "\n$(printf '=%.0s' {1..60})\n"

  echo -e "${GREEN}CoolHan Framework와 함께 규칙 기반의 완벽한 개발을 시작하세요! 🎯\n${NC}"
}

main

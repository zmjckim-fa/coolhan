#!/usr/bin/env node

/**
 * CoolHan Installer
 *
 * Usage:
 *   npm install -g coolhan-install
 *   coolhan-install
 *
 * Or in existing project:
 *   npx coolhan-install
 */

const fs = require('fs');
const path = require('path');
const os = require('os');
const { execSync } = require('child_process');

const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  green: '\x1b[32m',
  blue: '\x1b[34m',
  yellow: '\x1b[33m',
  red: '\x1b[31m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function error(message) {
  console.error(`${colors.red}❌ ${message}${colors.reset}`);
  process.exit(1);
}

function success(message) {
  log(`✅ ${message}`, 'green');
}

function info(message) {
  log(`ℹ️  ${message}`, 'blue');
}

function warn(message) {
  log(`⚠️  ${message}`, 'yellow');
}

function copyDir(src, dest) {
  if (!fs.existsSync(dest)) {
    fs.mkdirSync(dest, { recursive: true });
  }

  const files = fs.readdirSync(src);

  files.forEach(file => {
    const srcPath = path.join(src, file);
    const destPath = path.join(dest, file);

    if (fs.statSync(srcPath).isDirectory()) {
      copyDir(srcPath, destPath);
    } else {
      fs.copyFileSync(srcPath, destPath);
    }
  });
}

function main() {
  log('\n🚀 CoolHan Framework Installer\n', 'bright');

  const currentDir = process.cwd();
  const claudeDir = path.join(currentDir, '.claude');
  const installDir = path.join(__dirname);

  info(`설치 위치: ${currentDir}`);

  // Step 1: 디렉토리 구조 확인
  log('\n📁 Step 1: 디렉토리 구조 생성...', 'bright');

  const dirs = [
    '.claude',
    '.claude/agents',
    '.claude/skills',
    '.claude/hooks',
    '.claude/parsed',
    '.claude/analysis',
    '.claude/logs',
    '.claude/locks'
  ];

  dirs.forEach(dir => {
    const fullPath = path.join(currentDir, dir);
    if (!fs.existsSync(fullPath)) {
      fs.mkdirSync(fullPath, { recursive: true });
      success(`생성됨: ${dir}`);
    } else {
      info(`이미 존재: ${dir}`);
    }
  });

  // Step 2: 핵심 파일 복사
  log('\n📋 Step 2: 핵심 파일 복사...', 'bright');

  const filesToCopy = [
    'CLAUDE.md',
    'LICENSE',
    'README.md',
    'GITHUB_UPLOAD_CHECKLIST.md',
    'DOCUMENT_GUIDE.md'
  ];

  filesToCopy.forEach(file => {
    const src = path.join(installDir, file);
    const dest = path.join(currentDir, file);

    if (fs.existsSync(src)) {
      if (!fs.existsSync(dest)) {
        fs.copyFileSync(src, dest);
        success(`복사됨: ${file}`);
      } else {
        warn(`이미 존재: ${file} (건너뜀)`);
      }
    }
  });

  // Step 3: .claude 디렉토리 파일 복사
  log('\n⚙️  Step 3: Claude Code 설정 복사...', 'bright');

  const claudeFiles = [
    { src: path.join(installDir, '.claude', 'settings.json'), dest: path.join(claudeDir, 'settings.json') },
    { src: path.join(installDir, '.claude', 'COMMIT_PROTOCOL.md'), dest: path.join(claudeDir, 'COMMIT_PROTOCOL.md') },
    { src: path.join(installDir, '.claude', 'DEPLOY_PROTOCOL.md'), dest: path.join(claudeDir, 'DEPLOY_PROTOCOL.md') },
    { src: path.join(installDir, '.claude', 'FILE_MANIFEST.md'), dest: path.join(claudeDir, 'FILE_MANIFEST.md') },
    { src: path.join(installDir, '.claude', 'DEPLOYMENT_MANIFEST.md'), dest: path.join(claudeDir, 'DEPLOYMENT_MANIFEST.md') },
    { src: path.join(installDir, '.claude', 'LOCAL_ENVIRONMENT_CONFIG.md'), dest: path.join(claudeDir, 'LOCAL_ENVIRONMENT_CONFIG.md') },
    { src: path.join(installDir, '.claude', 'STAGING_ENVIRONMENT_CONFIG.md'), dest: path.join(claudeDir, 'STAGING_ENVIRONMENT_CONFIG.md') },
    { src: path.join(installDir, '.claude', 'PRODUCTION_ENVIRONMENT_CONFIG.md'), dest: path.join(claudeDir, 'PRODUCTION_ENVIRONMENT_CONFIG.md') },
    { src: path.join(installDir, '.claude', '00_MASTER_SPECIFICATION_MODULE.md'), dest: path.join(claudeDir, '00_MASTER_SPECIFICATION_MODULE.md') }
  ];

  claudeFiles.forEach(({ src, dest }) => {
    if (fs.existsSync(src)) {
      fs.copyFileSync(src, dest);
      success(`복사됨: ${path.basename(dest)}`);
    }
  });

  // Step 4: Hooks 복사
  log('\n🔧 Step 4: 검증 훅 복사...', 'bright');

  const hooksDir = path.join(installDir, '.claude', 'hooks');
  const destHooksDir = path.join(claudeDir, 'hooks');

  if (fs.existsSync(hooksDir)) {
    copyDir(hooksDir, destHooksDir);
    success('모든 훅이 복사되었습니다');
  }

  // Step 5: Agents 복사
  log('\n👥 Step 5: 에이전트 설정 복사...', 'bright');

  const agentsDir = path.join(installDir, '.claude', 'agents');
  const destAgentsDir = path.join(claudeDir, 'agents');

  if (fs.existsSync(agentsDir)) {
    copyDir(agentsDir, destAgentsDir);
    success('모든 에이전트가 복사되었습니다');
  }

  // Step 6: Skills 복사
  log('\n💡 Step 6: Claude Code 스킬 복사...', 'bright');

  const skillsDir = path.join(installDir, '.claude', 'skills');
  const destSkillsDir = path.join(claudeDir, 'skills');

  if (fs.existsSync(skillsDir)) {
    copyDir(skillsDir, destSkillsDir);
    success('모든 스킬이 복사되었습니다');
  }

  // Step 7: Knowledge Base 복사
  log('\n📚 Step 7: 지식 기반 복사...', 'bright');

  const kbDir = path.join(installDir, 'knowledge_base');
  const destKbDir = path.join(currentDir, 'knowledge_base');

  if (fs.existsSync(kbDir)) {
    copyDir(kbDir, destKbDir);
    success('지식 기반이 복사되었습니다');
  }

  // Step 8: package.json 업데이트 (있는 경우)
  log('\n📦 Step 8: package.json 검증...', 'bright');

  const packageJsonPath = path.join(currentDir, 'package.json');

  if (fs.existsSync(packageJsonPath)) {
    const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));

    // 스크립트 추가
    if (!packageJson.scripts) {
      packageJson.scripts = {};
    }

    const scripts = {
      'spec:parse': 'node .claude/hooks/spec-parser.js',
      'spec:analyze': 'node .claude/hooks/code-analyzer.js',
      'spec:validate': 'node .claude/hooks/spec-validator.js',
      'env:validate': 'node .claude/hooks/environment-validator.js',
      'lock:status': 'node .claude/hooks/deploy-lock.js list',
      'lock:cleanup': 'node .claude/hooks/deploy-lock.js cleanup'
    };

    Object.assign(packageJson.scripts, scripts);

    fs.writeFileSync(packageJsonPath, JSON.stringify(packageJson, null, 2));
    success('package.json이 업데이트되었습니다');
  } else {
    info('package.json을 찾을 수 없습니다. (Node.js 프로젝트가 아닌 경우)');
  }

  // Step 9: Git 설정
  log('\n📝 Step 9: Git 설정 확인...', 'bright');

  try {
    execSync('git --version', { stdio: 'ignore' });

    const gitignorePath = path.join(currentDir, '.gitignore');
    const gitignoreContent = `
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
`;

    if (!fs.existsSync(gitignorePath)) {
      fs.writeFileSync(gitignorePath, gitignoreContent);
      success('.gitignore 생성됨');
    } else {
      info('.gitignore가 이미 존재합니다');
    }
  } catch (e) {
    warn('Git이 설치되지 않았습니다');
  }

  // Step 10: Write version tracking file
  log('\n🔖 Step 10: 버전 정보 저장...', 'bright');

  const pkg = fs.existsSync(path.join(__dirname, 'package.json'))
    ? JSON.parse(fs.readFileSync(path.join(__dirname, 'package.json'), 'utf8'))
    : {};

  const versionInfo = {
    version: pkg.version || '1.0.4',
    installed_at: new Date().toISOString(),
    repo: 'https://github.com/zmjckim-fa/coolhan',
    install_method: 'install.js',
    install_dir: claudeDir,
    last_check: null,
    latest_known: null,
    update_available: false,
  };
  const versionFilePath = path.join(os.homedir(), '.coolhan-version.json');
  try {
    fs.writeFileSync(versionFilePath, JSON.stringify(versionInfo, null, 2));
    success(`버전 정보 저장됨: ${versionFilePath}`);
  } catch (e) {
    // Non-fatal
  }

  // 최종 요약
  log('\n' + '='.repeat(60), 'bright');
  log('\n✨ CoolHan Framework 설치 완료!\n', 'green');

  log('📂 설치된 항목:', 'bright');
  log('  ✅ .claude/ - Claude Code 설정');
  log('  ✅ .claude/hooks/ - 검증 훅 스크립트 (8개)');
  log('  ✅ .claude/agents/ - 에이전트 정의 (5개)');
  log('  ✅ .claude/skills/ - Claude Code 스킬');
  log('  ✅ knowledge_base/ - 핵심 문서 및 모듈');
  log('  ✅ CLAUDE.md - 프로젝트 운영 가이드');

  log('\n🚀 다음 단계:', 'bright');
  log('  1. CLAUDE.md 읽기');
  log('  2. knowledge_base/00_AI_MASTER_RULES.md 읽기');
  log('  3. knowledge_base/00_DEVELOPMENT_LOCKED_MODE.md 읽기');
  log('  4. 프로젝트 특화 문서 작성 시작');

  log('\n📖 유용한 명령어:', 'bright');
  log('  npm run spec:validate  - 규격 검증');
  log('  npm run env:validate   - 환경 감지');
  log('  npm run lock:status    - 배포 락 상태');

  log('\n💡 문서:', 'bright');
  log('  README.md - 프로젝트 개요');
  log('  INSTALLATION_GUIDE.md - 설치 가이드');

  log('\n' + '='.repeat(60) + '\n', 'bright');

  log('CoolHan Framework와 함께 규칙 기반의 완벽한 개발을 시작하세요! 🎯\n', 'green');
}

main();

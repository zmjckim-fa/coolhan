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

  info(`Install location: ${currentDir}`);

  // Step 1: Verify directory structure
  log('\n📁 Step 1: Creating directory structure...', 'bright');

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
      success(`Created: ${dir}`);
    } else {
      info(`Already exists: ${dir}`);
    }
  });

  // Step 2: Copy core files
  log('\n📋 Step 2: Copying core files...', 'bright');

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
        success(`Copied: ${file}`);
      } else {
        warn(`Already exists: ${file} (skipped)`);
      }
    }
  });

  // Step 3: Copy .claude directory files
  log('\n⚙️  Step 3: Copying Claude Code configuration...', 'bright');

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
      success(`Copied: ${path.basename(dest)}`);
    }
  });

  // Step 4: Copy hooks
  log('\n🔧 Step 4: Copying validation hooks...', 'bright');

  const hooksDir = path.join(installDir, '.claude', 'hooks');
  const destHooksDir = path.join(claudeDir, 'hooks');

  if (fs.existsSync(hooksDir)) {
    copyDir(hooksDir, destHooksDir);
    success('All hooks have been copied');
  }

  // Step 5: Copy agents
  log('\n👥 Step 5: Copying agent configuration...', 'bright');

  const agentsDir = path.join(installDir, '.claude', 'agents');
  const destAgentsDir = path.join(claudeDir, 'agents');

  if (fs.existsSync(agentsDir)) {
    copyDir(agentsDir, destAgentsDir);
    success('All agents have been copied');
  }

  // Step 6: Copy skills
  log('\n💡 Step 6: Copying Claude Code skills...', 'bright');

  const skillsDir = path.join(installDir, '.claude', 'skills');
  const destSkillsDir = path.join(claudeDir, 'skills');

  if (fs.existsSync(skillsDir)) {
    copyDir(skillsDir, destSkillsDir);
    success('All skills have been copied');
  }

  // Step 7: Copy Knowledge Base
  log('\n📚 Step 7: Copying knowledge base...', 'bright');

  const kbDir = path.join(installDir, 'knowledge_base');
  const destKbDir = path.join(currentDir, 'knowledge_base');

  if (fs.existsSync(kbDir)) {
    copyDir(kbDir, destKbDir);
    success('Knowledge base has been copied');
  }

  // Step 8: Update package.json (if present)
  log('\n📦 Step 8: Validating package.json...', 'bright');

  const packageJsonPath = path.join(currentDir, 'package.json');

  if (fs.existsSync(packageJsonPath)) {
    const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));

    // Add scripts
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
    success('package.json has been updated');
  } else {
    info('package.json not found. (Not a Node.js project)');
  }

  // Step 9: Git setup
  log('\n📝 Step 9: Checking Git configuration...', 'bright');

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
      success('.gitignore created');
    } else {
      info('.gitignore already exists');
    }
  } catch (e) {
    warn('Git is not installed');
  }

  // Step 10: Write version tracking file
  log('\n🔖 Step 10: Saving version information...', 'bright');

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
    success(`Version information saved: ${versionFilePath}`);
  } catch (e) {
    // Non-fatal
  }

  // Final summary
  log('\n' + '='.repeat(60), 'bright');
  log('\n✨ CoolHan Framework installation complete!\n', 'green');

  log('📂 Installed items:', 'bright');
  log('  ✅ .claude/ - Claude Code configuration');
  log('  ✅ .claude/hooks/ - Validation hook scripts');
  log('  ✅ .claude/agents/ - Agent definitions');
  log('  ✅ .claude/skills/ - Claude Code skills');
  log('  ✅ knowledge_base/ - Core documents and modules');
  log('  ✅ CLAUDE.md - Project operations guide');

  // Post-install self-check (non-fatal): confirm the harness is healthy.
  try {
    const { runChecks, summarize } = require('./doctor');
    const checks = runChecks(currentDir);
    const s = summarize(checks);
    if (s.fail === 0) {
      success(`Self-check passed (${s.pass} checks). Run \`npx coolhan-doctor\` anytime.`);
    } else {
      warn(`Self-check found ${s.fail} issue(s). Run \`npx coolhan-doctor\` for details.`);
    }
  } catch (e) {
    // Non-fatal: doctor is optional tooling.
  }

  log('\n🚀 Next steps:', 'bright');
  log('  1. Read CLAUDE.md');
  log('  2. Read knowledge_base/00_AI_MASTER_RULES.md');
  log('  3. Read knowledge_base/00_DEVELOPMENT_LOCKED_MODE.md');
  log('  4. Start writing project-specific documents');

  log('\n📖 Useful commands:', 'bright');
  log('  npm run spec:validate  - Validate specifications');
  log('  npm run env:validate   - Detect environment');
  log('  npm run lock:status    - Deploy lock status');

  log('\n💡 Documentation:', 'bright');
  log('  README.md - Project overview');
  log('  INSTALLATION_GUIDE.md - Installation guide');

  log('\n' + '='.repeat(60) + '\n', 'bright');

  log('Start rule-based, flawless development with CoolHan Framework! 🎯\n', 'green');
}

main();

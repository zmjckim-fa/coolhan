#!/usr/bin/env node
/**
 * CoolHan Update Checker
 *
 * Usage:
 *   node scripts/check-update.js
 *   npx coolhan-update-check
 *
 * 설치된 버전과 GitHub 최신 릴리스를 비교하여 업데이트 여부를 알린다.
 */

'use strict';

const https = require('https');
const fs = require('fs');
const path = require('path');
const os = require('os');

const REPO = 'zmjckim-fa/coolhan';
const GITHUB_API = `https://api.github.com/repos/${REPO}/releases/latest`;
const VERSION_FILE = path.join(os.homedir(), '.coolhan-version.json');
const INSTALL_DIR = path.join(os.homedir(), '.claude');

const colors = {
  reset: '\x1b[0m',
  bold: '\x1b[1m',
  green: '\x1b[32m',
  blue: '\x1b[34m',
  yellow: '\x1b[33m',
  red: '\x1b[31m',
  cyan: '\x1b[36m',
};

const c = (color, text) => `${colors[color]}${text}${colors.reset}`;

function readInstalledVersion() {
  try {
    if (fs.existsSync(VERSION_FILE)) {
      const data = JSON.parse(fs.readFileSync(VERSION_FILE, 'utf8'));
      return data;
    }
  } catch (e) {}

  // Fallback: read from package.json in INSTALL_DIR if exists
  const pkgPath = path.join(INSTALL_DIR, 'coolhan-package.json');
  if (fs.existsSync(pkgPath)) {
    try {
      const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf8'));
      return { version: pkg.version, installed_at: 'unknown' };
    } catch (e) {}
  }

  return null;
}

function fetchLatestRelease() {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'api.github.com',
      path: `/repos/${REPO}/releases/latest`,
      method: 'GET',
      headers: {
        'User-Agent': 'coolhan-update-checker/1.0',
        'Accept': 'application/vnd.github.v3+json',
      },
    };

    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          resolve(JSON.parse(data));
        } catch (e) {
          reject(new Error('Failed to parse GitHub API response'));
        }
      });
    });

    req.on('error', reject);
    req.setTimeout(8000, () => {
      req.destroy();
      reject(new Error('Request timeout'));
    });
    req.end();
  });
}

function compareVersions(installed, latest) {
  // Remove 'v' prefix if present
  const a = installed.replace(/^v/, '').split('.').map(Number);
  const b = latest.replace(/^v/, '').split('.').map(Number);

  for (let i = 0; i < Math.max(a.length, b.length); i++) {
    const ai = a[i] || 0;
    const bi = b[i] || 0;
    if (ai < bi) return -1;  // installed < latest (needs update)
    if (ai > bi) return 1;   // installed > latest (ahead)
  }
  return 0;  // same version
}

function printUpdateBanner(installed, latest, releaseData) {
  const line = '═'.repeat(60);
  console.log('\n' + c('yellow', '╔' + line + '╗'));
  console.log(c('yellow', '║') + c('bold', '  🚀 CoolHan 업데이트 알림 / Update Available!              ') + c('yellow', '║'));
  console.log(c('yellow', '╠' + line + '╣'));
  console.log(c('yellow', '║') + `  현재 설치 버전: ${c('red', installed.padEnd(10))}                          ` + c('yellow', '║'));
  console.log(c('yellow', '║') + `  최신 버전:     ${c('green', latest.padEnd(10))}  ✨ NEW                    ` + c('yellow', '║'));
  console.log(c('yellow', '╠' + line + '╣'));
  console.log(c('yellow', '║') + c('bold', '  업데이트 방법 / Update Method:                            ') + c('yellow', '║'));
  console.log(c('yellow', '║') + '  Linux/macOS:                                               ' + c('yellow', '║'));
  console.log(c('yellow', '║') + `  ${c('cyan', 'curl -fsSL https://raw.githubusercontent.com/' + REPO + '/main/install.sh | bash')}` + c('yellow', '║'));
  console.log(c('yellow', '║') + '  Windows:                                                   ' + c('yellow', '║'));
  console.log(c('yellow', '║') + `  ${c('cyan', 'iwr https://raw.githubusercontent.com/' + REPO + '/main/install.ps1 | iex')}` + c('yellow', '║'));
  console.log(c('yellow', '║') + '  npm:                                                       ' + c('yellow', '║'));
  console.log(c('yellow', '║') + `  ${c('cyan', 'npm install -g coolhan-builder')}                              ` + c('yellow', '║'));

  if (releaseData && releaseData.html_url) {
    console.log(c('yellow', '╠' + line + '╣'));
    console.log(c('yellow', '║') + `  릴리스 노트: ${c('blue', releaseData.html_url)}` + c('yellow', '║'));
  }
  console.log(c('yellow', '╚' + line + '╝\n'));
}

function printUpToDate(installed) {
  console.log(c('green', `✅ CoolHan ${installed} — 최신 버전입니다. (Up to date)`));
}

function printError(msg) {
  console.log(c('yellow', `⚠️  업데이트 확인 실패 (Check failed): ${msg}`));
  console.log(c('yellow', `   GitHub에서 확인: https://github.com/${REPO}/releases`));
}

async function main() {
  console.log(c('blue', '\n🔍 CoolHan 업데이트 확인 중... (Checking for updates...)'));

  const installed = readInstalledVersion();
  if (!installed) {
    console.log(c('yellow', '⚠️  설치 정보를 찾을 수 없습니다. 재설치를 권장합니다.'));
    console.log(c('yellow', '   Install info not found. Please reinstall CoolHan.'));
    console.log(c('cyan', `   https://github.com/${REPO}#quick-start`));
    return;
  }

  console.log(c('blue', `   설치된 버전: ${installed.version}`));
  if (installed.installed_at && installed.installed_at !== 'unknown') {
    console.log(c('blue', `   설치일: ${installed.installed_at}`));
  }

  try {
    const releaseData = await fetchLatestRelease();
    const latestVersion = releaseData.tag_name || releaseData.name;

    if (!latestVersion) {
      printError('릴리스 정보를 읽을 수 없습니다');
      return;
    }

    const comparison = compareVersions(installed.version, latestVersion);

    if (comparison < 0) {
      // Needs update
      printUpdateBanner(installed.version, latestVersion, releaseData);

      // Update the version file's last_check date
      try {
        const versionData = readInstalledVersion() || {};
        versionData.last_check = new Date().toISOString();
        versionData.latest_known = latestVersion;
        versionData.update_available = true;
        fs.writeFileSync(VERSION_FILE, JSON.stringify(versionData, null, 2));
      } catch (e) {}

    } else {
      printUpToDate(installed.version);

      // Update last check time
      try {
        const versionData = readInstalledVersion() || {};
        versionData.last_check = new Date().toISOString();
        versionData.latest_known = latestVersion;
        versionData.update_available = false;
        fs.writeFileSync(VERSION_FILE, JSON.stringify(versionData, null, 2));
      } catch (e) {}
    }

  } catch (err) {
    printError(err.message);
  }
}

main().catch(err => {
  printError(err.message);
  process.exit(0);  // Don't fail hard — update check is non-critical
});

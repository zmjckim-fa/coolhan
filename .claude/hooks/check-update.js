/**
 * CoolHan Update Check Hook
 *
 * Non-blocking update check that runs in the background.
 * Writes result to ~/.coolhan-update-notice.json for the SKILL to read.
 *
 * This hook is intentionally non-fatal: network errors are swallowed.
 */

'use strict';

const https = require('https');
const fs = require('fs');
const path = require('path');
const os = require('os');

const REPO = 'zmjckim-fa/coolhan';
const VERSION_FILE = path.join(os.homedir(), '.coolhan-version.json');
const NOTICE_FILE = path.join(os.homedir(), '.coolhan-update-notice.json');
const CHECK_INTERVAL_HOURS = 6;  // Check at most every 6 hours

function shouldCheck() {
  try {
    if (!fs.existsSync(NOTICE_FILE)) return true;
    const notice = JSON.parse(fs.readFileSync(NOTICE_FILE, 'utf8'));
    const lastCheck = new Date(notice.last_check || 0);
    const hoursSince = (Date.now() - lastCheck.getTime()) / 3600000;
    return hoursSince >= CHECK_INTERVAL_HOURS;
  } catch (e) {
    return true;
  }
}

function getInstalledVersion() {
  try {
    if (fs.existsSync(VERSION_FILE)) {
      return JSON.parse(fs.readFileSync(VERSION_FILE, 'utf8')).version || null;
    }
  } catch (e) {}
  return null;
}

function fetchLatest(callback) {
  const req = https.request({
    hostname: 'api.github.com',
    path: `/repos/${REPO}/releases/latest`,
    method: 'GET',
    headers: {
      'User-Agent': 'coolhan-hook/1.0',
      'Accept': 'application/vnd.github.v3+json',
    },
  }, (res) => {
    let data = '';
    res.on('data', c => data += c);
    res.on('end', () => {
      try {
        const release = JSON.parse(data);
        callback(null, release.tag_name || null, release.html_url || null, release.body || '');
      } catch (e) {
        callback(e);
      }
    });
  });

  req.on('error', callback);
  req.setTimeout(5000, () => { req.destroy(); callback(new Error('timeout')); });
  req.end();
}

function compareVersions(a, b) {
  const av = (a || '0').replace(/^v/, '').split('.').map(Number);
  const bv = (b || '0').replace(/^v/, '').split('.').map(Number);
  for (let i = 0; i < 3; i++) {
    if ((av[i] || 0) < (bv[i] || 0)) return -1;
    if ((av[i] || 0) > (bv[i] || 0)) return 1;
  }
  return 0;
}

// Only check if interval has passed
if (!shouldCheck()) {
  process.exit(0);
}

const installed = getInstalledVersion();
if (!installed) {
  // Write a "check failed" notice and exit
  try {
    fs.writeFileSync(NOTICE_FILE, JSON.stringify({
      last_check: new Date().toISOString(),
      update_available: false,
      error: 'installed version unknown',
    }, null, 2));
  } catch (e) {}
  process.exit(0);
}

fetchLatest((err, latestTag, releaseUrl, releaseBody) => {
  const notice = {
    last_check: new Date().toISOString(),
    installed_version: installed,
    latest_version: latestTag || null,
    update_available: false,
    release_url: releaseUrl || `https://github.com/${REPO}/releases`,
    release_summary: (releaseBody || '').slice(0, 500),
  };

  if (!err && latestTag) {
    notice.update_available = compareVersions(installed, latestTag) < 0;
  }

  try {
    fs.writeFileSync(NOTICE_FILE, JSON.stringify(notice, null, 2));
  } catch (e) {}

  // Print to stdout only if update is available (Claude Code reads this)
  if (notice.update_available) {
    console.log(JSON.stringify({
      type: 'coolhan_update_available',
      installed: installed,
      latest: latestTag,
      url: releaseUrl,
    }));
  }

  process.exit(0);
});

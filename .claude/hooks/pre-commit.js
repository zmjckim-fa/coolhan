#!/usr/bin/env node
/**
 * PRE-COMMIT HOOK (ENHANCED)
 * Blocks commits containing secrets, .env files, specification violations
 * ENFORCED - CANNOT BE BYPASSED
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const BLOCKED_PATTERNS = {
  envFiles: /\.env(\.\w+)?$/i,
  credentials: [
    /api[_-]?key\s*[:=]/gi,
    /secret[_-]?key\s*[:=]/gi,
    /password\s*[:=]/gi,
    /token\s*[:=]/gi,
    /bearer\s+\w+/gi,
    /private[_-]?key/gi,
    /authorization\s*[:=]\s*(Bearer|Basic)/gi
  ],
  forbiddenPatterns: [
    /self[_-]?solv/gi,  // Locked Mode violation: self-solving
    /maybe|perhaps|might|could|uncertain/gi,  // Uncertain patterns
    /process\.env\.\w+.*=.*[^;]/g  // Hardcoded env overrides
  ]
};

const MIN_COMMIT_MESSAGE_LENGTH = 20;

function getCommitMessage() {
  try {
    const messageFile = process.env.GIT_COMMIT_MESSAGE_FILE;
    if (messageFile && fs.existsSync(messageFile)) {
      return fs.readFileSync(messageFile, 'utf-8').trim();
    }
    return null;
  } catch (error) {
    return null;
  }
}

function getStagedFiles() {
  try {
    const output = execSync('git diff --cached --name-only', { encoding: 'utf-8' });
    return output.split('\n').filter(f => f.length > 0);
  } catch (error) {
    console.error('❌ Error getting staged files:', error.message);
    process.exit(1);
  }
}

function getStagedDiff(file) {
  try {
    const output = execSync(`git diff --cached "${file}"`, { encoding: 'utf-8' });
    return output;
  } catch (error) {
    return '';
  }
}

/**
 * NEW: Validate against Status Value Registry
 */
function validateStatusValues(files) {
  const violations = [];

  try {
    const registryPath = path.join('.claude', 'parsed', 'status_registry.json');

    if (!fs.existsSync(registryPath)) {
      return violations;
    }

    const registry = JSON.parse(fs.readFileSync(registryPath, 'utf-8'));
    const allowedStatuses = new Set();

    for (const module of Object.values(registry)) {
      module.statuses.forEach(s => allowedStatuses.add(s));
    }

    for (const file of files) {
      if (!/\.(js|ts)$/.test(file)) continue;

      const diff = getStagedDiff(file);

      // Check for hardcoded status strings
      const statusMatches = diff.matchAll(/status\s*[:=]\s*['"]([\w_]+)['"]/g);

      for (const match of statusMatches) {
        const status = match[1];

        if (!allowedStatuses.has(status)) {
          violations.push({
            type: 'INVALID_STATUS_VALUE',
            file,
            status,
            message: `Invalid status value: '${status}'. Check 00_STATUS_VALUE_REGISTRY.md for allowed values.`
          });
        }
      }
    }
  } catch (error) {
    console.warn(`⚠️  Could not validate status values: ${error.message}`);
  }

  return violations;
}

/**
 * NEW: Validate no unauthorized module API calls
 */
function validateModuleAPICalls(files) {
  const violations = [];

  try {
    const matrixPath = path.join('.claude', 'parsed', 'module_matrix.json');

    if (!fs.existsSync(matrixPath)) {
      return violations;
    }

    const matrix = JSON.parse(fs.readFileSync(matrixPath, 'utf-8'));

    for (const file of files) {
      if (!/\.(js|ts)$/.test(file)) continue;

      const diff = getStagedDiff(file);
      const callerModule = extractModuleFromPath(file);

      // Check for module calls
      const callMatches = diff.matchAll(/(?:fetch|axios|http)\s*\(\s*['"](\/api\/[\d\w\/-]+)['"]/g);

      for (const match of callMatches) {
        const targetAPI = match[1];
        const isForbidden = matrix.forbiddenCalls.some(
          ([caller, target]) => caller === callerModule && targetAPI.includes(target)
        );

        if (isForbidden) {
          violations.push({
            type: 'UNAUTHORIZED_MODULE_CALL',
            file,
            call: targetAPI,
            message: `Module ${callerModule} cannot call ${targetAPI}. Check 00_MODULE_RESPONSIBILITY_MATRIX.md`
          });
        }
      }
    }
  } catch (error) {
    console.warn(`⚠️  Could not validate module calls: ${error.message}`);
  }

  return violations;
}

/**
 * NEW: Validate locked mode rules
 */
function validateLockedModeRules(files) {
  const violations = [];

  for (const file of files) {
    if (!/\.(js|ts)$/.test(file)) continue;

    const diff = getStagedDiff(file);

    // Check for self-solving patterns
    if (/self[_-]?solv|guess|infer/gi.test(diff)) {
      violations.push({
        type: 'LOCKED_MODE_VIOLATION',
        file,
        message: 'Self-solving patterns detected. Violates Development Locked Mode. Check 00_DEVELOPMENT_LOCKED_MODE.md'
      });
    }

    // Check for uncertain patterns
    if (/maybe|perhaps|might|could|uncertain|assume/gi.test(diff)) {
      violations.push({
        type: 'UNCERTAIN_LOGIC_DETECTED',
        file,
        message: 'Uncertain logic patterns detected. Code must follow documented specifications exactly.'
      });
    }

    // Check for hardcoded paths
    if (/[a-zA-Z]:\\[\w\\]+|\/home\/\w+|\/opt\/\w+/g.test(diff)) {
      violations.push({
        type: 'HARDCODED_PATH',
        file,
        message: 'Hardcoded file paths detected. Use environment variables or configuration.'
      });
    }
  }

  return violations;
}

function checkForEnvFiles(files) {
  const violations = [];
  for (const file of files) {
    if (BLOCKED_PATTERNS.envFiles.test(file)) {
      violations.push({
        type: 'ENV_FILE',
        file,
        message: `Cannot commit .env file: ${file}`
      });
    }
  }
  return violations;
}

function checkForCredentials(files) {
  const violations = [];
  for (const file of files) {
    const diff = getStagedDiff(file);
    for (const pattern of BLOCKED_PATTERNS.credentials) {
      if (pattern.test(diff)) {
        violations.push({
          type: 'CREDENTIALS_DETECTED',
          file,
          message: `Credentials detected in: ${file}. Use environment variables instead.`
        });
        break;
      }
    }
  }
  return violations;
}

function checkForForbiddenPatterns(files) {
  const violations = [];
  for (const file of files) {
    const diff = getStagedDiff(file);
    for (const pattern of BLOCKED_PATTERNS.forbiddenPatterns) {
      if (pattern.test(diff)) {
        violations.push({
          type: 'FORBIDDEN_PATTERN',
          file,
          message: `Forbidden pattern detected in: ${file}`
        });
      }
    }
  }
  return violations;
}

function checkCommitMessage(message) {
  const violations = [];
  if (!message || message.length < MIN_COMMIT_MESSAGE_LENGTH) {
    violations.push({
      type: 'COMMIT_MESSAGE_TOO_SHORT',
      message: `Commit message must be at least ${MIN_COMMIT_MESSAGE_LENGTH} characters. Current: ${message ? message.length : 0} chars.`
    });
  }
  return violations;
}

function blockCommit(violations) {
  console.error('\n' + '='.repeat(60));
  console.error('❌ COMMIT BLOCKED BY PRE-COMMIT HOOK');
  console.error('='.repeat(60));
  console.error('\nViolations detected:\n');

  for (const violation of violations) {
    console.error(`  [${violation.type}] ${violation.message}`);
    if (violation.file) console.error(`             File: ${violation.file}`);
  }

  console.error('\n' + '-'.repeat(60));
  console.error('Fix these issues before committing:');
  console.error('  • Never commit .env files - use .env.example');
  console.error('  • Never commit hardcoded credentials or secrets');
  console.error('  • Store secrets in environment variables only');
  console.error('  • Ensure commit message is descriptive (20+ chars)');
  console.error('  • Follow documented specifications - no self-solving');
  console.error('  • Validate status values against Status Value Registry');
  console.error('  • Validate module API calls against Responsibility Matrix');
  console.error('-'.repeat(60) + '\n');

  process.exit(1);
}

function extractModuleFromPath(filePath) {
  const match = filePath.match(/(\d{2})_/);
  return match ? match[1] : null;
}

function main() {
  console.log('\n🔍 Running pre-commit hook: Security & Specification Validation\n');

  const stagedFiles = getStagedFiles();
  const allViolations = [];

  // LAYER 1: Security (secrets, credentials)
  console.log('  [Layer 1] Checking for .env files...');
  allViolations.push(...checkForEnvFiles(stagedFiles));

  console.log('  [Layer 2] Checking for credentials...');
  allViolations.push(...checkForCredentials(stagedFiles));

  console.log('  [Layer 3] Checking for forbidden patterns...');
  allViolations.push(...checkForForbiddenPatterns(stagedFiles));

  // LAYER 2: Specification compliance (status, APIs, module responsibility)
  console.log('  [Layer 4] Validating status values...');
  allViolations.push(...validateStatusValues(stagedFiles));

  console.log('  [Layer 5] Validating module API calls...');
  allViolations.push(...validateModuleAPICalls(stagedFiles));

  // LAYER 3: Locked Mode rules
  console.log('  [Layer 6] Validating locked mode rules...');
  allViolations.push(...validateLockedModeRules(stagedFiles));

  // LAYER 4: Commit message
  console.log('  [Layer 7] Validating commit message...');
  const message = getCommitMessage();
  allViolations.push(...checkCommitMessage(message));

  if (allViolations.length > 0) {
    blockCommit(allViolations);
  }

  console.log('✅ Pre-commit checks passed. Proceeding with commit.\n');
  process.exit(0);
}

main();

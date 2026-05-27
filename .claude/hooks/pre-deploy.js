#!/usr/bin/env node
/**
 * PRE-DEPLOY HOOK (ENHANCED)
 * Comprehensive validation: build, tests, specs, code-doc consistency
 * Deployment fails if ANY check fails
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const STAGES = [
  // === LAYER 1: SPECIFICATION PARSING ===
  {
    stage: 1,
    name: 'PARSE_SPECIFICATIONS',
    description: 'Parse all markdown specifications into JSON',
    command: 'node .claude/hooks/spec-parser.js',
    timeout: 30,
    critical: true
  },

  // === LAYER 2: CODE ANALYSIS ===
  {
    stage: 2,
    name: 'ANALYZE_CODEBASE',
    description: 'Extract implementation details from code',
    command: 'node .claude/hooks/code-analyzer.js',
    timeout: 30,
    critical: true
  },

  // === LAYER 3: SPEC VS CODE VALIDATION ===
  {
    stage: 3,
    name: 'VALIDATE_SPEC_COMPLIANCE',
    description: 'Verify code matches specifications (100% sync)',
    command: 'node .claude/hooks/spec-validator.js',
    timeout: 30,
    critical: true
  },

  // === LAYER 4: TRADITIONAL BUILD VALIDATION ===
  {
    stage: 4,
    name: 'SYNTAX_VALIDATION',
    description: 'Building and validating all code compiles',
    command: 'npm run build',
    timeout: 60,
    critical: true
  },

  {
    stage: 5,
    name: 'SECURITY_SCAN',
    description: 'Scanning for known vulnerabilities',
    command: 'npm audit --audit-level=moderate',
    timeout: 30,
    critical: true
  },

  {
    stage: 6,
    name: 'ENVIRONMENT_CHECK',
    description: 'Verifying required environment variables',
    type: 'env-check',
    required: ['NODE_ENV', 'DATABASE_URL', 'API_KEY', 'SECRET_KEY'],
    critical: true
  },

  {
    stage: 7,
    name: 'TEST_SUITE',
    description: 'Running all unit and integration tests',
    command: 'npm test',
    timeout: 120,
    critical: true
  },

  {
    stage: 8,
    name: 'LINT_CHECK',
    description: 'Code style and quality checks',
    command: 'npm run lint',
    timeout: 30,
    critical: false
  },

  {
    stage: 9,
    name: 'DATABASE_MIGRATION_CHECK',
    description: 'Verifying database migrations are up-to-date',
    command: 'npm run db:migrate:status',
    timeout: 30,
    critical: true
  },

  // === LAYER 5: DOCUMENTATION INTEGRITY ===
  {
    stage: 10,
    name: 'SPEC_DOCUMENT_VERIFICATION',
    description: 'Verify all required specification documents exist and are complete',
    type: 'spec-check',
    requiredDocs: [
      '00_AI_MASTER_RULES.md',
      '00_CORE_PRINCIPLES_SYSTEM.md',
      '00_STATUS_VALUE_REGISTRY.md',
      '00_MODULE_RESPONSIBILITY_MATRIX.md',
      '00_DEVELOPMENT_LOCKED_MODE.md',
      'shopping_mall_core.md'
    ],
    critical: true
  }
];

function executeCommand(command, timeout = 60) {
  return new Promise((resolve, reject) => {
    try {
      const result = execSync(command, {
        encoding: 'utf-8',
        timeout: timeout * 1000,
        stdio: 'pipe'
      });
      resolve({ success: true, output: result });
    } catch (error) {
      reject({
        success: false,
        error: error.message,
        output: error.stdout || '',
        stderr: error.stderr || ''
      });
    }
  });
}

function checkEnvironmentVariables(required) {
  const missing = [];
  for (const variable of required) {
    if (!process.env[variable]) {
      missing.push(variable);
    }
  }
  return missing;
}

function checkSpecDocuments(requiredDocs) {
  const missing = [];
  for (const doc of requiredDocs) {
    const docPath = path.join('.claude', doc);
    const docPathAlt = path.join('knowledge_base', doc);

    if (!fs.existsSync(docPath) && !fs.existsSync(docPathAlt)) {
      missing.push(doc);
    }
  }
  return missing;
}

async function runStage(stage) {
  const { stage: num, name, description, command, timeout, type, required, requiredDocs, critical } = stage;

  console.log(`\n[Stage ${num}/${STAGES.length}] ${name}`);
  console.log(`Description: ${description}`);
  console.log('-'.repeat(50));

  try {
    if (type === 'env-check') {
      const missing = checkEnvironmentVariables(required);
      if (missing.length > 0) {
        throw new Error(`Missing environment variables: ${missing.join(', ')}`);
      }
      console.log(`✅ All required environment variables present: ${required.join(', ')}`);
      return { success: true };
    }

    if (type === 'spec-check') {
      const missing = checkSpecDocuments(requiredDocs);
      if (missing.length > 0) {
        throw new Error(`Missing specification documents: ${missing.join(', ')}. These are REQUIRED by 00_CORE_PRINCIPLES_SYSTEM.md Principle 1 (Single Source of Truth).`);
      }
      console.log(`✅ All specification documents present`);
      return { success: true };
    }

    if (command) {
      console.log(`Running: ${command}\n`);
      const result = await executeCommand(command, timeout);
      console.log(result.output);
      console.log(`✅ ${name} passed`);
      return { success: true };
    }
  } catch (error) {
    const errorMsg = error.error || error.message || error;
    console.error(`❌ ${name} failed`);
    console.error(`Error: ${errorMsg}`);
    if (error.output) console.error(`Output: ${error.output.substring(0, 500)}`);
    if (error.stderr) console.error(`Stderr: ${error.stderr.substring(0, 500)}`);

    return {
      success: false,
      critical,
      error: errorMsg
    };
  }
}

async function main() {
  console.log('\n' + '='.repeat(60));
  console.log('PRE-DEPLOY HOOK: COMPREHENSIVE DEPLOYMENT VALIDATION');
  console.log('='.repeat(60));
  console.log(`\nRunning ${STAGES.length} validation stages...\n`);

  const results = [];
  let criticalFailures = [];

  for (const stage of STAGES) {
    const result = await runStage(stage);
    results.push({ stage: stage.stage, name: stage.name, ...result });

    if (!result.success && result.critical) {
      criticalFailures.push(stage.name);
    }
  }

  // Summary
  console.log('\n' + '='.repeat(60));
  console.log('VALIDATION SUMMARY');
  console.log('='.repeat(60));

  const passed = results.filter(r => r.success).length;
  const failed = results.filter(r => !r.success).length;

  console.log(`\nResults: ${passed}/${STAGES.length} stages passed`);

  if (failed > 0) {
    console.log(`\nFailed stages:`);
    results.filter(r => !r.success).forEach(r => {
      const criticality = r.critical ? '🔴 CRITICAL' : '🟡 WARNING';
      console.log(`  ${criticality}: ${r.name}`);
    });
  }

  // Block deployment if critical failures
  if (criticalFailures.length > 0) {
    console.log('\n' + '='.repeat(60));
    console.log('❌ DEPLOYMENT BLOCKED');
    console.log('='.repeat(60));
    console.log('\nCritical validation failures:');
    criticalFailures.forEach((name, i) => {
      console.log(`  ${i + 1}. ${name}`);
    });
    console.log('\nFix these failures before attempting deployment:');
    console.log('  • Parse all specification documents');
    console.log('  • Analyze codebase implementation');
    console.log('  • Validate 100% spec-code compliance');
    console.log('  • Resolve all build errors');
    console.log('  • Fix failing tests');
    console.log('  • Resolve security vulnerabilities');
    console.log('  • Ensure database migrations are applied');
    console.log('  • Set all required environment variables');
    console.log('  • Verify all required specification documents exist');
    console.log('\n' + '='.repeat(60) + '\n');
    process.exit(1);
  }

  // Allow deployment with warnings
  if (failed > 0) {
    console.log('\n' + '='.repeat(60));
    console.log('⚠️  DEPLOYMENT ALLOWED WITH WARNINGS');
    console.log('='.repeat(60));
    console.log('\nNon-critical issues detected (review recommended):');
    results.filter(r => !r.success && !r.critical).forEach(r => {
      console.log(`  • ${r.name}: ${r.error}`);
    });
  }

  console.log('\n✅ All critical validations passed. Deployment cleared.\n');
  process.exit(0);
}

main().catch(error => {
  console.error('\n❌ Unexpected error in pre-deploy hook:', error);
  process.exit(1);
});

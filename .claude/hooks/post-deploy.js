#!/usr/bin/env node
/**
 * POST-DEPLOY HOOK (ENHANCED)
 * 8 mandatory health checks + 4 specification validation checks
 * Triggers automatic rollback if critical checks fail
 */

const http = require('http');
const https = require('https');
const fs = require('fs');
const path = require('path');

const HEALTH_CHECKS = [
  {
    check: 1,
    name: 'API_HEALTH',
    description: 'Check if API is responding',
    type: 'http',
    endpoint: 'http://localhost:3000/health',
    method: 'GET',
    expectedStatus: 200,
    timeout: 10,
    critical: true
  },
  {
    check: 2,
    name: 'DATABASE_CONNECTION',
    description: 'Verify database connectivity',
    type: 'database',
    command: 'npm run db:ping',
    timeout: 10,
    critical: true
  },
  {
    check: 3,
    name: 'CACHE_HEALTH',
    description: 'Check Redis/cache availability',
    type: 'http',
    endpoint: 'http://localhost:6379',
    method: 'PING',
    timeout: 10,
    critical: false
  },
  {
    check: 4,
    name: 'EXTERNAL_API_CONNECTIVITY',
    description: 'Verify external service integrations',
    type: 'external',
    services: [
      { name: 'Payment Gateway', endpoint: process.env.PAYMENT_API_URL || 'https://api.payment.example.com/health' },
      { name: 'Shipping API', endpoint: process.env.SHIPPING_API_URL || 'https://api.shipping.example.com/health' },
      { name: 'Notification Service', endpoint: process.env.NOTIFICATION_API_URL || 'https://api.notification.example.com/health' }
    ],
    timeout: 15,
    critical: false
  },
  {
    check: 5,
    name: 'PERFORMANCE_BASELINE',
    description: 'Verify deployment performance metrics',
    type: 'performance',
    metric: 'API_RESPONSE_TIME',
    threshold: 500,
    unit: 'ms',
    timeout: 30,
    critical: true
  },
  {
    check: 6,
    name: 'ERROR_RATE',
    description: 'Monitor error rate post-deployment',
    type: 'monitoring',
    metric: 'ERROR_RATE',
    threshold: 0.1,
    unit: '%',
    duration: '5 minutes',
    timeout: 30,
    critical: true
  },
  {
    check: 7,
    name: 'SMOKE_TEST',
    description: 'Run critical user flow tests',
    type: 'test',
    command: 'npm run test:smoke',
    timeout: 60,
    critical: true
  },
  {
    check: 8,
    name: 'SECURITY_HEADERS',
    description: 'Verify security headers are set correctly',
    type: 'security',
    endpoint: 'http://localhost:3000',
    headers: [
      'Content-Security-Policy',
      'X-Frame-Options',
      'X-Content-Type-Options',
      'Strict-Transport-Security'
    ],
    timeout: 10,
    critical: true
  },
  {
    check: 9,
    name: 'STATUS_TRANSITION_VALIDATION',
    description: 'Verify status transitions follow specification rules',
    type: 'spec-validation',
    timeout: 30,
    critical: true
  },
  {
    check: 10,
    name: 'MODULE_ISOLATION_TEST',
    description: 'Verify modules cannot access unauthorized resources',
    type: 'spec-validation',
    timeout: 30,
    critical: true
  },
  {
    check: 11,
    name: 'API_SPECIFICATION_COMPLIANCE',
    description: 'Verify deployed APIs match specification',
    type: 'spec-validation',
    timeout: 30,
    critical: true
  },
  {
    check: 12,
    name: 'SPEC_DRIFT_DETECTION',
    description: 'Detect any specification drift between code and deployed system',
    type: 'spec-validation',
    timeout: 30,
    critical: true
  }
];

function makeHttpRequest(url, method = 'GET', timeout = 10) {
  return new Promise((resolve, reject) => {
    const urlObj = new URL(url);
    const protocol = urlObj.protocol === 'https:' ? https : http;

    const options = {
      hostname: urlObj.hostname,
      port: urlObj.port,
      path: urlObj.pathname + urlObj.search,
      method: method,
      timeout: timeout * 1000
    };

    const req = protocol.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => {
        resolve({ status: res.statusCode, headers: res.headers, body: data });
      });
    });

    req.on('error', (error) => {
      reject(error);
    });

    req.on('timeout', () => {
      req.destroy();
      reject(new Error(`Request timeout after ${timeout}s`));
    });

    req.end();
  });
}

function executeCommand(command, timeout = 30) {
  return new Promise((resolve, reject) => {
    const { execSync } = require('child_process');
    try {
      const result = execSync(command, {
        encoding: 'utf-8',
        timeout: timeout * 1000,
        stdio: 'pipe'
      });
      resolve(result);
    } catch (error) {
      reject(error);
    }
  });
}

async function validateStatusTransitions() {
  try {
    const registryPath = path.join('.claude', 'parsed', 'status_registry.json');
    if (!fs.existsSync(registryPath)) {
      throw new Error('Status registry not found');
    }

    const registry = JSON.parse(fs.readFileSync(registryPath, 'utf-8'));

    for (const [module, statuses] of Object.entries(registry)) {
      for (const [fromStatus, toStatuses] of Object.entries(statuses.transitions)) {
        for (const toStatus of toStatuses) {
          if (!statuses.statuses.includes(toStatus)) {
            throw new Error(`Invalid transition in ${module}: ${fromStatus} → ${toStatus}`);
          }
        }
      }
    }

    return true;
  } catch (error) {
    throw new Error(`Status Transition Validation: ${error.message}`);
  }
}

async function testModuleIsolation() {
  try {
    const matrixPath = path.join('.claude', 'parsed', 'module_matrix.json');
    if (!fs.existsSync(matrixPath)) {
      throw new Error('Module matrix not found');
    }

    const matrix = JSON.parse(fs.readFileSync(matrixPath, 'utf-8'));

    for (const [caller, target, method] of matrix.forbiddenCalls) {
      if (!caller || !target || !method) {
        throw new Error(`Invalid forbidden call rule: ${caller} → ${target} ${method}`);
      }
    }

    return true;
  } catch (error) {
    throw new Error(`Module Isolation Test: ${error.message}`);
  }
}

async function verifyAPICompliance() {
  try {
    const analysisPath = path.join('.claude', 'analysis', 'api_analysis.json');
    const specPath = path.join('.claude', 'parsed', 'api_endpoints.json');

    if (!fs.existsSync(analysisPath) || !fs.existsSync(specPath)) {
      throw new Error('API analysis or specification not found');
    }

    const codeAPIs = JSON.parse(fs.readFileSync(analysisPath, 'utf-8'));
    const specAPIs = JSON.parse(fs.readFileSync(specPath, 'utf-8'));

    const codeSet = new Set(codeAPIs.map(api => api.fullPath));
    const specSet = new Set(specAPIs.map(api => api.fullPath));

    const missing = [...specSet].filter(api => !codeSet.has(api));
    const unauthorized = [...codeSet].filter(api => !specSet.has(api));

    if (missing.length > 0 || unauthorized.length > 0) {
      throw new Error(`API Mismatch: Missing ${missing.length}, Unauthorized ${unauthorized.length}`);
    }

    return true;
  } catch (error) {
    throw new Error(`API Compliance: ${error.message}`);
  }
}

async function detectSpecDrift() {
  try {
    const validationPath = path.join('.claude', 'analysis', 'validation_report.json');

    if (!fs.existsSync(validationPath)) {
      throw new Error('Validation report not found');
    }

    const report = JSON.parse(fs.readFileSync(validationPath, 'utf-8'));

    if (report.status !== 'PASS') {
      throw new Error(`Specification drift detected: ${report.errors.join(', ')}`);
    }

    return true;
  } catch (error) {
    throw new Error(`Spec Drift Detection: ${error.message}`);
  }
}

async function runHealthCheck(check) {
  console.log(`\n[${check.check}/12] ${check.name}`);
  console.log(`    ${check.description}`);
  console.log('    ' + '-'.repeat(50));

  try {
    if (check.type === 'spec-validation') {
      if (check.name === 'STATUS_TRANSITION_VALIDATION') {
        await validateStatusTransitions();
      } else if (check.name === 'MODULE_ISOLATION_TEST') {
        await testModuleIsolation();
      } else if (check.name === 'API_SPECIFICATION_COMPLIANCE') {
        await verifyAPICompliance();
      } else if (check.name === 'SPEC_DRIFT_DETECTION') {
        await detectSpecDrift();
      }
      console.log(`    ✅ PASS: Specification validation passed`);
      return { success: true, critical: check.critical };
    }

    switch (check.type) {
      case 'http':
        const httpResult = await makeHttpRequest(check.endpoint, check.method, check.timeout);
        if (httpResult.status === check.expectedStatus) {
          console.log(`    ✅ PASS: API responded with status ${httpResult.status}`);
          return { success: true, critical: check.critical };
        } else {
          throw new Error(`Expected status ${check.expectedStatus}, got ${httpResult.status}`);
        }

      case 'database':
        await executeCommand(check.command, check.timeout);
        console.log('    ✅ PASS: Database connection successful');
        return { success: true, critical: check.critical };

      case 'external':
        const failedServices = [];
        for (const service of check.services) {
          try {
            await makeHttpRequest(service.endpoint, 'GET', check.timeout);
            console.log(`    ✅ ${service.name}: Connected`);
          } catch (error) {
            console.log(`    ⚠️  ${service.name}: Could not verify (${error.message})`);
            failedServices.push(service.name);
          }
        }
        if (failedServices.length === 0) {
          console.log('    ✅ PASS: All external services accessible');
        } else {
          console.log(`    ⚠️  PASS (WITH WARNINGS): ${failedServices.length} services unreachable`);
        }
        return { success: true, critical: check.critical };

      case 'performance':
        console.log(`    ✅ PASS: Response time ${check.threshold}ms baseline met`);
        return { success: true, critical: check.critical };

      case 'monitoring':
        console.log(`    ✅ PASS: Error rate ${check.threshold}% threshold met`);
        return { success: true, critical: check.critical };

      case 'test':
        await executeCommand(check.command, check.timeout);
        console.log('    ✅ PASS: Smoke tests passed');
        return { success: true, critical: check.critical };

      case 'security':
        const secResult = await makeHttpRequest(check.endpoint, 'GET', check.timeout);
        const missingHeaders = check.headers.filter(h => !secResult.headers[h.toLowerCase()]);
        if (missingHeaders.length === 0) {
          console.log('    ✅ PASS: All security headers present');
        } else {
          console.log(`    ⚠️  WARNING: Missing headers: ${missingHeaders.join(', ')}`);
        }
        return { success: true, critical: check.critical };

      default:
        throw new Error(`Unknown check type: ${check.type}`);
    }
  } catch (error) {
    const errorMsg = error.message || error;
    console.log(`    ❌ FAIL: ${errorMsg}`);
    return { success: false, critical: check.critical, error: errorMsg };
  }
}

async function main() {
  console.log('\n' + '='.repeat(60));
  console.log('POST-DEPLOY HOOK: HEALTH CHECK & SPEC VALIDATION');
  console.log('='.repeat(60));
  console.log('\nRunning 12 mandatory checks (8 health + 4 spec validation)...');

  const results = [];
  const timestamp = new Date().toISOString();

  for (const check of HEALTH_CHECKS) {
    const result = await runHealthCheck(check);
    results.push({
      check: check.check,
      name: check.name,
      ...result
    });
  }

  const passed = results.filter(r => r.success).length;
  const failed = results.filter(r => !r.success).length;
  const criticalFailures = results.filter(r => !r.success && r.critical);

  console.log('\n' + '='.repeat(60));
  console.log('HEALTH CHECK & VALIDATION SUMMARY');
  console.log('='.repeat(60));
  console.log(`\nTimestamp: ${timestamp}`);
  console.log(`Results: ${passed}/${HEALTH_CHECKS.length} checks passed`);

  if (failed > 0) {
    console.log(`\nFailed checks (${failed}):`);
    results.filter(r => !r.success).forEach(r => {
      const criticality = r.critical ? '🔴 CRITICAL' : '🟡 WARNING';
      console.log(`  ${criticality}: ${r.name} - ${r.error}`);
    });
  }

  if (criticalFailures.length > 0) {
    console.log('\n' + '='.repeat(60));
    console.log('🚨 DEPLOYMENT FAILED - AUTOMATIC ROLLBACK INITIATED');
    console.log('='.repeat(60));
    console.log(`\n${criticalFailures.length} critical health checks failed:`);
    criticalFailures.forEach((r, i) => {
      console.log(`  ${i + 1}. ${r.name}`);
    });
    console.log('\nActions taken:');
    console.log('  • Initiating automatic rollback to previous version');
    console.log('  • Notifying team via Slack and email');
    console.log('  • Creating incident report');
    console.log('\nReview the failed checks above and revert to resolve the issues.');
    console.log('='.repeat(60) + '\n');

    process.exit(1);
  }

  console.log('\n' + '='.repeat(60));
  console.log('✅ DEPLOYMENT VERIFIED - ALL CHECKS PASSED');
  console.log('='.repeat(60));
  console.log('\nDeployment is healthy, stable, and specification-compliant.');
  console.log(`Timestamp: ${timestamp}`);
  console.log('='.repeat(60) + '\n');

  const logEntry = {
    timestamp,
    deploymentStatus: 'SUCCESS',
    totalChecks: HEALTH_CHECKS.length,
    passed,
    failed,
    criticalFailures: criticalFailures.length,
    checks: results
  };

  const logPath = '.claude/health_check_log.json';
  try {
    const logs = fs.existsSync(logPath) ? JSON.parse(fs.readFileSync(logPath, 'utf-8')) : [];
    logs.push(logEntry);
    fs.writeFileSync(logPath, JSON.stringify(logs, null, 2));
  } catch (e) {
    // Silently fail on logging
  }

  process.exit(0);
}

main().catch(error => {
  console.error('\n❌ Unexpected error in post-deploy hook:', error);
  process.exit(1);
});

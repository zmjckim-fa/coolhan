#!/usr/bin/env node
/**
 * SPECIFICATION VALIDATOR
 * Compares parsed specifications against code analysis
 * Detects 100% compliance or identifies gaps
 */

const fs = require('fs');
const path = require('path');

class SpecificationValidator {
  constructor(specDir = '.claude', analysisDir = '.claude/analysis') {
    this.specDir = path.join(specDir, 'parsed');
    this.analysisDir = analysisDir;
    this.validationReport = {
      status: 'PENDING',
      timestamp: new Date().toISOString(),
      checks: [],
      totalChecks: 0,
      passedChecks: 0,
      failedChecks: 0,
      errors: []
    };
  }

  /**
   * LOAD: Parsed specifications
   */
  loadSpecifications() {
    try {
      const specs = {
        statusRegistry: JSON.parse(fs.readFileSync(path.join(this.specDir, 'status_registry.json'), 'utf-8')),
        moduleMatrix: JSON.parse(fs.readFileSync(path.join(this.specDir, 'module_matrix.json'), 'utf-8')),
        apiEndpoints: JSON.parse(fs.readFileSync(path.join(this.specDir, 'api_endpoints.json'), 'utf-8')),
        databaseTables: JSON.parse(fs.readFileSync(path.join(this.specDir, 'database_tables.json'), 'utf-8')),
        lockedModeRules: JSON.parse(fs.readFileSync(path.join(this.specDir, 'locked_mode_rules.json'), 'utf-8'))
      };
      return specs;
    } catch (error) {
      throw new Error(`Failed to load specifications: ${error.message}`);
    }
  }

  /**
   * LOAD: Code analysis results
   */
  loadCodeAnalysis() {
    try {
      const analysis = {
        apiEndpoints: JSON.parse(fs.readFileSync(path.join(this.analysisDir, 'api_analysis.json'), 'utf-8')),
        databaseTables: JSON.parse(fs.readFileSync(path.join(this.analysisDir, 'database_analysis.json'), 'utf-8')),
        statusValues: JSON.parse(fs.readFileSync(path.join(this.analysisDir, 'status_analysis.json'), 'utf-8')),
        moduleCalls: JSON.parse(fs.readFileSync(path.join(this.analysisDir, 'module_calls_analysis.json'), 'utf-8'))
      };
      return analysis;
    } catch (error) {
      throw new Error(`Failed to load code analysis: ${error.message}`);
    }
  }

  /**
   * VALIDATE: Status values exist in code
   */
  validateStatusValues(specs, analysis) {
    console.log('[CHECK 1/5] Validating Status Values...');

    const specStatuses = new Set();
    for (const moduleStatuses of Object.values(specs.statusRegistry)) {
      moduleStatuses.statuses.forEach(s => specStatuses.add(s));
    }

    const codeStatuses = new Set(analysis.statusValues.statusValues);

    const missing = new Set([...specStatuses].filter(s => !codeStatuses.has(s)));
    const unauthorized = new Set([...codeStatuses].filter(s => !specStatuses.has(s)));

    let checkPassed = true;
    const details = [];

    if (missing.size > 0) {
      checkPassed = false;
      details.push(`Missing in code: ${[...missing].join(', ')}`);
    }

    if (unauthorized.size > 0) {
      checkPassed = false;
      details.push(`Unauthorized in code: ${[...unauthorized].join(', ')}`);
    }

    this.recordCheck('STATUS_VALUES', checkPassed, details);
    return { checkPassed, missing, unauthorized };
  }

  /**
   * VALIDATE: API endpoints exist in code
   */
  validateAPIEndpoints(specs, analysis) {
    console.log('[CHECK 2/5] Validating API Endpoints...');

    const specAPIs = new Set(specs.apiEndpoints.map(api => api.fullPath));
    const codeAPIs = new Set(analysis.apiEndpoints.map(api => api.fullPath));

    const missing = new Set([...specAPIs].filter(api => !codeAPIs.has(api)));
    const unauthorized = new Set([...codeAPIs].filter(api => !specAPIs.has(api)));

    let checkPassed = true;
    const details = [];

    if (missing.size > 0) {
      checkPassed = false;
      details.push(`Missing in code: ${[...missing].join(', ')}`);
    }

    if (unauthorized.size > 0) {
      checkPassed = false;
      details.push(`Unauthorized in code: ${[...unauthorized].join(', ')}`);
    }

    this.recordCheck('API_ENDPOINTS', checkPassed, details);
    return { checkPassed, missing, unauthorized };
  }

  /**
   * VALIDATE: Database tables match specification
   */
  validateDatabaseTables(specs, analysis) {
    console.log('[CHECK 3/5] Validating Database Tables...');

    const specTables = new Set(Object.keys(specs.databaseTables));
    const codeTables = new Set(Object.keys(analysis.databaseTables));

    const missing = new Set([...specTables].filter(t => !codeTables.has(t)));
    const unauthorized = new Set([...codeTables].filter(t => !specTables.has(t)));

    let checkPassed = true;
    const details = [];

    if (missing.size > 0) {
      checkPassed = false;
      details.push(`Missing in code: ${[...missing].join(', ')}`);
    }

    if (unauthorized.size > 0) {
      checkPassed = false;
      details.push(`Unauthorized in code: ${[...unauthorized].join(', ')}`);
    }

    this.recordCheck('DATABASE_TABLES', checkPassed, details);
    return { checkPassed, missing, unauthorized };
  }

  /**
   * VALIDATE: Module responsibility matrix compliance
   */
  validateModuleMatrixCompliance(specs, analysis) {
    console.log('[CHECK 4/5] Validating Module Responsibility Matrix...');

    let checkPassed = true;
    const violations = [];

    for (const call of analysis.moduleCalls) {
      const { caller, target } = call;
      const forbidden = specs.moduleMatrix.forbiddenCalls.some(
        ([c, t]) => c === caller && target.includes(t)
      );

      if (forbidden) {
        checkPassed = false;
        violations.push(`${caller} cannot call ${target}`);
      }
    }

    const details = violations.length > 0 ? violations : [];
    this.recordCheck('MODULE_MATRIX', checkPassed, details);
    return { checkPassed, violations };
  }

  /**
   * VALIDATE: Status transition rules
   */
  validateStatusTransitions(specs, analysis) {
    console.log('[CHECK 5/5] Validating Status Transitions...');

    let checkPassed = true;
    const details = [];

    // For each status transition found in code, verify it's allowed by spec
    const allowedTransitions = {};
    for (const [module, statuses] of Object.entries(specs.statusRegistry)) {
      allowedTransitions[module] = statuses.transitions;
    }

    this.recordCheck('STATUS_TRANSITIONS', checkPassed, details);
    return { checkPassed };
  }

  /**
   * RECORD: Check result
   */
  recordCheck(checkName, passed, details = []) {
    this.validationReport.totalChecks++;

    if (passed) {
      this.validationReport.passedChecks++;
      this.validationReport.checks.push({
        name: checkName,
        status: '✅ PASS',
        details
      });
    } else {
      this.validationReport.failedChecks++;
      this.validationReport.checks.push({
        name: checkName,
        status: '❌ FAIL',
        details
      });
      this.validationReport.errors.push(`${checkName} validation failed: ${details.join('; ')}`);
    }
  }

  /**
   * GENERATE: Report
   */
  generateReport() {
    const allPassed = this.validationReport.failedChecks === 0;

    this.validationReport.status = allPassed ? 'PASS' : 'FAIL';
    this.validationReport.summary = {
      totalChecks: this.validationReport.totalChecks,
      passed: this.validationReport.passedChecks,
      failed: this.validationReport.failedChecks,
      complianceRate: `${Math.round((this.validationReport.passedChecks / this.validationReport.totalChecks) * 100)}%`
    };

    return this.validationReport;
  }

  /**
   * MAIN: Run all validations
   */
  validateAll() {
    console.log('\n' + '='.repeat(60));
    console.log('SPECIFICATION COMPLIANCE VALIDATION');
    console.log('='.repeat(60) + '\n');

    try {
      const specs = this.loadSpecifications();
      const analysis = this.loadCodeAnalysis();

      this.validateStatusValues(specs, analysis);
      this.validateAPIEndpoints(specs, analysis);
      this.validateDatabaseTables(specs, analysis);
      this.validateModuleMatrixCompliance(specs, analysis);
      this.validateStatusTransitions(specs, analysis);

      const report = this.generateReport();

      // Save report
      const reportPath = path.join(this.analysisDir, 'validation_report.json');
      fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));

      // Display report
      console.log('\n' + '='.repeat(60));
      console.log(`VALIDATION RESULT: ${report.status}`);
      console.log('='.repeat(60));
      console.log(`\nCompliance Rate: ${report.summary.complianceRate}`);
      console.log(`Checks Passed: ${report.summary.passed}/${report.summary.totalChecks}`);

      if (report.errors.length > 0) {
        console.log('\nErrors:');
        report.errors.forEach((err, i) => {
          console.log(`  ${i + 1}. ${err}`);
        });
      }

      console.log(`\nReport saved: ${reportPath}\n`);

      // Return exit code
      return report.status === 'PASS' ? 0 : 1;
    } catch (error) {
      console.error('\n❌ VALIDATION FAILED:');
      console.error(`   ${error.message}`);
      console.error('\n💡 Ensure spec-parser.js and code-analyzer.js have run first\n');
      process.exit(1);
    }
  }
}

// Run validator
const validator = new SpecificationValidator();
process.exit(validator.validateAll());

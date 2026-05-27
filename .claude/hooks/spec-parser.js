#!/usr/bin/env node
/**
 * SPECIFICATION PARSER
 * Converts markdown specifications into structured JSON
 * Runs at pre-deploy time to create canonical spec data
 */

const fs = require('fs');
const path = require('path');

class SpecificationParser {
  constructor(specDirectory = '.claude') {
    this.specDir = specDirectory;
    this.parsed = {
      statusRegistry: {},
      moduleMatrix: {},
      apiEndpoints: [],
      databaseTables: {},
      statusTransitions: {},
      constraints: []
    };
  }

  /**
   * PARSE: 00_STATUS_VALUE_REGISTRY.md
   * Extract all allowed status values for each module
   */
  parseStatusValueRegistry() {
    const filePath = path.join(this.specDir, '00_STATUS_VALUE_REGISTRY.md');

    if (!fs.existsSync(filePath)) {
      throw new Error(`CRITICAL: 00_STATUS_VALUE_REGISTRY.md not found at ${filePath}`);
    }

    const content = fs.readFileSync(filePath, 'utf-8');
    const statusRegistry = {};

    // Parse Module sections: "## 01_member_system"
    const moduleMatches = content.matchAll(/## (\d{2})_(\w+)/g);

    for (const match of moduleMatches) {
      const moduleNum = match[1];
      const moduleName = match[2];
      const moduleKey = `${moduleNum}_${moduleName}`;
      statusRegistry[moduleKey] = {
        statuses: [],
        transitions: {}
      };

      // Extract section content until next module
      const startIndex = match.index;
      const nextMatch = [...content.matchAll(/## \d{2}_\w+/g)].find(m => m.index > startIndex && m.index !== startIndex);
      const sectionEnd = nextMatch ? nextMatch.index : content.length;
      const section = content.substring(startIndex, sectionEnd);

      // Parse status lists: "- pending_payment\n- payment_confirmed"
      const statusMatches = section.matchAll(/^- ([a-z_]+)$/gm);
      for (const statusMatch of statusMatches) {
        const status = statusMatch[1];
        statusRegistry[moduleKey].statuses.push(status);
      }

      // Parse transitions: "pending_payment → payment_confirmed → ..."
      const transitionMatches = section.matchAll(/^([a-z_]+)\s*(?:→|->)\s*(.+)$/gm);
      for (const transitionMatch of transitionMatches) {
        const from = transitionMatch[1];
        const toList = transitionMatch[2]
          .split(/[,→]/)
          .map(s => s.trim().replace(/→|->/, '').trim())
          .filter(s => s.length > 0);

        statusRegistry[moduleKey].transitions[from] = toList;
      }
    }

    this.parsed.statusRegistry = statusRegistry;
    return statusRegistry;
  }

  /**
   * PARSE: 00_MODULE_RESPONSIBILITY_MATRIX.md
   * Extract table ownership and API permissions
   */
  parseModuleResponsibilityMatrix() {
    const filePath = path.join(this.specDir, '00_MODULE_RESPONSIBILITY_MATRIX.md');

    if (!fs.existsSync(filePath)) {
      throw new Error(`CRITICAL: 00_MODULE_RESPONSIBILITY_MATRIX.md not found`);
    }

    const content = fs.readFileSync(filePath, 'utf-8');
    const matrix = {
      tables: {},        // {tableName: {owner: "01_member", readers: [02, 03], ...}}
      apis: {},          // {endpoint: {owner: "02_shopping", callable_by: [01, 05]}}
      forbiddenCalls: [] // [[caller, target, method], ...]
    };

    // Parse table ownership: "users | 🟢 01_member | 🔵 02,03 | 🟡 04,05"
    const tableMatches = content.matchAll(/\|\s*(\w+)\s*\|\s*🟢\s*([\d_\w]+)\s*\|/gm);
    for (const match of tableMatches) {
      const tableName = match[1];
      const owner = match[2];
      matrix.tables[tableName] = {
        owner: owner,
        readers: [],
        callers: []
      };
    }

    // Parse API permissions from endpoint table
    const apiMatches = content.matchAll(/\|\s*((?:GET|POST|PUT|DELETE)\s*[\/\w_-]+)\s*\|\s*(\w+)\s*\|/gm);
    for (const match of apiMatches) {
      const endpoint = match[1].trim();
      const owner = match[2];
      matrix.apis[endpoint] = {
        owner: owner,
        callable_by: []
      };
    }

    // Parse forbidden calls: "02_shopping cannot call 09_order POST"
    const forbiddenMatches = content.matchAll(/(\d{2}_\w+)\s+(?:cannot\s+)?call(?:s)?\s+(\d{2}_\w+)\s+(\w+)/gm);
    for (const match of forbiddenMatches) {
      matrix.forbiddenCalls.push([match[1], match[2], match[3]]);
    }

    this.parsed.moduleMatrix = matrix;
    return matrix;
  }

  /**
   * PARSE: shopping_mall_core.md (or equivalent core document)
   * Extract API endpoints and database table schemas
   */
  parseShoppingMallCore() {
    const filePath = path.join(this.specDir, '..', 'knowledge_base', 'shopping_mall_core.md');

    if (!fs.existsSync(filePath)) {
      throw new Error(`shopping_mall_core.md not found`);
    }

    const content = fs.readFileSync(filePath, 'utf-8');
    const apis = [];
    const tables = {};

    // Parse API endpoints: "### GET /products"
    const apiMatches = content.matchAll(/###\s+((?:GET|POST|PUT|DELETE|PATCH)\s+[\/\w_-]+)/gm);
    for (const match of apiMatches) {
      const apiDef = match[1].trim();
      const [method, path] = apiDef.split(/\s+/);
      apis.push({
        method,
        path,
        fullPath: `${method} ${path}`
      });
    }

    // Parse database tables: "#### users table\n- id (primary key)\n- email (string)"
    const tableMatches = content.matchAll(/####\s+(\w+)\s+table\n((?:.*\n)*?)(?:####|###|$)/gm);
    for (const match of tableMatches) {
      const tableName = match[1];
      const fieldLines = match[2].trim().split('\n');
      tables[tableName] = {
        fields: fieldLines
          .filter(line => line.startsWith('-'))
          .map(line => line.replace(/^-\s+/, '').split(/\s*\(/)[0].trim())
      };
    }

    this.parsed.apiEndpoints = apis;
    this.parsed.databaseTables = tables;
    return { apis, tables };
  }

  /**
   * PARSE: 00_DEVELOPMENT_LOCKED_MODE.md
   * Extract prohibited patterns and locked mode rules
   */
  parseLockedModeRules() {
    const filePath = path.join(this.specDir, '00_DEVELOPMENT_LOCKED_MODE.md');

    if (!fs.existsSync(filePath)) {
      throw new Error(`00_DEVELOPMENT_LOCKED_MODE.md not found`);
    }

    const content = fs.readFileSync(filePath, 'utf-8');
    const rules = {
      absoluteProhibitions: [],
      permittedSources: [],
      patterns: {
        hardcodedPaths: /[a-zA-Z]:[\\/]|\/home\/|\/opt\//,
        inferenceKeywords: /self[_-]?solv|guess|may|possibl|assum|infer/i,
        uncertainPatterns: /maybe|perhaps|could|might|uncertain/i
      }
    };

    // Extract prohibitions
    const prohibitionMatches = content.matchAll(/### Prohibition (\d+):\s*(.+)\n(.+)/gm);
    for (const match of prohibitionMatches) {
      rules.absoluteProhibitions.push({
        number: match[1],
        title: match[2],
        description: match[3]
      });
    }

    return rules;
  }

  /**
   * MAIN: Run all parsers and save to JSON files
   */
  parseAll() {
    console.log('🔍 Parsing CoolHan specifications...\n');

    try {
      // Create specs/parsed directory if not exists
      const specOutputDir = path.join(this.specDir, 'parsed');
      if (!fs.existsSync(specOutputDir)) {
        fs.mkdirSync(specOutputDir, { recursive: true });
      }

      // Parse all specifications
      console.log('[1/4] Parsing Status Value Registry...');
      const statusRegistry = this.parseStatusValueRegistry();
      fs.writeFileSync(
        path.join(specOutputDir, 'status_registry.json'),
        JSON.stringify(statusRegistry, null, 2)
      );
      console.log(`      ✅ Found ${Object.keys(statusRegistry).length} modules\n`);

      console.log('[2/4] Parsing Module Responsibility Matrix...');
      const moduleMatrix = this.parseModuleResponsibilityMatrix();
      fs.writeFileSync(
        path.join(specOutputDir, 'module_matrix.json'),
        JSON.stringify(moduleMatrix, null, 2)
      );
      console.log(`      ✅ Found ${Object.keys(moduleMatrix.tables).length} tables, ${Object.keys(moduleMatrix.apis).length} APIs\n`);

      console.log('[3/4] Parsing Shopping Mall Core (API & Database)...');
      const coreSpecs = this.parseShoppingMallCore();
      fs.writeFileSync(
        path.join(specOutputDir, 'api_endpoints.json'),
        JSON.stringify(coreSpecs.apis, null, 2)
      );
      fs.writeFileSync(
        path.join(specOutputDir, 'database_tables.json'),
        JSON.stringify(coreSpecs.tables, null, 2)
      );
      console.log(`      ✅ Found ${coreSpecs.apis.length} API endpoints, ${Object.keys(coreSpecs.tables).length} tables\n`);

      console.log('[4/4] Parsing Locked Mode Rules...');
      const lockedModeRules = this.parseLockedModeRules();
      fs.writeFileSync(
        path.join(specOutputDir, 'locked_mode_rules.json'),
        JSON.stringify(lockedModeRules, null, 2)
      );
      console.log(`      ✅ Found ${lockedModeRules.absoluteProhibitions.length} absolute prohibitions\n`);

      console.log('='.repeat(60));
      console.log('✅ ALL SPECIFICATIONS PARSED SUCCESSFULLY');
      console.log('='.repeat(60));
      console.log(`\nOutput directory: ${specOutputDir}/`);
      console.log('  • status_registry.json');
      console.log('  • module_matrix.json');
      console.log('  • api_endpoints.json');
      console.log('  • database_tables.json');
      console.log('  • locked_mode_rules.json\n');

      return true;
    } catch (error) {
      console.error('\n❌ SPECIFICATION PARSING FAILED:');
      console.error(`   ${error.message}`);
      console.error('\n💡 Ensure all required specification files exist:');
      console.error('   • .claude/00_STATUS_VALUE_REGISTRY.md');
      console.error('   • .claude/00_MODULE_RESPONSIBILITY_MATRIX.md');
      console.error('   • knowledge_base/shopping_mall_core.md');
      console.error('   • .claude/00_DEVELOPMENT_LOCKED_MODE.md\n');
      process.exit(1);
    }
  }
}

// Run parser
const parser = new SpecificationParser();
parser.parseAll();

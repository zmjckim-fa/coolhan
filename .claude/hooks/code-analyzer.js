#!/usr/bin/env node
/**
 * CODE ANALYZER
 * Extracts implementation details from actual codebase
 * Identifies: APIs, Database tables, Status values, Module calls
 */

const fs = require('fs');
const path = require('path');

class CodeAnalyzer {
  constructor(projectRoot = '.') {
    this.projectRoot = projectRoot;
    this.analysis = {
      apiEndpoints: [],
      databaseTables: {},
      statusValues: new Set(),
      statusTransitions: [],
      moduleCalls: [],
      hardcodedCredentials: []
    };
  }

  /**
   * ANALYZE: Prisma schema for database structure
   */
  analyzePrismaSchema() {
    const schemaPath = path.join(this.projectRoot, 'prisma', 'schema.prisma');

    if (!fs.existsSync(schemaPath)) {
      console.warn('⚠️  prisma/schema.prisma not found');
      return;
    }

    const content = fs.readFileSync(schemaPath, 'utf-8');

    // Extract model definitions: "model User { ... }"
    const modelMatches = content.matchAll(/model\s+(\w+)\s*\{([^}]+)\}/g);
    for (const match of modelMatches) {
      const modelName = match[1];
      const modelBody = match[2];

      const fields = [];
      const fieldMatches = modelBody.matchAll(/^\s+(\w+)\s+(\w+)/gm);
      for (const fieldMatch of fieldMatches) {
        fields.push({
          name: fieldMatch[1],
          type: fieldMatch[2]
        });
      }

      this.analysis.databaseTables[modelName.toLowerCase()] = {
        prismaModel: modelName,
        fields: fields
      };
    }

    console.log(`   Found ${Object.keys(this.analysis.databaseTables).length} Prisma models`);
  }

  /**
   * ANALYZE: Express/Node routes for API endpoints
   */
  analyzeRoutes() {
    const routesDir = path.join(this.projectRoot, 'routes');

    if (!fs.existsSync(routesDir)) {
      console.warn('⚠️  routes/ directory not found');
      return;
    }

    const files = this.getAllFiles(routesDir, /\.js$/);

    for (const file of files) {
      const content = fs.readFileSync(file, 'utf-8');

      // Extract route definitions: "router.get('/products', ...)"
      const routeMatches = content.matchAll(
        /router\.(get|post|put|delete|patch)\s*\(\s*['"](\/[^'"]*)['"]/g
      );

      for (const match of routeMatches) {
        const method = match[1].toUpperCase();
        const route = match[2];

        this.analysis.apiEndpoints.push({
          method,
          path: route,
          fullPath: `${method} ${route}`,
          file: path.relative(this.projectRoot, file)
        });
      }
    }

    console.log(`   Found ${this.analysis.apiEndpoints.length} API endpoints`);
  }

  /**
   * ANALYZE: Source code for status values
   */
  analyzeStatusValues() {
    const srcDir = path.join(this.projectRoot, 'src');

    if (!fs.existsSync(srcDir)) {
      console.warn('⚠️  src/ directory not found');
      return;
    }

    const files = this.getAllFiles(srcDir, /\.(js|ts)$/);

    for (const file of files) {
      const content = fs.readFileSync(file, 'utf-8');

      // Find all status assignments: "status: 'pending_payment'" or status = 'pending'
      const statusMatches = content.matchAll(
        /(?:status|state)\s*(?::|=)\s*['"]([\w_]+)['"]/g
      );

      for (const match of statusMatches) {
        const status = match[1];
        this.analysis.statusValues.add(status);
      }

      // Find status transitions: "status: 'pending' ... status: 'confirmed'"
      const transitionMatches = content.matchAll(
        /\.status\s*=\s*['"]([\w_]+)['"]/g
      );
      for (const match of transitionMatches) {
        this.analysis.statusTransitions.push({
          status: match[1],
          file: path.relative(this.projectRoot, file)
        });
      }
    }

    console.log(`   Found ${this.analysis.statusValues.size} unique status values`);
    console.log(`   Found ${this.analysis.statusTransitions.length} status transitions`);
  }

  /**
   * ANALYZE: Cross-module API calls
   */
  analyzeModuleCalls() {
    const srcDir = path.join(this.projectRoot, 'src');

    if (!fs.existsSync(srcDir)) {
      return;
    }

    const files = this.getAllFiles(srcDir, /\.(js|ts)$/);

    for (const file of files) {
      const content = fs.readFileSync(file, 'utf-8');

      // Extract fetch/axios calls to other modules
      // Example: axios.post('/api/orders/...')
      const callMatches = content.matchAll(
        /(?:fetch|axios|http\.\w+)\s*\(\s*['"](\/api\/[\w\/-]+)['"]/g
      );

      for (const match of callMatches) {
        const apiPath = match[1];
        const callerModule = this.extractModuleFromFile(file);

        this.analysis.moduleCalls.push({
          caller: callerModule,
          target: apiPath,
          file: path.relative(this.projectRoot, file)
        });
      }
    }

    console.log(`   Found ${this.analysis.moduleCalls.length} cross-module API calls`);
  }

  /**
   * ANALYZE: Hardcoded credentials (for pre-commit validation)
   */
  analyzeCredentials() {
    const srcDir = path.join(this.projectRoot, 'src');

    if (!fs.existsSync(srcDir)) {
      return;
    }

    const credentialPatterns = [
      /api[_-]?key\s*[:=]\s*['"][^'"]+['"]/gi,
      /secret[_-]?key\s*[:=]\s*['"][^'"]+['"]/gi,
      /password\s*[:=]\s*['"][^'"]+['"]/gi,
      /token\s*[:=]\s*['"][^'"]+['"]/gi
    ];

    const files = this.getAllFiles(srcDir, /\.(js|ts)$/);

    for (const file of files) {
      const content = fs.readFileSync(file, 'utf-8');

      for (const pattern of credentialPatterns) {
        if (pattern.test(content)) {
          this.analysis.hardcodedCredentials.push({
            file: path.relative(this.projectRoot, file),
            pattern: pattern.toString()
          });
        }
      }
    }

    if (this.analysis.hardcodedCredentials.length > 0) {
      console.log(`   ⚠️  Found ${this.analysis.hardcodedCredentials.length} potential hardcoded credentials`);
    }
  }

  /**
   * UTILITY: Get all files matching pattern recursively
   */
  getAllFiles(dir, pattern) {
    const files = [];
    const items = fs.readdirSync(dir);

    for (const item of items) {
      const itemPath = path.join(dir, item);
      const stat = fs.statSync(itemPath);

      if (stat.isDirectory() && !item.startsWith('.')) {
        files.push(...this.getAllFiles(itemPath, pattern));
      } else if (stat.isFile() && pattern.test(item)) {
        files.push(itemPath);
      }
    }

    return files;
  }

  /**
   * UTILITY: Extract module number from file path
   */
  extractModuleFromFile(filePath) {
    const match = filePath.match(/(\d{2})_\w+/);
    return match ? match[1] : 'unknown';
  }

  /**
   * MAIN: Run all analyzers and save to JSON
   */
  analyzeAll() {
    console.log('🔎 Analyzing codebase implementation...\n');

    try {
      // Create analysis output directory
      const analysisDir = path.join(this.projectRoot, '.claude', 'analysis');
      if (!fs.existsSync(analysisDir)) {
        fs.mkdirSync(analysisDir, { recursive: true });
      }

      console.log('[1/5] Analyzing Prisma schema...');
      this.analyzePrismaSchema();

      console.log('[2/5] Analyzing API routes...');
      this.analyzeRoutes();

      console.log('[3/5] Analyzing status values...');
      this.analyzeStatusValues();

      console.log('[4/5] Analyzing module calls...');
      this.analyzeModuleCalls();

      console.log('[5/5] Analyzing credentials...');
      this.analyzeCredentials();

      // Save analysis results
      fs.writeFileSync(
        path.join(analysisDir, 'api_analysis.json'),
        JSON.stringify(this.analysis.apiEndpoints, null, 2)
      );

      fs.writeFileSync(
        path.join(analysisDir, 'database_analysis.json'),
        JSON.stringify(this.analysis.databaseTables, null, 2)
      );

      fs.writeFileSync(
        path.join(analysisDir, 'status_analysis.json'),
        JSON.stringify({
          statusValues: Array.from(this.analysis.statusValues),
          statusTransitions: this.analysis.statusTransitions
        }, null, 2)
      );

      fs.writeFileSync(
        path.join(analysisDir, 'module_calls_analysis.json'),
        JSON.stringify(this.analysis.moduleCalls, null, 2)
      );

      console.log('\n' + '='.repeat(60));
      console.log('✅ CODE ANALYSIS COMPLETE');
      console.log('='.repeat(60));
      console.log(`\nAnalysis output: ${analysisDir}/`);
      console.log('  • api_analysis.json');
      console.log('  • database_analysis.json');
      console.log('  • status_analysis.json');
      console.log('  • module_calls_analysis.json\n');

      return true;
    } catch (error) {
      console.error('\n❌ CODE ANALYSIS FAILED:');
      console.error(`   ${error.message}\n`);
      return false;
    }
  }
}

// Run analyzer
const analyzer = new CodeAnalyzer();
analyzer.analyzeAll();

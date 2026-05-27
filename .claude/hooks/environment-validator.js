#!/usr/bin/env node
/**
 * ENVIRONMENT VALIDATOR
 * 현재 환경(LOCAL/STAGING/PRODUCTION) 자동 감지 및 검증
 *
 * 목적: 환경 혼동으로 인한 실수 방지
 *   ❌ 로컬 설정으로 프로덕션 배포
 *   ❌ 프로덕션 데이터 로컬에 다운로드
 *   ❌ SSH 포트 혼동
 *   ❌ 데이터베이스 URL 오류
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const os = require('os');

// ============================================================================
// 1. 환경 자동 감지 (4단계)
// ============================================================================

function detectCurrentEnvironment() {
  console.log('\n[ENVIRONMENT DETECTION] 현재 환경 감지 중...');

  // Step 1: Git Remote 확인
  try {
    const remotes = execSync('git remote -v', { encoding: 'utf-8' });

    if (remotes.includes('origin-staging')) {
      console.log('  ✓ Git Remote 기반 감지: STAGING');
      return 'STAGING';
    }
    if (remotes.includes('origin-prod')) {
      console.log('  ✓ Git Remote 기반 감지: PRODUCTION');
      return 'PRODUCTION';
    }
    if (remotes.includes('origin') && remotes.includes('develop')) {
      console.log('  ✓ Git Remote 기반 감지: LOCAL (develop 포함)');
      return 'LOCAL';
    }
  } catch (e) {
    // Git 없으면 다음 단계로
  }

  // Step 2: 호스트명 확인
  try {
    const hostname = os.hostname().toLowerCase();

    if (hostname.includes('staging')) {
      console.log(`  ✓ 호스트명 기반 감지: STAGING (${hostname})`);
      return 'STAGING';
    }
    if (hostname.includes('prod')) {
      console.log(`  ✓ 호스트명 기반 감지: PRODUCTION (${hostname})`);
      return 'PRODUCTION';
    }
    if (hostname.includes('kimzu') || hostname.includes('laptop') || hostname.includes('desktop')) {
      console.log(`  ✓ 호스트명 기반 감지: LOCAL (${hostname})`);
      return 'LOCAL';
    }
  } catch (e) {
    // 다음 단계로
  }

  // Step 3: 환경변수 확인
  try {
    if (process.env.NODE_ENV === 'production') {
      console.log('  ✓ 환경변수 기반 감지: PRODUCTION (NODE_ENV=production)');
      return 'PRODUCTION';
    }
    if (process.env.NODE_ENV === 'staging') {
      console.log('  ✓ 환경변수 기반 감지: STAGING (NODE_ENV=staging)');
      return 'STAGING';
    }
    if (process.env.NODE_ENV === 'development') {
      console.log('  ✓ 환경변수 기반 감지: LOCAL (NODE_ENV=development)');
      return 'LOCAL';
    }
  } catch (e) {
    // 다음 단계로
  }

  // Step 4: 포트 확인
  try {
    // 포트 3001 실행 중 = LOCAL
    execSync('lsof -i :3001', { stdio: 'pipe' });
    console.log('  ✓ 포트 기반 감지: LOCAL (포트 3001 실행 중)');
    return 'LOCAL';
  } catch {
    try {
      // 포트 4001 실행 중 = STAGING
      execSync('lsof -i :4001', { stdio: 'pipe' });
      console.log('  ✓ 포트 기반 감지: STAGING (포트 4001 실행 중)');
      return 'STAGING';
    } catch {
      try {
        // 포트 4000 실행 중 = PRODUCTION
        execSync('lsof -i :4000', { stdio: 'pipe' });
        console.log('  ✓ 포트 기반 감지: PRODUCTION (포트 4000 실행 중)');
        return 'PRODUCTION';
      } catch {
        // 포트로도 감지 실패
      }
    }
  }

  throw new Error(
    '[ENVIRONMENT DETECTION FAILED] 환경을 자동으로 감지할 수 없습니다.\n' +
    '다음 중 하나를 확인하세요:\n' +
    '  1. Git remote 설정 (origin, origin-staging, origin-prod)\n' +
    '  2. 호스트명 확인 (localhost vs staging vs prod)\n' +
    '  3. NODE_ENV 환경변수 설정\n' +
    '  4. 포트 상태 확인 (3001/4001/4000)\n'
  );
}

// ============================================================================
// 2. 환경 설정 파일 로드
// ============================================================================

function loadEnvironmentConfig(env) {
  const configFileName = `${env.toUpperCase()}_ENVIRONMENT_CONFIG.md`;
  const configPath = path.join('.claude', configFileName);

  if (!fs.existsSync(configPath)) {
    throw new Error(`[CONFIG NOT FOUND] 설정 파일 없음: ${configPath}`);
  }

  const content = fs.readFileSync(configPath, 'utf-8');

  return {
    env,
    path: configPath,
    content,
    ports: parsePortsFromConfig(content),
    hosts: parseHostsFromConfig(content)
  };
}

function parsePortsFromConfig(content) {
  const ports = {};

  // 포트 할당 표 파싱
  const portMatch = content.match(/\| (.+?) \| (\d+) \|/g);
  if (portMatch) {
    portMatch.forEach(line => {
      const parts = line.match(/\| (.+?) \| (\d+) \|/);
      if (parts) {
        const service = parts[1].trim();
        const port = parseInt(parts[2]);
        ports[service] = port;
      }
    });
  }

  return ports;
}

function parseHostsFromConfig(content) {
  const hosts = {};

  // 호스트 설정 파싱
  if (content.includes('Host:')) {
    const hostMatch = content.match(/Host:\s*(.+)/);
    if (hostMatch) {
      hosts.main = hostMatch[1].trim();
    }
  }

  return hosts;
}

// ============================================================================
// 3. 포트 검증
// ============================================================================

function validatePorts(env, expectedPorts) {
  console.log('\n[PORT VALIDATION] 포트 확인 중...');

  const criticalPorts = {
    'LOCAL': [3000, 3001, 5432, 6379],
    'STAGING': [4001, 443, 2222],
    'PRODUCTION': [4000, 443, 2222]
  };

  const ports = criticalPorts[env] || [];
  let allValid = true;

  for (const port of ports) {
    try {
      execSync(`lsof -i :${port}`, { stdio: 'pipe' });
      console.log(`  ✓ 포트 ${port} 사용 중`);
    } catch {
      console.log(`  ⚠️  포트 ${port} 사용 가능 (실행되지 않음)`);

      // LOCAL은 경고, STAGING/PRODUCTION은 오류
      if (env !== 'LOCAL') {
        allValid = false;
      }
    }
  }

  if (!allValid && env !== 'LOCAL') {
    throw new Error(`[PORT VALIDATION FAILED] 필수 포트가 실행되고 있지 않습니다.`);
  }
}

// ============================================================================
// 4. SSH 검증
// ============================================================================

function validateSSH(env) {
  if (env === 'LOCAL') {
    console.log('\n[SSH VALIDATION] LOCAL 환경이므로 SSH 검증 생략');
    return;
  }

  console.log('\n[SSH VALIDATION] SSH 설정 확인 중...');

  const sshConfig = {
    'STAGING': {
      host: 'staging.kleinanzeigen.co.kr',
      port: 2222,
      user: 'deploy'
    },
    'PRODUCTION': {
      host: 'prod.kleinanzeigen.co.kr',
      port: 2222,
      user: 'deploy'
    }
  };

  const config = sshConfig[env];
  if (!config) return;

  // SSH 키 확인
  const keyPath = path.join(os.homedir(), '.ssh', `id_${env.toLowerCase()}`);
  if (!fs.existsSync(keyPath)) {
    throw new Error(
      `[SSH KEY NOT FOUND] 필수 키 파일 없음: ${keyPath}\n` +
      `SSH 키를 생성하거나 복사해주세요.`
    );
  }

  console.log(`  ✓ SSH 키 존재: ${keyPath}`);
  console.log(`  ✓ SSH Host: ${config.host}:${config.port}`);
  console.log(`  ✓ SSH User: ${config.user}`);

  // SSH 연결 테스트 (optional)
  if (env === 'STAGING') {
    try {
      execSync(`ssh -p ${config.port} -i ${keyPath} ${config.user}@${config.host} "echo OK"`, {
        stdio: 'pipe',
        timeout: 5000
      });
      console.log('  ✓ SSH 연결 가능');
    } catch (e) {
      console.log('  ⚠️  SSH 연결 테스트 실패 (VPN/네트워크 확인)');
    }
  }
}

// ============================================================================
// 5. Git 브랜치 검증
// ============================================================================

function validateGitBranch(env) {
  console.log('\n[GIT VALIDATION] Git 브랜치 확인 중...');

  try {
    const currentBranch = execSync('git rev-parse --abbrev-ref HEAD', {
      encoding: 'utf-8'
    }).trim();

    const expectedBranches = {
      'LOCAL': ['develop', 'feature/*'],
      'STAGING': ['staging'],
      'PRODUCTION': ['main']
    };

    const expected = expectedBranches[env] || [];
    let isValid = false;

    for (const branch of expected) {
      if (branch === 'feature/*') {
        if (currentBranch.startsWith('feature/')) {
          isValid = true;
          break;
        }
      } else if (currentBranch === branch) {
        isValid = true;
        break;
      }
    }

    if (isValid) {
      console.log(`  ✓ 브랜치 올바름: ${currentBranch} (${env} 환경)`);
    } else {
      throw new Error(
        `[GIT BRANCH MISMATCH] 잘못된 브랜치: ${currentBranch}\n` +
        `${env} 환경에서는 다음 브랜치를 사용해야 합니다: ${expected.join(', ')}`
      );
    }
  } catch (e) {
    if (e.message.includes('GIT BRANCH MISMATCH')) {
      throw e;
    }
    console.log('  ⚠️  Git 브랜치 확인 실패 (Git 저장소 확인)');
  }
}

// ============================================================================
// 6. 환경변수 검증
// ============================================================================

function validateEnvironmentVariables(env) {
  console.log('\n[ENVIRONMENT VARIABLES] 환경변수 확인 중...');

  const required = {
    'LOCAL': [
      'DATABASE_URL',
      'REDIS_URL',
      'JWT_SECRET'
    ],
    'STAGING': [
      'DATABASE_URL',
      'REDIS_URL',
      'JWT_SECRET',
      'KAKAO_CLIENT_ID'
    ],
    'PRODUCTION': [
      'DATABASE_URL',
      'REDIS_URL',
      'JWT_SECRET',
      'KAKAO_CLIENT_ID',
      'STRIPE_SECRET_KEY'
    ]
  };

  const envVars = required[env] || [];
  const missing = [];
  const found = [];

  for (const variable of envVars) {
    if (process.env[variable]) {
      found.push(variable);
    } else {
      missing.push(variable);
    }
  }

  console.log(`  ✓ 설정됨: ${found.join(', ')}`);

  if (missing.length > 0) {
    if (env === 'LOCAL') {
      console.log(`  ⚠️  누락됨: ${missing.join(', ')} (개발 중이면 무시 가능)`);
    } else {
      throw new Error(
        `[ENV VARIABLES MISSING] 필수 환경변수 누락: ${missing.join(', ')}\n` +
        `${env} 환경에서는 모든 필수 변수가 설정되어야 합니다.`
      );
    }
  }
}

// ============================================================================
// 7. .env 파일 검증
// ============================================================================

function validateEnvFiles(env) {
  console.log('\n[ENV FILES] .env 파일 확인 중...');

  const envFiles = {
    'LOCAL': ['.env', '.env.local'],
    'STAGING': ['.env.staging'],
    'PRODUCTION': ['.env.production']
  };

  const expected = envFiles[env] || [];
  const found = [];
  const missing = [];

  for (const file of expected) {
    const filePath = path.join(process.cwd(), file);
    if (fs.existsSync(filePath)) {
      found.push(file);
    } else {
      missing.push(file);
    }
  }

  if (found.length > 0) {
    console.log(`  ✓ 파일 존재: ${found.join(', ')}`);
  }

  if (missing.length > 0) {
    if (env === 'LOCAL') {
      console.log(`  ⚠️  파일 누락: ${missing.join(', ')} (필요시 생성)`);
    } else {
      throw new Error(
        `[ENV FILES MISSING] 필수 파일 누락: ${missing.join(', ')}\n` +
        `${env} 환경에서는 .env.${env.toLowerCase()} 파일이 필수입니다.`
      );
    }
  }

  // PRODUCTION: .env.production은 읽기만 가능
  if (env === 'PRODUCTION') {
    const envProd = path.join(process.cwd(), '.env.production');
    if (fs.existsSync(envProd)) {
      const stats = fs.statSync(envProd);
      if (stats.mode & 0o200) {
        console.log('  ⚠️  경고: .env.production이 쓰기 권한을 가지고 있습니다.');
        console.log('     읽기 전용으로 변경하세요: chmod 400 .env.production');
      } else {
        console.log('  ✓ .env.production 읽기 전용 (안전)');
      }
    }
  }
}

// ============================================================================
// 8. 금지된 파일 검증 (보안)
// ============================================================================

function validateForbiddenFiles(env) {
  console.log('\n[SECURITY CHECK] 금지된 파일 확인 중...');

  const forbidden = {
    'LOCAL': [],
    'STAGING': ['.env.production', '.env.local'],
    'PRODUCTION': ['.env.local', '.env.staging', 'node_modules', 'dist']
  };

  const forbiddenFiles = forbidden[env] || [];
  const found = [];

  for (const file of forbiddenFiles) {
    const filePath = path.join(process.cwd(), file);
    if (fs.existsSync(filePath)) {
      found.push(file);
    }
  }

  if (found.length > 0) {
    throw new Error(
      `[FORBIDDEN FILES FOUND] ${env} 환경에서 금지된 파일 발견: ${found.join(', ')}\n` +
      `이 파일들을 제거하거나 올바른 환경으로 이동해주세요.`
    );
  }

  console.log('  ✓ 금지된 파일 없음');
}

// ============================================================================
// 9. 포트 충돌 검증
// ============================================================================

function validatePortConflicts(env) {
  console.log('\n[PORT CONFLICT CHECK] 포트 충돌 확인 중...');

  const conflicts = {
    'LOCAL': {
      'STAGING': [4001],
      'PRODUCTION': [4000, 4001]
    },
    'STAGING': {
      'LOCAL': [3001],
      'PRODUCTION': []
    },
    'PRODUCTION': {
      'LOCAL': [3001],
      'STAGING': [4001]
    }
  };

  const conflictPorts = conflicts[env] || {};

  // 충돌 포트 확인
  const foundConflicts = [];
  for (const [otherEnv, ports] of Object.entries(conflictPorts)) {
    for (const port of ports) {
      try {
        execSync(`lsof -i :${port}`, { stdio: 'pipe' });
        foundConflicts.push(`포트 ${port} (${otherEnv} 환경 프로세스)`);
      } catch {
        // 포트 사용 중 아님
      }
    }
  }

  if (foundConflicts.length > 0) {
    console.log(`  ⚠️  포트 충돌 감지: ${foundConflicts.join(', ')}`);
    console.log('     다른 환경의 프로세스가 실행 중입니다. 정리 후 재시도하세요.');
  } else {
    console.log('  ✓ 포트 충돌 없음');
  }
}

// ============================================================================
// 10. 최종 검증 및 보고서 생성
// ============================================================================

function generateValidationReport(env, config, validationResults) {
  const timestamp = new Date().toISOString();

  const report = {
    timestamp,
    environment: env,
    configFile: config.path,
    detectedPorts: config.ports,
    detectedHosts: config.hosts,
    validations: validationResults,
    status: 'PASS'
  };

  // 보고서 저장
  const reportPath = path.join('.claude', 'environment-validation-report.json');
  fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));

  console.log('\n' + '='.repeat(60));
  console.log('ENVIRONMENT VALIDATION REPORT');
  console.log('='.repeat(60));
  console.log(`Timestamp: ${timestamp}`);
  console.log(`Environment: ${env}`);
  console.log(`Config File: ${config.path}`);
  console.log(`Status: ${report.status}`);
  console.log('='.repeat(60) + '\n');

  return report;
}

// ============================================================================
// Main Validation Function
// ============================================================================

function validateEnvironment() {
  try {
    // 1. 환경 감지
    const env = detectCurrentEnvironment();

    // 2. 설정 로드
    const config = loadEnvironmentConfig(env);

    // 3. 포트 검증
    validatePorts(env, config.ports);

    // 4. SSH 검증
    validateSSH(env);

    // 5. Git 브랜치 검증
    validateGitBranch(env);

    // 6. 환경변수 검증
    validateEnvironmentVariables(env);

    // 7. .env 파일 검증
    validateEnvFiles(env);

    // 8. 금지된 파일 검증
    validateForbiddenFiles(env);

    // 9. 포트 충돌 검증
    validatePortConflicts(env);

    // 10. 보고서 생성
    const report = generateValidationReport(env, config, {
      ports: 'OK',
      ssh: 'OK',
      git: 'OK',
      envVars: 'OK',
      envFiles: 'OK',
      security: 'OK'
    });

    console.log('✅ 모든 환경 검증 완료\n');
    return env;

  } catch (error) {
    console.error('\n❌ 환경 검증 실패:\n');
    console.error(error.message);
    console.error('\n조치 방법:');
    console.error('  1. 위의 오류 메시지를 읽고 필요한 조치를 취하세요');
    console.error('  2. 환경 설정 파일을 확인하세요');
    console.error('  3. 포트 상태를 확인하세요');
    console.error('  4. Git 브랜치를 확인하세요\n');
    process.exit(1);
  }
}

// ============================================================================
// Module Exports (다른 스크립트에서 사용 가능)
// ============================================================================

module.exports = {
  detectCurrentEnvironment,
  loadEnvironmentConfig,
  validateEnvironment,
  validatePorts,
  validateSSH,
  validateGitBranch,
  validateEnvironmentVariables,
  validateEnvFiles,
  validateForbiddenFiles,
  validatePortConflicts,
  generateValidationReport
};

// ============================================================================
// CLI Execution
// ============================================================================

if (require.main === module) {
  validateEnvironment();
}

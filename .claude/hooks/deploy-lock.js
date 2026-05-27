#!/usr/bin/env node
/**
 * DEPLOY LOCK SYSTEM
 * 중복 배포 및 동시 배포 방지
 *
 * 목적:
 *   ❌ SSH로 여러 번 푸시해서 서버 죽이기 방지
 *   ❌ 동시에 여러 명이 배포하기 방지
 *   ❌ 배포 중 수동 개입 방지
 *
 * 작동 원리:
 *   1. 배포 시작 시 lock 파일 생성
 *   2. 다른 배포 시도 시 락 파일 확인 후 대기/거부
 *   3. 배포 완료 시 락 파일 제거
 */

const fs = require('fs');
const path = require('path');
const os = require('os');

// ============================================================================
// 설정
// ============================================================================

const LOCK_DIR = path.join('.claude', 'locks');
const DEPLOY_LOCK_FILE = path.join(LOCK_DIR, 'deploy.lock');
const COMMIT_LOCK_FILE = path.join(LOCK_DIR, 'commit.lock');

// 락 파일 타임아웃 (밀리초)
const LOCK_TIMEOUT = {
  'LOCAL': 30 * 60 * 1000,          // 30분 (로컬 개발)
  'STAGING': 1 * 60 * 60 * 1000,    // 1시간 (스테이징)
  'PRODUCTION': 2 * 60 * 60 * 1000  // 2시간 (프로덕션)
};

const LOCK_TYPES = {
  DEPLOY: 'deploy',
  COMMIT: 'commit'
};

// ============================================================================
// 디렉토리 초기화
// ============================================================================

function initializeLockDir() {
  if (!fs.existsSync(LOCK_DIR)) {
    fs.mkdirSync(LOCK_DIR, { recursive: true });
  }
}

// ============================================================================
// 락 파일 생성
// ============================================================================

function createLock(lockType, environment = 'LOCAL') {
  initializeLockDir();

  const lockFile = lockType === LOCK_TYPES.DEPLOY ? DEPLOY_LOCK_FILE : COMMIT_LOCK_FILE;

  // 기존 락 파일 확인
  if (fs.existsSync(lockFile)) {
    const lockData = JSON.parse(fs.readFileSync(lockFile, 'utf-8'));
    const elapsed = Date.now() - lockData.createdAt;
    const timeout = LOCK_TIMEOUT[environment] || LOCK_TIMEOUT.LOCAL;

    // 타임아웃 안 됨 = 진행 중
    if (elapsed < timeout) {
      const elapsedSeconds = Math.floor(elapsed / 1000);
      const timeoutMinutes = Math.floor(timeout / 60000);

      return {
        success: false,
        error: `[LOCK ACQUIRED] ${lockType.toUpperCase()} 진행 중`,
        details: {
          startedAt: new Date(lockData.createdAt).toISOString(),
          elapsedSeconds,
          timeoutMinutes,
          user: lockData.user,
          environment: lockData.environment,
          message: `${timeoutMinutes}분 내에 완료될 때까지 대기하세요. (경과: ${elapsedSeconds}초)`
        }
      };
    }

    // 타임아웃됨 = 락 제거 후 재시도
    console.log(`[LOCK TIMEOUT] 이전 ${lockType} 락이 타임아웃되었습니다. 제거합니다.`);
    fs.unlinkSync(lockFile);
  }

  // 새로운 락 생성
  const lockData = {
    type: lockType,
    environment,
    user: process.env.USER || os.userInfo().username,
    createdAt: Date.now(),
    pid: process.pid,
    hostname: os.hostname(),
    timestamp: new Date().toISOString()
  };

  fs.writeFileSync(lockFile, JSON.stringify(lockData, null, 2));

  return {
    success: true,
    lockFile,
    lockData
  };
}

// ============================================================================
// 락 파일 해제
// ============================================================================

function releaseLock(lockType) {
  const lockFile = lockType === LOCK_TYPES.DEPLOY ? DEPLOY_LOCK_FILE : COMMIT_LOCK_FILE;

  if (fs.existsSync(lockFile)) {
    fs.unlinkSync(lockFile);
    return {
      success: true,
      message: `[LOCK RELEASED] ${lockType.toUpperCase()} 락이 해제되었습니다.`
    };
  }

  return {
    success: false,
    message: `[LOCK NOT FOUND] ${lockType.toUpperCase()} 락 파일이 없습니다.`
  };
}

// ============================================================================
// 락 상태 확인
// ============================================================================

function getLockStatus(lockType) {
  const lockFile = lockType === LOCK_TYPES.DEPLOY ? DEPLOY_LOCK_FILE : COMMIT_LOCK_FILE;

  if (!fs.existsSync(lockFile)) {
    return {
      exists: false,
      type: lockType,
      status: 'UNLOCKED'
    };
  }

  const lockData = JSON.parse(fs.readFileSync(lockFile, 'utf-8'));
  const elapsed = Date.now() - lockData.createdAt;

  return {
    exists: true,
    type: lockType,
    status: 'LOCKED',
    lockData,
    elapsedMs: elapsed,
    elapsedSeconds: Math.floor(elapsed / 1000),
    createdAt: new Date(lockData.createdAt).toISOString(),
    user: lockData.user,
    environment: lockData.environment
  };
}

// ============================================================================
// 모든 락 확인
// ============================================================================

function getAllLocks() {
  initializeLockDir();

  const locks = {
    deploy: getLockStatus(LOCK_TYPES.DEPLOY),
    commit: getLockStatus(LOCK_TYPES.COMMIT)
  };

  const activeLocks = [];
  if (locks.deploy.exists) activeLocks.push('DEPLOY');
  if (locks.commit.exists) activeLocks.push('COMMIT');

  return {
    timestamp: new Date().toISOString(),
    locks,
    activeLocks,
    summary: activeLocks.length > 0
      ? `${activeLocks.length}개의 활성 락: ${activeLocks.join(', ')}`
      : '활성 락 없음'
  };
}

// ============================================================================
// 강제 락 해제 (관리자용)
// ============================================================================

function forceUnlock(lockType, password = null) {
  // 간단한 비밀번호 확인 (실제로는 더 복잡해야 함)
  const FORCE_PASSWORD = process.env.LOCK_FORCE_PASSWORD || 'admin123';

  if (password !== FORCE_PASSWORD) {
    return {
      success: false,
      error: '[UNAUTHORIZED] 강제 해제 비밀번호 오류'
    };
  }

  const lockFile = lockType === LOCK_TYPES.DEPLOY ? DEPLOY_LOCK_FILE : COMMIT_LOCK_FILE;

  if (fs.existsSync(lockFile)) {
    const lockData = JSON.parse(fs.readFileSync(lockFile, 'utf-8'));
    fs.unlinkSync(lockFile);

    return {
      success: true,
      message: `[FORCE UNLOCKED] ${lockType.toUpperCase()} 락이 강제 해제되었습니다.`,
      releasedLock: lockData,
      warning: '⚠️  경고: 진행 중인 배포가 중단될 수 있습니다!'
    };
  }

  return {
    success: false,
    message: `[LOCK NOT FOUND] ${lockType.toUpperCase()} 락이 없습니다.`
  };
}

// ============================================================================
// 클린업 (과거 락 파일 정리)
// ============================================================================

function cleanupOldLocks() {
  if (!fs.existsSync(LOCK_DIR)) {
    return { cleaned: 0 };
  }

  const files = fs.readdirSync(LOCK_DIR);
  let cleaned = 0;

  for (const file of files) {
    const filePath = path.join(LOCK_DIR, file);
    const stats = fs.statSync(filePath);

    // 24시간 이상 된 파일 삭제
    if (Date.now() - stats.mtimeMs > 24 * 60 * 60 * 1000) {
      fs.unlinkSync(filePath);
      cleaned++;
    }
  }

  return { cleaned, oldFiles: files.length };
}

// ============================================================================
// 상세 보고서 생성
// ============================================================================

function generateLockReport() {
  const allLocks = getAllLocks();
  const report = {
    timestamp: new Date().toISOString(),
    locks: allLocks,
    recommendation: generateRecommendation(allLocks),
    actions: generateActions(allLocks)
  };

  // 보고서 저장
  const reportPath = path.join(LOCK_DIR, 'lock-status-report.json');
  fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));

  return report;
}

function generateRecommendation(allLocks) {
  if (allLocks.activeLocks.length === 0) {
    return '모든 작업 가능. 배포/커밋 진행하세요.';
  }

  const recommendations = [];

  if (allLocks.locks.deploy.exists) {
    recommendations.push(`배포 진행 중입니다. ${allLocks.locks.deploy.elapsedSeconds}초 경과했습니다.`);
  }

  if (allLocks.locks.commit.exists) {
    recommendations.push(`커밋 진행 중입니다. ${allLocks.locks.commit.elapsedSeconds}초 경과했습니다.`);
  }

  return recommendations.join('\n');
}

function generateActions(allLocks) {
  const actions = [];

  if (allLocks.locks.deploy.exists) {
    actions.push({
      type: 'DEPLOY',
      action: '대기 또는 강제 해제',
      command: 'node .claude/hooks/deploy-lock.js force-unlock deploy [PASSWORD]'
    });
  }

  if (allLocks.locks.commit.exists) {
    actions.push({
      type: 'COMMIT',
      action: '대기 또는 강제 해제',
      command: 'node .claude/hooks/deploy-lock.js force-unlock commit [PASSWORD]'
    });
  }

  return actions;
}

// ============================================================================
// CLI 인터페이스
// ============================================================================

function showHelp() {
  console.log(`
DEPLOY LOCK SYSTEM - Lock Manager

사용법:
  node .claude/hooks/deploy-lock.js <command> [args]

명령어:
  create <type> [env]          락 파일 생성 (type: deploy|commit, env: LOCAL|STAGING|PRODUCTION)
  release <type>               락 파일 해제
  status [type]                락 상태 확인
  list                          모든 락 확인
  cleanup                        과거 락 파일 정리
  report                         상세 보고서 생성
  force-unlock <type> <pwd>     강제 해제 (관리자용)

예시:
  node .claude/hooks/deploy-lock.js create deploy LOCAL
  node .claude/hooks/deploy-lock.js status deploy
  node .claude/hooks/deploy-lock.js list
  node .claude/hooks/deploy-lock.js release deploy
  node .claude/hooks/deploy-lock.js cleanup
  node .claude/hooks/deploy-lock.js report
  node .claude/hooks/deploy-lock.js force-unlock deploy admin123
  `);
}

function main() {
  const args = process.argv.slice(2);
  const command = args[0];

  if (!command || command === '--help' || command === '-h') {
    showHelp();
    return;
  }

  try {
    switch (command) {
      case 'create': {
        const lockType = args[1] || LOCK_TYPES.DEPLOY;
        const env = args[2] || 'LOCAL';
        const result = createLock(lockType, env);

        if (result.success) {
          console.log(`✅ [LOCK CREATED] ${lockType.toUpperCase()} 락이 생성되었습니다.`);
          console.log(`   환경: ${env}`);
          console.log(`   사용자: ${result.lockData.user}`);
          console.log(`   시간: ${result.lockData.timestamp}`);
        } else {
          console.error(`❌ ${result.error}`);
          console.error(`   시작: ${result.details.startedAt}`);
          console.error(`   경과: ${result.details.elapsedSeconds}초`);
          console.error(`   메시지: ${result.details.message}`);
          process.exit(1);
        }
        break;
      }

      case 'release': {
        const lockType = args[1] || LOCK_TYPES.DEPLOY;
        const result = releaseLock(lockType);
        console.log(`${result.success ? '✅' : '⚠️'} ${result.message}`);
        break;
      }

      case 'status': {
        const lockType = args[1];
        if (lockType) {
          const status = getLockStatus(lockType);
          console.log(`\n${lockType.toUpperCase()} Lock Status:`);
          console.log(JSON.stringify(status, null, 2));
        } else {
          showHelp();
        }
        break;
      }

      case 'list': {
        const locks = getAllLocks();
        console.log('\nAll Lock Status:');
        console.log(JSON.stringify(locks, null, 2));
        break;
      }

      case 'cleanup': {
        const result = cleanupOldLocks();
        console.log(`✅ 클린업 완료: ${result.cleaned}개 파일 삭제`);
        break;
      }

      case 'report': {
        const report = generateLockReport();
        console.log('\nLock Report:');
        console.log(JSON.stringify(report, null, 2));
        break;
      }

      case 'force-unlock': {
        const lockType = args[1];
        const password = args[2];

        if (!lockType) {
          console.error('❌ 타입을 지정하세요 (deploy|commit)');
          process.exit(1);
        }

        const result = forceUnlock(lockType, password);

        if (result.success) {
          console.log(`✅ ${result.message}`);
          console.log(`   ${result.warning}`);
        } else {
          console.error(`❌ ${result.error}`);
          process.exit(1);
        }
        break;
      }

      default:
        console.error(`❌ 알 수 없는 명령어: ${command}`);
        showHelp();
        process.exit(1);
    }
  } catch (error) {
    console.error(`❌ 오류: ${error.message}`);
    process.exit(1);
  }
}

// ============================================================================
// Module Exports
// ============================================================================

module.exports = {
  createLock,
  releaseLock,
  getLockStatus,
  getAllLocks,
  forceUnlock,
  cleanupOldLocks,
  generateLockReport,
  LOCK_TYPES,
  LOCK_TIMEOUT,
  DEPLOY_LOCK_FILE,
  COMMIT_LOCK_FILE,
  LOCK_DIR
};

// ============================================================================
// CLI Execution
// ============================================================================

if (require.main === module) {
  main();
}

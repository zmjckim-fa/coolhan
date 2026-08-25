const fs = require('fs');
const os = require('os');
const path = require('path');
const { spawnSync } = require('child_process');
const { shouldArm, arm } = require('../../.claude/hooks/run-armer');

const ASK_HOOK = path.join(__dirname, '../../.claude/hooks/ask-guard.js');
const ARMER_HOOK = path.join(__dirname, '../../.claude/hooks/run-armer.js');

function sandbox() {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'guards-'));
  fs.mkdirSync(path.join(dir, '_workspace'), { recursive: true });
  fs.mkdirSync(path.join(dir, 'scripts'), { recursive: true });
  fs.copyFileSync(path.join(__dirname, '../../scripts/completion-check.js'), path.join(dir, 'scripts', 'completion-check.js'));
  return dir;
}

const INCOMPLETE = '| # | Unit | Files | Verification | Status |\n|---|---|---|---|---|\n| U1 | a | f | jest | todo |\n';

describe('run-armer (G11c — mechanical arming from the user prompt)', () => {
  test('CoolHan continuous-dev commands arm', () => {
    expect(shouldArm('쿨한으로 개발 이어서 진행하라')).toBe(true);
    expect(shouldArm('CoolHan keep developing the backlog')).toBe(true);
    expect(shouldArm('쿨한으로 로그인 기능 연속개발해')).toBe(true);
  });

  test('inspection/ops prompts do NOT arm (their stops must stay legal)', () => {
    expect(shouldArm('쿨한 업데이트 확인해')).toBe(false);
    expect(shouldArm('CoolHan check for updates')).toBe(false);
    expect(shouldArm('쿨한을 자체적으로 점검해')).toBe(false);
    expect(shouldArm('그냥 일반 질문입니다')).toBe(false);
  });

  test('arming writes the marker and clears a stale stop-approval', () => {
    const dir = sandbox();
    fs.writeFileSync(path.join(dir, '_workspace', '_stop-approved.json'), '{"reason":"old run ESCALATE"}');
    arm(dir, '쿨한으로 개발 이어서');
    expect(fs.existsSync(path.join(dir, '_workspace', '_run-active.json'))).toBe(true);
    expect(fs.existsSync(path.join(dir, '_workspace', '_stop-approved.json'))).toBe(false);
    fs.rmSync(dir, { recursive: true, force: true });
  });

  test('process-level: matching prompt returns additionalContext, other prompts are silent', () => {
    const dir = sandbox();
    const run = prompt => JSON.parse(spawnSync(process.execPath, [ARMER_HOOK], {
      cwd: dir, input: JSON.stringify({ hook_event_name: 'UserPromptSubmit', prompt }), encoding: 'utf8'
    }).stdout);
    const armed = run('쿨한으로 개발 이어서 진행하라');
    expect(armed.hookSpecificOutput.additionalContext).toMatch(/ARMED/);
    const idle = run('안녕하세요');
    expect(idle.hookSpecificOutput).toBeUndefined();
    fs.rmSync(dir, { recursive: true, force: true });
  });
});

describe('ask-guard (G11b — AskUserQuestion denied mid-run)', () => {
  const invoke = dir => JSON.parse(spawnSync(process.execPath, [ASK_HOOK], {
    cwd: dir, input: JSON.stringify({ hook_event_name: 'PreToolUse', tool_name: 'AskUserQuestion' }), encoding: 'utf8'
  }).stdout);

  test('active run + incomplete backlog → deny with the standing instruction', () => {
    const dir = sandbox();
    fs.writeFileSync(path.join(dir, '_workspace', '_run-active.json'), '{"run_id":"g1"}');
    fs.writeFileSync(path.join(dir, '_workspace', '_backlog.md'), INCOMPLETE);
    const out = invoke(dir);
    expect(out.hookSpecificOutput.permissionDecision).toBe('deny');
    expect(out.hookSpecificOutput.permissionDecisionReason).toMatch(/_stop-approved\.json/);
    fs.rmSync(dir, { recursive: true, force: true });
  });

  test('recorded stop condition → question allowed', () => {
    const dir = sandbox();
    fs.writeFileSync(path.join(dir, '_workspace', '_run-active.json'), '{"run_id":"g1"}');
    fs.writeFileSync(path.join(dir, '_workspace', '_backlog.md'), INCOMPLETE);
    fs.writeFileSync(path.join(dir, '_workspace', '_stop-approved.json'), '{"reason":"credential required"}');
    expect(invoke(dir).hookSpecificOutput).toBeUndefined();
    fs.rmSync(dir, { recursive: true, force: true });
  });

  test('no active run → question allowed (ordinary sessions untouched)', () => {
    const dir = sandbox();
    expect(invoke(dir).hookSpecificOutput).toBeUndefined();
    fs.rmSync(dir, { recursive: true, force: true });
  });
});

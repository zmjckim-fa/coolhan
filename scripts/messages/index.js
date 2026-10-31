/**
 * CoolHan harness message dictionary (S2 문구 사전 — the one place for human-language text that the
 * harness's own CLI gates print). Code calls `t(key, vars)`; it never carries a sentence of its own.
 *
 * Scope today: the G20 scripts (progress-check · checks-run · single-source-check). Older scripts keep
 * their inline strings until touched (§4-d); the single-source ratchet keeps that count from growing.
 * Keys are stable identifiers; the text may be edited here without touching any script.
 */

const M = {
  // ── progress-check (G20-A) ───────────────────────────────────────────────────────────────
  'progress.noGoal': '목표 한 줄("목표: …")이 없다 (§9)',
  'progress.noTaskTable': '작업 목록 표(번호·이름·상태·완료 증거·남은 항목)가 없다 (§9)',
  'progress.invalidStatus': '상태 "{status}" — 허용값은 대기 / 진행 중 / 완료 뿐 (§10)',
  'progress.doneWithHedge': '완료에 "확인 안 됨/추가 작업 필요/대부분/사실상"을 붙일 수 없다 — 그것은 진행 중 (§10)',
  'progress.doneWithoutEvidence': '완료 증거가 없다(시험 수치 n/m·"n passed"·커밋 해시 중 하나 필요) — cell: "{evidence}"',
  'progress.doneWithRemaining': '완료인데 남은 항목이 적혀 있다: "{remaining}"',
  'progress.inProgressWithoutRemaining': '진행 중이면 남은 항목 이름을 적는다 (§10)',
  'progress.noPosition': '"현재 위치" 절이 없다 (§9)',
  'progress.positionNotInTable': '현재 위치가 작업 목록의 번호를 가리키지 않는다',
  'progress.noAssumptions': '"가정 목록" 절이 없다 (§9/§13 — 묻지 않고 고른 기본값은 여기에 번호·이유로)',
  'progress.noDefects': '"결함 목록" 절이 없다 (§9/§11 — D-번호·발견한 검사·파일:줄·상태)',
  'progress.defectIdFormat': '결함 번호는 D-번호 형식',
  'progress.defectInvalidStatus': '상태 "{status}" — 열림 / 닫힘 뿐',
  'progress.defectWithoutCheck': '열린 결함은 "발견한 검사"를 적는다 (§11: 같은 결함을 두 번 새로 발견하지 않도록)',
  'progress.cannotRead': 'progress-check: cannot read {file}: {error} — 원장이 없으면 §9 대로 먼저 만든다',
  'progress.summary': '{mark} progress-check: {status} — {file}: {done}/{total} 완료 · 진행 중 {inProgress} · 대기 {pending} · 열린 결함 {openDefects}',
  'progress.position': '  현재 위치: {position}',
  // ── checks-run (G20-B) ───────────────────────────────────────────────────────────────────
  'checks.cannotRead': 'checks-run: cannot read {file}: {error} — 고정 검증 목록이 없으면 §11 대로 먼저 만든다',
  'checks.noRows': 'checks-run: no runnable check rows (| ID | 검사 | 명령 | 비고 |)',
  'checks.reasonManual': 'manual',
  'checks.reasonTimeout': 'timeout {sec}s',
  'checks.reasonSpawn': 'spawn error: {error}',
  'checks.reasonToolMissing': 'tool missing (exit 127)',
  'checks.unregistered': '{id}:미등록→D-번호 등록 필요',
  'checks.line': '통과 {pass} · 실패 {fail}{failDetail} · 확인 안 함 {notRun}{notRunDetail}',
  'checks.notRunLabel': '확인 안 함({reason})',
  'checks.header': 'checks-run: {file}',
  // ── single-source-check (G20-C) ──────────────────────────────────────────────────────────
  'single.duplicateHelper': '같은 함수 "{name}" 본문이 {count}곳 — 한 곳(S8/모듈)에 두고 부른다 (§0 중복 0)',
  'single.inlineStyle': '화면은 클래스 이름만 쓴다 — 토큰·공통 스타일(S1)로 (§1)',
  'single.hardcodedSentence': '사람 언어 문장이 코드에 있다: "{text}" — 문구 사전(S2) 키로 (§2-④)',
  'single.targetLiteral': '외부 대상 "{target}"이 코드 리터럴로 — 레지스트리(S3)·파생 표(S4) 경유만 (§2-③)',
  'single.newDuplicate': '기준선에 없던 중복 "{name}" (§0)',
  'single.inlineGrew': 'inline style {before} → {after} (§1 S1)',
  'single.sentenceGrew': '하드코딩 문구 {before} → {after} (§2-④ S2)',
  'single.targetGrew': '외부 대상 리터럴 {before} → {after} (§2-③ S3)',
  'single.maxFileGrew': '최대 파일 {before} → {after}줄 (한도 {limit}) — 거대 파일 분리 (§4-e)',
  'single.noRoot': 'single-source-check: no such root {root}',
  'single.baselineWritten': 'single-source-check: baseline written → {file} {counts}',
  'single.cannotReadBaseline': 'single-source-check: cannot read baseline {file}: {error}',
  'single.drivingDoc': '  Driving doc: knowledge_base/00_MINIMAL_SOURCE_PRINCIPLES.md'
};

/** t('key', {var: value}) — substitutes {var}; unknown key returns the key itself (visible, never silent). */
function t(key, vars = {}) {
  const s = M[key];
  if (s === undefined) return key;
  return s.replace(/\{(\w+)\}/g, (_, k) => (vars[k] === undefined || vars[k] === null ? '' : String(vars[k])));
}

/** One gate finding — {rule, where, detail} with the detail rendered from the dictionary. */
function finding(rule, where, key, vars) { return { rule, where, detail: t(key, vars) }; }

module.exports = { t, finding, MESSAGES: M };

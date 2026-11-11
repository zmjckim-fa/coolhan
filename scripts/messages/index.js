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
  'progress.duplicateId': '번호 {id}: 두 번 나온다. 번호는 유일해야 한다 (교훈 F-22)',
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
  'checks.reasonChildNotRun': 'child reported NOT_RUN (exit 4)',
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
  'single.scopeShrunk': '훑은 파일 수가 기준선보다 줄었다 ({before} → {after}). 수치는 고쳐서 내려야 한다. 정말 지웠으면 --allow-scope-shrink 후 기준선을 다시 쓴다 (교훈 F-23)',
  'single.notRun': '○ single-source-check: NOT_RUN: 훑은 파일이 0이다 ({root}). 통과가 아니다 (교훈 F-10)',
  'placeholder.notRun': '○ no-placeholder-check: NOT_RUN: 훑은 파일이 0이다 ({targets}). 통과가 아니다 (교훈 F-10)',
  'single.noRoot': 'single-source-check: no such root {root}',
  'single.baselineWritten': 'single-source-check: baseline written → {file} {counts}',
  'single.cannotReadBaseline': 'single-source-check: cannot read baseline {file}: {error}',
  'single.drivingDoc': '  Driving doc: knowledge_base/00_MINIMAL_SOURCE_PRINCIPLES.md',
  // ── plan-doc-check (G21) ────────────────────────────────────────────────────────────────
  'plan.section.scope': '범위 밖(하지 않는 것)',
  'plan.section.success': '성공 기준',
  'plan.section.business': '비즈니스(가격·결제·정산)',
  'plan.section.legal': '법무와 약관',
  'plan.section.ops': '운영',
  'plan.section.quality': '품질 목표',
  'plan.section.domain': '도메인 품질 관리',
  'plan.section.data': '데이터와 분석',
  'plan.section.notify': '알림',
  'plan.section.test': '테스트와 배포',
  'plan.section.risk': '위험 관리',
  'plan.section.decision': '결정 로그와 오픈 이슈',
  'plan.section.glossary': '용어집',
  'plan.section.phase': '단계 계획',
  'plan.usage': 'usage: plan-doc-check.js <file.md|dir> [--required "a,b"] [--lessons <registry.json>] [--tags a,b] [--json]',
  'plan.noDocs': 'plan-doc-check: no .md planning document under {target}',
  'plan.noTraceTable': '요구 항목 추적표가 없다 (열: 요구 항목 · 위치) (§6-5, §7)',
  'plan.traceUnlocated': '요구 항목 "{item}"의 위치가 비어 있다 (§7 추적표에 빈 항목 없음)',
  'plan.traceMissingItem': '요구 항목 "{item}"이 추적표에 없다 (--required)',
  'plan.tableBlankCell': '표의 빈칸 (열 "{column}"): 해당 없음은 "해당 없음"으로 쓴다 (§5)',
  'plan.deferredMarker': '표에 "{marker}" 표기: 미정은 [결정필요]로 이유와 함께 쓴다 (§7)',
  'plan.unverifiedWithoutMethod': '[미검증]에 확인 방법이 없다 (같은 줄에 "확인 방법: …") (§2-9, §7)',
  'plan.decisionWithoutReason': '[결정필요]에 이유가 없다 (같은 줄에 "이유: …") (§7)',
  'plan.tooltipTooLong': '풍선말 {count}어절: 10어절 이내 (§2-2, §7): "{text}"',
  'plan.emDash': '줄표 문자가 있다. 문장은 직접적으로 쓴다 (§2-10)',
  'plan.hypeWord': '과장어 "{word}": 구체적 사실로 바꾼다 (§2-10)',
  'plan.diagramMissing': '도식 파일이 없다: {path} (§5 도식은 그림 파일로)',
  'plan.idConflict': '식별자 {id}에 이름이 둘 이상: {names} (§6-4, §7 충돌 0건)',
  'plan.missingSection': '필수 항목 "{section}"이 문서에 없다 (§4.2 / §1): 해당 없으면 제목에 "해당 없음: 이유"',
  'plan.successCriteriaCount': '성공 기준 {count}개: 측정 가능한 문장 3개 이상 (§1)',
  'plan.summary': '{mark} plan-doc-check: {status}: 문서 {docs} · 표 {tables} · 풍선말 {tooltips} · [미검증] {unverified} · [결정필요] {decisions}',
  'plan.drivingDoc': '  Driving doc: knowledge_base/00_PLANNING_DOC_STANDARD.md',
  'plan.decisionWithoutDefault': '[결정필요]에 기본값이 없다. 같은 줄에 "기본값: …"을 적고 그 값으로 진행한다 (교훈 W-11)',
  'plan.noLessonTable': '실패 방지 대응표가 없다 (열: 교훈 ID · 방지책 · 검증 방법). 해당 교훈 {count}건: {ids}',
  'plan.lessonUnanswered': '교훈 {id} "{title}"에 대한 방지책이 기획서에 없다 (실패 방지 대응표에 행 추가)',
  'plan.lessonAnswerBlank': '교훈 {id}의 {column} 칸이 비어 있다',
  // ── field-lessons (G22) ─────────────────────────────────────────────────────────────────
  'lessons.usage': 'usage: field-lessons.js validate|render|list|check … (see the header of scripts/field-lessons.js)',
  'lessons.cannotRead': 'field-lessons: cannot read {file}: {error}',
  'lessons.noRoot': 'field-lessons: no such root {root}',
  'lessons.registryEmpty': '교훈이 한 건도 없다',
  'lessons.idFormat': 'ID는 F-nn(실패) 또는 W-nn(성공) 형식',
  'lessons.idDuplicate': '같은 ID가 두 번 나온다',
  'lessons.kind': 'kind는 fail 또는 win',
  'lessons.kindPrefix': 'ID 접두사(F/W)와 kind가 맞지 않는다',
  'lessons.fieldMissing': '필수 칸 "{field}"가 비어 있다',
  'lessons.unenforced': '기획서 의무(plan)도 게이트(gate)도 기계 검사(detect)도 없는 실패 교훈: 하나는 있어야 한다',
  'lessons.detectExt': 'detect.ext "{ext}"는 code/markup/style/docs/any 중 하나',
  'lessons.detectRegex': 'detect.{field} 정규식 오류: {error}',
  'lessons.privateData': '레지스트리에 메일 주소나 URL이 있다. 교훈은 일반화해서 적는다(공개 저장소)',
  'lessons.validateSummary': '{mark} field-lessons validate: {status}: 교훈 {count}건 ({file})',
  'lessons.renderFresh': '✔ field-lessons render --check: {file} 는 레지스트리에서 파생한 그대로다',
  'lessons.renderStale': '✗ field-lessons render --check: {file} 가 레지스트리와 다르다. 손으로 고치지 말고 render 로 다시 만든다',
  'lessons.renderWritten': 'field-lessons render: {file} ← 교훈 {count}건',
  'lessons.baselineWritten': 'field-lessons check: baseline written → {file} {counts}',
  'lessons.checkSummary': '{mark} field-lessons check: {status} ({mode}): 훑음 {files}회(파일×규칙) · 검사 규칙 {detectors} · {counts}',
  'lessons.notRun': '  확인 안 함: 훑은 파일이나 검사 규칙이 0이다. 통과가 아니다 (교훈 F-10)',
  'lessons.drivingDoc': '  Driving doc: knowledge_base/00_FIELD_LESSONS.md (레지스트리: knowledge_base/field-lessons.json)'
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

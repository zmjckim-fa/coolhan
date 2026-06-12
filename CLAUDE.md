# CoolHan Builder — 개발 운영 가이드

## ⛔ 전역 출력 규칙 (모든 명령·모든 하네스에 강제, 2026-06-09)

> **목적: 독백·과정설명으로 인한 토큰 낭비·개발 지연 차단. "글쓰다 끝나지 않는다."**

1. **독백 금지** — 생각·계획·판단 과정을 글로 쓰지 않는다. 도구를 바로 실행한다.
2. **도구 호출 전 설명 금지** — "이제 ~하겠습니다" 류 서두 금지. 필요하면 한 줄 이내.
3. **하드 길이 제한** — 채팅 응답은 **최대 6줄**. 초과 내용은 파일에 기록하고 경로만 남긴다.
4. **결과만 보고** — 성공/실패 · 판정 · 다음 작업. 이 3가지 외 서술 금지.
5. **코드·파일 내용 미표시** — 채팅에 소스/파일 전문 붙여넣기 금지. 경로로 가리킨다.
6. **요약 반복 금지** — 이미 한 말, 파일에 쓴 내용을 채팅에 다시 풀어쓰지 않는다.
7. **아첨·맞장구 금지** — "정확한 지적입니다/좋은 질문/맞습니다" 류 평가·동의 표현 금지. 사실/결과로 바로 시작한다.

> 예외: 사용자가 "자세히/설명해/왜"를 명시할 때만 길게. 그 외엔 항상 위 규칙.

---

## 하네스: CoolHan Research & Verification

**목표:** 연구작업의 논리검증, 가설의 검증연구, 암호 분석/해독을 자동화하는 전문가 팀 시스템.

**트리거:** 가설 검증, 논리·증명 검증, 논리 오류 탐지, 암호 해독/디코드 관련 요청 시 `coolhan-research-orchestrator` 스킬을 사용합니다.

**예시 트리거:**
- "쿨한으로 이 가설 검증연구해" / "CoolHan validate hypothesis"
- "이 논증/증명 타당성 검토해" / "논리 오류 찾아줘"
- "이 암호문 풀어줘" / "이거 무슨 인코딩이야 디코드해" / "빈도분석 해줘"

> 전문가 3명: 가설 검증자 / 논리·증명 검증자 / 암호 분석자. 증거 필수·추론금지(개발 하네스 P0 계승), 암호는 합법·윤리 경계 준수.

---

## 하네스: CoolHan Release Engineering

**목표:** CoolHan Specification-Driven Framework를 GitHub에서 npm까지, 완전하고 안정적으로 배포하고 관리하는 AI 에이전트 팀 시스템.

**트리거:** CoolHan 배포, 릴리스, 사용자 문서, 품질 관리 관련 요청 시 `coolhan-release-orchestrator` 스킬을 자동으로 사용합니다.

**예시 트리거:**
- "CoolHan GitHub에 배포해줘"
- "npm 패키지 준비해줘"
- "사용자 문서 작성해줘"
- "품질 테스트해줘"
- "배포 후 모니터링"
- "v1.0.1 배포해줘"
- "쿨한 업데이트 확인해"
- "쿨한 최신 버전 확인"
- "CoolHan check for updates"
- "CoolHan update"

---

## 팀 구성 (Release Engineering)

| 역할 | 에이전트 | 책임 |
|------|---------|------|
| 기획 리드 | `agents/planning-lead.md` | GitHub/npm 전략, 로드맵 |
| 개발 리드 | `agents/development-lead.md` | 패키지 준비, 빌드 스크립트 |
| DevOps 리드 | `agents/devops-lead.md` | GitHub 인프라, CI/CD |
| 마케팅 리드 | `agents/marketing-lead.md` | README, 문서, 예제 |
| QA 리드 | `agents/qa-lead.md` | 테스트, 품질 검증 |

---

## 하네스: CoolHan Development

**목표:** 🌍 50+ 언어의 자연스러운 명령어로 규격 기반 개발의 전체 프로세스를 자동화하는 다국어 AI 에이전트 팀 시스템.

**트리거:** "쿨한으로 {action}해" (한국어) 또는 "CoolHan {action}" (English) 등 **모국어 명령어** 사용 시 `coolhan-development-orchestrator` 스킬을 자동으로 사용합니다.

**예시 트리거 (다국어):**

| 언어 | 예시 |
|------|------|
| 🇰🇷 한국어 | "쿨한으로 사용자 로그인 기능 추가해" |
| 🇺🇸 English | "CoolHan add user login feature" |
| 🇯🇵 日本語 | "CoolHanでユーザーログイン機能を追加して" |
| 🇨🇳 中文 | "用CoolHan添加用户登录功能" |
| 🇪🇸 Español | "CoolHan agregar función de login de usuario" |
| 🇫🇷 Français | "CoolHan ajouter la fonction de connexion utilisateur" |
| 🇩🇪 Deutsch | "CoolHan Benutzer-Login-Funktion hinzufügen" |
| 🇮🇹 Italiano | "CoolHan aggiungere funzione di accesso utente" |
| 🇵🇹 Português | "CoolHan adicionar recurso de login de usuário" |
| 🇷🇺 Русский | "CoolHan добавить функцию входа пользователя" |
| 🇮🇳 हिन्दी | "CoolHan यूजर लॉगिन फीचर जोड़ें" |
| 🇹🇭 ไทย | "CoolHan เพิ่มฟีเจอร์ login ผู้ใช้" |
| ... | 50+ 언어 더 지원 |

**자동 언어 감지** - 어떤 언어로든 입력하면 자동으로 감지되고 처리됩니다!

### 팀 구성 (Development)

#### 메인 워크플로우 (필수, 6명)

| 역할 | 에이전트 | 책임 |
|------|---------|------|
| 의도 분석자 | `agents/intent-analyzer.md` | 명령어 → 요구사항 (+사람중심 정보) |
| UX/디자인 리드 | `agents/ux-design-lead.md` | Task 1.5: 사용자여정·화면·폼·상태·디자인토큰 (사람 중심 주입) |
| 스펙 작가 | `agents/spec-writer.md` | 요구사항+UX → 규격 문서 |
| 개발자 | `agents/developer.md` | 규격 → 코드 구현 |
| 검증자 | `agents/validator.md` | 9단계 자동 검증 (진입 게이트, 증거 필수) |
| QA 테스터 | `agents/qa-tester.md` | 통합 테스트, 승인 기준 |
| DevOps/배포자 | `agents/devops-deployer.md` | 배포 락, 안전한 배포 |

#### 추가 검증 (선택, 배포 후)

| 역할 | 에이전트 | 책임 |
|------|---------|------|
| 통합 검증자 | `agents/integration-validator.md` | 포트/API/DB 실제 검증 (증거 필수) |
| E2E 테스터 | `agents/e2e-tester.md` | UI/UX/반응형/브라우저 검증 (증거 필수) |
| HX 비전 크리틱 | `agents/hx-vision-critic.md` | 렌더 스크린샷을 비전으로 평가(사람 판정 대리), 무인 자동 루프 |

#### 역방향 + 재사용 확장 (NEW, 3명)

기존 사이트를 분석 → 모듈화 → 타 사이트 응용 적용 또는 개발 지속. 정방향이 "의도→스펙→코드"라면 역방향은 "코드→스펙→모듈→재적용".

| 역할 | 에이전트 | 책임 |
|------|---------|------|
| 사이트 분석자 | `agents/site-analyzer.md` | 코드 역공학 → Site Analysis Map (stack-agnostic, 증거 필수) |
| 모듈 추출자 | `agents/module-extractor.md` | 기능·메뉴 → Module Manifest (12섹션 도메인-모듈 포맷, KB 환류) |
| 교차 사이트 적용자 | `agents/cross-site-adapter.md` | A→B Application Plan (파라미터화 변환, 충돌 감지, P0 승인 게이트) |

> 이식/개발 실행은 정방향 에이전트(Spec Writer→Developer→Validator→QA→DevOps) 재사용. 트리거: "쿨한으로 분석해 / 모듈화해 / A를 B에 적용해 / 개발 이어서".

---

## 디렉토리 구조

```
.claude/
├── agents/
│   ├── [Release Engineering]
│   │   ├── planning-lead.md
│   │   ├── development-lead.md
│   │   ├── devops-lead.md
│   │   ├── marketing-lead.md
│   │   └── qa-lead.md
│   └── [Development Harness]
│       ├── intent-analyzer.md
│       ├── spec-writer.md
│       ├── developer.md
│       ├── validator.md
│       ├── qa-tester.md
│       ├── devops-deployer.md
│       ├── [Reverse + Reuse Extension]  (NEW)
│       ├── site-analyzer.md
│       ├── module-extractor.md
│       └── cross-site-adapter.md
└── skills/
    ├── coolhan-spec-driven-framework/
    │   └── SKILL.md
    ├── coolhan-release-orchestrator/
    │   └── SKILL.md
    ├── coolhan-installer/
    │   └── SKILL.md
    └── coolhan-development-orchestrator/  (NEW)
        └── SKILL.md
```

---

## 변경 이력

| 날짜 | 변경 내용 | 대상 | 사유 |
|------|----------|------|------|
| 2026-05-27 | **Release Engineering 하네스 초기 구성** | agents/, skills/, CLAUDE.md | CoolHan 배포 자동화를 위한 완전한 에이전트 팀 시스템 구축 |
| 2026-05-27 | **Phase 2 완료: 11개 아키텍처 충돌 해결** | knowledge_base/ | 도메인 모듈 동기화 및 아키텍처 일관성 확보 |
| **2026-05-28** | **Development Harness 구축 (Phases 0-4)** | agents/ (6개) + skills/coolhan-development-orchestrator + CLAUDE.md | 사용자의 자연스러운 한국어 명령어로 규격 기반 개발을 자동화하는 완전한 에이전트 팀 시스템 |
| **2026-05-28** | **Token Efficiency Mode 적용** | agents/ (6개) + skills/ (4개) | 토큰 절약 모드: 결과만 보고, 과정 설명 제외, 소스 화면 미표시 |
| **2026-05-30** | **Phase D 트랙 1: Harness 고도화 (P0/P1 규칙 반영)** | agents/ (3개: validator, integration-validator, e2e-tester) + skills/coolhan-development-orchestrator + CLAUDE.md | P0 구조 결함 해결: 진입 게이트 추가, evidence field 필수화, Token Efficiency Mode 완화 |
| **2026-06-06** | **컨텍스트 기반 작업 분할 원칙 추가** | skills/coolhan-development-orchestrator/SKILL.md + agents/developer.md | "결과가 나올 수 있는 명령만 내린다" — 1단위=파일 7개+검증 1개, 검증 없이 완료 선언 금지, 컨텍스트 한계 시 중단점 명시 |
| **2026-05-30** | **Phase D 트랙 3: 기획자 의도 강제 메커니즘 (P0 구조 결함 해결)** | agents/ (intent-analyzer.md, validator.md, integration-validator.md) + skills/coolhan-development-orchestrator | **핵심: AI의 자의적 기능 추가 원천 차단** — Task 1에 기획자 명확화 + 승인 게이트 추가 / requirements-{id}.md에 기획자 의도 명시 필수 / Task 4에 기획 의도 검증 0단계 추가 (무단 기능 추가 감지) / Task 7에 기획서 체크리스트 강화 |
| **2026-06-08** | **Phase D 트랙 4: 실제 테스트 앱 기반 재검증 완료** | _harness_test/track4/ (FastAPI 샘플 앱 + Task 1-6 산출물 + 리포트) + CLAUDE.md | **P0 메커니즘 실작동 입증** — 적대적 테스트(클린 vs 위반)로 Validator 0단계가 무단 기능 추가를 정확 감지함 확인 (클린→PASS, 위반→FAIL). 6명 팀 워크플로우 완주. **GAP-1 식별:** validator/qa-tester/devops-deployer가 Node/npm 전용 → Python 비호환 (스택 감지 + 명령 매핑 필요) |
| **2026-06-09** | **하네스 공통 능력 4대 탑재 (Cross-Cutting Capabilities)** | references/harness-capabilities.md(신규) + agents/(intent-analyzer, site-analyzer, validator, developer, spec-writer 주입) + skills/coolhan-development-orchestrator(SKILL.md 능력 섹션) + CLAUDE.md | 소비자 챗 시스템 프롬프트에서 **개발 하네스에 실제 매핑되는 능력만 선별 탑재**(카고컬트 차단). C1 인터랙티브 elicitation(선택형 질의) / C2 MCP 커넥터 라이브 증거 / C3 웹 리서치 공식문서 / C4 구조화 출력 스키마 강제. 각 능력에 정직성 가드레일 내장(연결된 척·날조·웹지시 실행 금지, 미지정→P0 보류, 필수누락→NOT_RUN). 호스팅 위젯·챗 포맷·저작권 정책 등 비매핑 기능은 의도적으로 미탑재 |
| **2026-06-09** | **공통 능력 적대적 검증(트랙8) + 2차 5종 추가 탑재(C5~C9) + C3 보강** | _harness_test/track8-capabilities/(신규) + references/harness-capabilities.md(C5~C9 추가, C3 미인지엔티티 규칙) + skills/coolhan-development-orchestrator(SKILL.md 능력표 9종 + 릴레이 C6 재주입) + agents/developer.md(C5·C8·C9) + CLAUDE.md | **트랙8 적대적 검증으로 C1~C4 가드레일 4/4 압력 통과 입증**(창작·날조·웹지시주입·증거없는PASS를 전부 거부). 2차 재스캔으로 5종 추가: C5 Reference-First 무조건 선독(drift 차단) / C6 장기세션 규칙 재주입(범위이탈 방지) / C7 작업공간 위생(읽기전용·_workspace·납품 분리) / C8 장문 반복구축 / C9 오류 대응 규범(인정·수정·기록). C3에 "부분인식≠최신지식, 미인지 엔티티 조회 강제" 보강 |
| **2026-06-09** | **4차: 원천 전환 — Claude Code 하네스 독트린에서 6종 추가(C14~C19) + C12·C13 보강** | references/harness-capabilities.md(C14~C19) + skills/coolhan-development-orchestrator(SKILL.md 능력표 19종+출처 명시) + agents/(validator C15·C16·C17, devops-deployer C10·C18·C19) + CLAUDE.md | 소비자 챗 프롬프트 소진 판정 후 **원천을 Claude Code 에이전트 하네스 독트린으로 정직 전환**(개발 하네스에 더 적합). C14 자기완결 위임(콜드스타트 가정) / C15 침묵 절단 금지(coverage+excluded) / C16 관점 다양화 검증(렌즈 분산+seen dedup) / C17 발견 소진 루프(2라운드 무발견 종료) / C18 행동 위험 분류(금지/승인필수/자동 3단, 승인 일반화 금지) / C19 증거-행동 일치(패턴매칭 반사 금지). 보강: C12 신선도(기록≠현재), C13 완성도 비평 패스. **트랙8 3차 적대적 검증 C14~C19 6/6 PASS(누적 14/14)** — 한줄 위임 거부+완전 프롬프트 산출 / coverage 은폐 거부 / 렌즈분산+seen dedup 수렴 논리 / 고정카운트 종료 거부+저위험 미적용 / 승인 일반화·무단기능·자동진행 3단 정확 분류 / 파괴적 reset 진단 선행 |
| **2026-06-09** | **3차 발굴 4종 추가 탑재(C10~C13) + C5 보강 + 적대적 검증 완료(8/8)** | references/harness-capabilities.md(C10~C13 + C5 보강) + skills/coolhan-development-orchestrator(SKILL.md 능력표 13종) + agents/developer.md(C10·C12·C13) + _harness_test/track8-capabilities/(2차 검증) + CLAUDE.md | 3차 재스캔으로 매핑 우물 소진: **C10 시뮬레이션 금지(★, 테스트·빌드·배포·툴결과 모의/날조 금지 — "증거없으면 NOT_RUN"의 적극형)** / C11 노력·깊이 보정(위험×복잡도에 검증깊이 비례) / C12 존재 선확인(참조입력 가정 말고 확인) / C13 완료 자가체크(완료 선언 전 명시적 체크리스트). C5에 "여러 reference 전부 선독" 보강. **트랙8 2차 적대적 검증 C10~C13 4/4 PASS(누적 8/8)** — pytest 날조 거부·검증생략/과잉 양방향 보정·부재 스펙 실제 디스크 확인·9/10 완료선언 차단. 잔여 미추출은 전부 소비자 챗 런타임 전용으로 비매핑 확인(수렴) |
| **2026-06-08** | **GAP-3 수정: QA 음성 테스트 필수화** | agents/qa-tester.md | 트랙4 GAP-3 해결 — 양성만으론 PASS 불가, 음성(입력거부/인가거부/상태전이거부/중복멱등/경계/보안) 케이스 필수. 음성 0개 시 NOT_RUN. 스펙 섹션10 오류 시나리오 전수 커버 |
| **2026-06-08** | **GAP-2 수정: 산출물 파일명 표준 통일** | skills/coolhan-development-orchestrator (파일명 표준 섹션) + agents/ (validator, qa-tester) | 트랙4 GAP-2 해결 — `{timestamp}`→`{id}` 통일, `_workspace/{NN}_{artifact}-{id}.{ext}` 단일 규칙 확정 (NN 접두 유무·id/timestamp 혼용 제거) |
| **2026-06-12** | **공학적 통과 ≠ 과학적 참 분리 (감사 결함 해결)** | knowledge_base/00_SCIENTIFIC_VERIFICATION_STANDARDS.md(신규) + agents/(hypothesis-validator, validator) + skills/coolhan-research-orchestrator + CLAUDE.md | 감사 지적: CoolHan 녹색불을 과학적 확증으로 오독(과거 "10/10 STRONG+", formal_match 0.95 동어반복 함정). 해결 — 검증 도메인 KB 신설(공학 vs 과학 타당성 구분 + 과학적 합격조건: 경쟁가설 동시채점·사전등록 반례조건·셔플/held-out·다중비교보정·data→code→output 추적·동어반복 금지 + 검증명세서 템플릿). hypothesis-validator/validator/research-orch에 2층 판정(engineering_status/scientific_interpretation) 강제, "입증됨" 표기 금지. CoolHan=배관, 타당성은 연구자+감사자 책임 명시 |
| **2026-06-09** | **HX 무인 자동 루프(Auto-Critic) + 무정지 실행** | agents/hx-vision-critic.md + skills/coolhan-development-orchestrator(scripts/hx_render.py, HX 자동루프 섹션, Non-Stop Execution) + CLAUDE.md | "사람 승인=자동화 깨짐" 해결 — 사람 판정을 비전 크리틱이 대리. 렌더(playwright 스크린샷)→비전 평가→Developer 자동수정→재렌더 무인 반복(PASS/ITERATE/5회 미수렴시만 ESCALATE). 사람은 종료 1회 또는 auto-approve. 무정지 실행 규칙(한 턴 다단위 연속, 1분 후 대기 금지)으로 잦은 중단 차단 |
| **2026-06-09** | **사람 중심(Human-Experience) 기준 코드 첫 줄부터 강제** | references/human-experience-standard.md + agents/(ux-design-lead 신규, intent-analyzer/spec-writer/developer/validator/e2e-tester 주입) + skills/coolhan-development-orchestrator(Task 1.5 삽입+10단계 HX 게이트) + CLAUDE.md | "로직만 되면 완료" 차단 — 사후검증이 아닌 초기설계·구현부터 HX(폼/접근성/반응형/가독성/버튼/상태/플로우/보안UX/모듈화/무결성) 1급 요구사항화. Task 1.5 UX 설계 주입, Validator 10단계+e2e가 P0 미달 시 동작해도 FAIL. 디자인 파라미터화 연계. 적대적 검증(충족 vs 미달) |
| **2026-06-09** | **전역 출력 규칙(독백 금지·6줄 하드캡) 추가** | CLAUDE.md(전역) + skills/(development·research orchestrator working-mode) | 독백·과정설명 토큰 낭비/개발 지연 차단. 모든 명령·하네스에 강제: 도구 즉시 실행, 채팅 최대 6줄, 결과만, 코드/재서술 미표시. 예외: "자세히/왜" 명시 시 |
| **2026-06-09** | **연구·검증(Research & Verification) 하네스 신규 구축** | agents/(hypothesis-validator, logic-proof-verifier, cryptanalyst) + skills/coolhan-research-orchestrator + CLAUDE.md + _harness_test/track6-research/ | 연구작업 논리검증·가설 검증연구·암호 분석을 자동화하는 전문가 풀(3명). KB 구동(HYPOTHESIS_VALIDATION/PROOF_GOAL/ACADEMIC·JOURNAL STANDARDS). 증거 필수·추론금지(개발 P0 계승) + 확증편향 차단 + 암호 합법·윤리 경계. 트랙6 적대적 검증(가설 지지/기각, 논리 타당/오류, 암호 복호) |
| **2026-06-09** | **연속개발 엔진 (Continuous Development Engine) 내장 — 하네스 자기 고도화** | skills/coolhan-development-orchestrator (🔄 엔진 섹션 + working-mode 기본 ON + 트리거) + _workspace/(_goal/_backlog/_checkpoint) + CLAUDE.md | 목표 1개 수신 시 _goal→_backlog 분해 후 백로그가 빌 때까지 단위별 실행·검증·재개를 사람 개입 없이 자가반복. 자기재개 3경로(세션내 연쇄/세션경계 baton/무인 /loop). 목표 범위 내 재질문 없음, 미지정 시에만 보류(P0). 본 엔진을 엔진 자신에게 적용(self-host)하여 백로그 U1~U6 소진으로 데모 |
| **2026-06-08** | **지속 개발 릴레이 (Continuous Relay Mode) 추가** | skills/coolhan-development-orchestrator (working-mode + ♾️ 릴레이 섹션 + Phase 0 재개 분기 + 중단점 바통화) + agents/developer.md | 컨텍스트 한계에서 멈추지 않고 _checkpoint.md 저장 + 마지막 줄에 재시작 명령(baton) 방출 → 새 세션이 체크포인트부터 자동 재개. 반복으로 멈추지 않는 개발. 모델별 컨텍스트 예산(대형 3단위/중형 2/소형 1)으로 임계 판단. 무인 반복은 /loop 안내 |
| **2026-06-08** | **Autonomous Mode 추가** | skills/coolhan-development-orchestrator (working-mode + 자율 진행 섹션) | 명령 1회로 파이프라인 끝까지 자동 연쇄, FAIL 시 자동 복구(1회 재시도→Developer 재실행, 2회 실패만 보고), 정지 조건(P0 게이트/복구불가/컨텍스트 한계/파괴작업)만 멈춤, 자동 결정 _autorun-log.md 기록 |
| **2026-06-08** | **GAP-1 수정: 정방향 에이전트 stack-agnostic화** | agents/ (validator, qa-tester, devops-deployer) + skills/coolhan-development-orchestrator/references/stack-command-map.md | 트랙4 GAP-1 해결 — 3개 에이전트가 작업 전 스택 감지 후 명령 치환(npm 전제 제거). Python/Django/PHP/Ruby/Go/Java 매핑표 추가. P0 0단계는 언어 무관 항상 실행. |
| **2026-06-08** | **Chat Brevity Mode 추가** | skills/coolhan-development-orchestrator (working-mode) | 답변 짧게, 채팅엔 성공/실패/판정/다음작업 10줄 이하, 상세는 파일 기록, 질문 없이 다음 작업 자동 진행 |
| **2026-06-08** | **역방향 + 재사용 하네스 확장 (Site Analyzer / Module Extractor / Cross-Site Adapter)** | agents/ (3개 신규) + skills/coolhan-development-orchestrator (SKILL.md + references 3개) + CLAUDE.md + _harness_test/track5-reverse/ | **기존 사이트 분석→모듈화→타 사이트 응용 적용 능력 추가.** 정방향 파이프라인에 역방향 서브-파이프라인(R1→R2→R3) 합류. 통합 원칙 4대: stack-agnostic 우선(GAP-1 교훈 반영), 파라미터화 재사용, **기획자 의도 강제(P0) 교차-사이트 확장**(승인 모듈만 이식 + Validator 0단계 교차검증), domain-module 환류. 트랙5 적대적 검증으로 무단 끌어오기 차단 입증. |

---

## 프레임워크 개발 진도

### Phase 진행 상황

| Phase | 상태 | 완료일 | 주요 산출물 |
|-------|------|--------|-----------|
| Phase 1 | ✅ 완료 | 2026-05-27 | 10개 도메인 모듈 (01-10, 각 12섹션) |
| **Phase 2** | **✅ 완료** | **2026-05-27** | **11개 아키텍처 충돌 해결, 인프라 문서 2개** |
| Phase 3 | 🔜 준비 | 2026-06-03 | 통합 테스트 플랜, 검증 보고서 |

### Phase 2 상세: 아키텍처 충돌 해결

**확인된 충돌 (11개) - 모두 해결됨:**

| # | 충돌 | 상태 | 해결 방식 |
|---|------|------|---------|
| 1 | product_reviews 테이블 중복 | ✅ 해결 | 07_review_rating_system 으로 통합 |
| 2 | inventory_transactions 테이블 중복 | ✅ 해결 | 08_inventory_management 으로 통합 |
| 3 | 상태값 불일치 | ✅ 해결 | 00_STATUS_VALUE_REGISTRY.md 생성 |
| 4 | /admin/audit-log 엔드포인트 중복 | ✅ 해결 | 01_member_system 에서 /admin/member/* 로 변경 |
| 5 | /admin/inventory 엔드포인트 중복 | ✅ 해결 | 08_inventory_management 소유권 명확화 |
| 6 | 주문 총액 계산 책임 | ✅ 해결 | 09_order_management 소유권 확정 |
| 7 | 재고 예약 타이밍 | ✅ 해결 | 비즈니스 모델별 규칙 정의 |
| 8 | 결제 멱등성 | ✅ 해결 | idempotency_key 필드 확인 |
| 9 | 모듈 책임 미정의 | ✅ 해결 | 00_MODULE_RESPONSIBILITY_MATRIX.md 생성 |
| 10 | 우선순위 불명확 | ✅ 해결 | 도메인 모듈 > 기본 코어 규칙 정의 |
| 11 | 크로스 모듈 호출 규칙 없음 | ✅ 해결 | 순환 참조 방지 규칙 정의 |

**수정된 도메인 모듈:**
- 01_member_system.md: Admin 엔드포인트 구조 변경
- 02_shopping_mall.md: 테이블/엔드포인트 제거, 의존성 재정의

**생성/업데이트된 문서:**
- ✅ 00_PHASE_2_COMPLETION_SUMMARY.md (신규)
- ✅ 00_STATUS_VALUE_REGISTRY.md (이미 존재)
- ✅ 00_MODULE_RESPONSIBILITY_MATRIX.md (이미 존재)
- ✅ 01_2ND_REVIEW_REPORT.md (업데이트: 충돌 상태 표시)

---

## 주의사항

- 모든 에이전트는 `.claude/agents/`에서 관리됩니다
- 모든 스킬은 `.claude/skills/`에서 관리됩니다
- 에이전트를 수정하면 변경 이력 테이블에 기록하세요
- **배포는 항상 `coolhan-release-orchestrator`를 통해 진행하세요**
- **개발은 모국어 자연 언어로 "쿨한으로 {action}해" (한국어) 또는 "CoolHan {action}" (English) 등의 명령어를 사용하세요**
- **다국어 지원:** 50+ 언어 자동 감지 및 처리 - [`MULTILINGUAL_SUPPORT.md`](MULTILINGUAL_SUPPORT.md) 참조

---

## 하네스 상태

| 하네스 | 상태 | 에이전트 | 스킬 | 마지막 업데이트 |
|--------|------|---------|------|--------------|
| Release Engineering | ✅ 구성 완료 | 5명 | 2개 | 2026-05-27 |
| Development | ✅ 고도화 중 (Phase D-1) | 12명 (7 메인+UX + 2 추가 + 3 역방향) | 1개 | 2026-06-09 |
| Research & Verification | ✅ 구성 완료 | 3명 (가설/논리/암호) | 1개 | 2026-06-09 |

---

**하네스 통합 상태:** ✅ 2개 하네스 운영 + Phase D-1 (Harness 고도화) 진행 중  
**마지막 업데이트:** 2026-05-30

---

## Phase D 현황 (Harness 고도화)

### 트랙 1: 문서 + 에이전트 정의 동기화 (진행 중)

| 항목 | 상태 | 내용 |
|------|------|------|
| CLAUDE.md | ✅ 완료 | 팀 구성 + 변경 이력 + Phase D-3 기록 |
| SKILL.md | ✅ 완료 | Task 1-2 게이트 + Task 4 기획 의도 검증 추가 |
| intent-analyzer.md | ✅ 완료 | 3단계 기존 기능 확인 + 4단계 기획자 승인 게이트 추가 |
| validator.md | ✅ 완료 | 0단계 기획 의도 검증 + 10단계 파이프라인으로 확장 |
| integration-validator.md | ✅ 완료 | 기획서 체크리스트 강화 (기획 의도 검증) |
| e2e-tester.md | ✅ 완료 | 기획 의도 검증 (UI/UX 요소 무단 추가 감지) |

### 트랙 3: 기획자 의도 강제 메커니즘 (NEW - P0 구조 결함 해결) ✅ 완료

| 항목 | 상태 | 내용 |
|------|------|------|
| Task 1 강화 | ✅ 완료 | 기존 기능 확인 + 기획자 명확화 + 기획자 의도 명시 |
| Task 1-2 게이트 | ✅ 완료 | 기획자 승인 YES 없이는 Task 2 진행 불가 (GATE LOCK) |
| Task 4 강화 | ✅ 완료 | 0단계 기획 의도 검증 추가 (무단 기능 추가 감지) |
| 검증 메커니즘 | ✅ 완료 | Task 4, 7, 8에서 기획서 외 기능 추가 자동 감지 |

### 트랙 4: 실제 테스트 앱 기반 재검증 ✅ 완료 (2026-06-08)

| 항목 | 상태 | 내용 |
|------|------|------|
| 실제 테스트 앱 | ✅ 완료 | FastAPI 샘플 앱 (`_harness_test/track4/sample-app/`) — Task 1-6 전체 실행 |
| Phase D-3 재검증 | ✅ 완료 | 적대적 테스트(클린 vs 위반)로 기획자 의도 강제 메커니즘 작동 입증 |

**재검증 결과 (`_harness_test/track4/track4-report.md`):**
- ✅ **P0 메커니즘 작동 확인** — Validator 0단계가 무단 기능 추가를 정확 감지.
  클린 코드 → PASS(무단추가 0), 위반 코드(`/health`+`health_status` 주입) → FAIL(항목·위치 명시). 오탐/누락 없음.
- ✅ Task 1-6 6명 팀 워크플로우 실작동 완주 (pytest 8 pass, 배포 스모크 통과).
- ⚠️ **GAP-1 (P0) 식별** — validator/qa-tester/devops-deployer.md가 Node/npm 전용.
  Python/FastAPI에서 8·9단계 NOT_RUN. 스택 감지 + 명령 매핑 필요. (단, P0 핵심은 언어 무관이라 영향 없음)
- ⚠️ GAP-2: 산출물 파일명 불일치 / GAP-3: QA 음성 테스트 부재.

**다음 액션 후보:** GAP-1 수정 (스택 감지 + Python 매핑을 3개 에이전트 정의에 추가).

# CoolHan AI Communication Patterns

CoolHan이 지원하는 AI-to-AI 통신 패턴 현황 및 구현 위치.
이미지 출처: "AI끼리 일을 주고받는 방법 총정리" (12 patterns, 2026-07-21 분석)

---

## 유형 1 · 직접 메시지 (Direct Messaging)

### ① Agent Teams
| 항목 | 내용 |
|------|------|
| **상태** | ✅ 구현됨 |
| **CoolHan 구현** | Agent tool (17 에이전트) — orchestrator가 에이전트를 소환, 작업 단위 위임 |
| **위치** | `skills/coolhan-development-orchestrator/SKILL.md` Phase 1-6 팀 구성 |
| **특이사항** | TeamCreate/SendMessage는 Claude Code 실험 기능 (deferred tools); 기본은 Agent tool 직접 호출 |

### ② A2A 프로토콜 (HTTP JSON-RPC)
| 항목 | 내용 |
|------|------|
| **상태** | ❌ 미구현 — 외부 인프라 필요 |
| **이유** | A2A는 네트워크에 서버로 떠 있는 에이전트끼리의 규격; CoolHan 에이전트는 단일 프로세스 내 실행 |
| **대안** | CoolHan 에이전트 간 통신은 ③ 공유 폴더(blackboard) 패턴으로 처리 |

---

## 유형 2 · 공유 매개체 (Shared Medium)

### ③ 공유 폴더 (Blackboard Pattern)
| 항목 | 내용 |
|------|------|
| **상태** | ✅ 구현됨 |
| **CoolHan 구현** | `_workspace/` 디렉토리가 블랙보드 — 에이전트들이 산출물 읽고 씀 |
| **위치** | SKILL.md 파일명 표준 섹션; 모든 에이전트의 Input/Output Protocol |
| **파일 컨벤션** | `_workspace/{NN}_{artifact}-{id}.{ext}` |

### ④ 메시지 큐 / 공유 DB
| 항목 | 내용 |
|------|------|
| **상태** | ❌ 미구현 — 외부 인프라 필요 |
| **이유** | Redis/Kafka/RabbitMQ 없음; 실시간 pub/sub이 필요한 워크로드 없음 |
| **대안** | _workspace/ 파일 기반 전달로 충분 (순서 보장은 에이전트 의존성 체인으로 처리) |

---

## 유형 3 · 왕복 호출 (Round-Trip Calls)

### ⑤ API 호출
| 항목 | 내용 |
|------|------|
| **상태** | ⚠️ 부분 구현 |
| **CoolHan 구현** | 외부 API만 (C2 MCP, C3 WebFetch) — 에이전트↔에이전트 HTTP 없음 |
| **위치** | `references/harness-capabilities.md` §C2·§C3 |

### ⑥ MCP 연결
| 항목 | 내용 |
|------|------|
| **상태** | ✅ 구현됨 |
| **CoolHan 구현** | C2 MCP — DB/GitHub 라이브 증거 (읽기 기본, 쓰기 P0 승인) |
| **위치** | `references/harness-capabilities.md` §C2; Validator/Site Analyzer |

### ⑦ CLI 호출
| 항목 | 내용 |
|------|------|
| **상태** | ✅ 구현됨 |
| **CoolHan 구현** | Bash tool — pytest/curl/node scripts/gates.js/exec-runner.js 등 |
| **위치** | `scripts/gates.js` (G1-G6 오케스트레이터), `scripts/exec-runner.js` (G1), Validator/QA/DevOps |

---

## 유형 4 · 협업 패턴 (Collaboration Patterns)

### ⑧ 작업자-감사관 (Worker-Supervisor)
| 항목 | 내용 |
|------|------|
| **상태** | ✅ 구현됨 |
| **CoolHan 구현** | Developer→Validator 핑퐁 루프; Self-Auditor (각 단위 후 drift 감지); HX Vision Critic (ITERATE 루프) |
| **위치** | `agents/validator.md`, `agents/self-auditor.md`, `agents/hx-vision-critic.md` |

### ⑨ 토론 (Debate)
| 항목 | 내용 |
|------|------|
| **상태** | ✅ 구현됨 (2026-07-21 추가, 2026-07-21 Security Reviewer로 확장) |
| **CoolHan 구현** | (A) Plan Reviewer Debate Gate — P1+ open risk 시 자동 트리거 / (B) Security Reviewer Debate Gate — P1 ≥2 residual risk OR 경계선 판정 시 자동 트리거 |
| **위치** | `agents/plan-reviewer.md` Step 6.5 · `agents/security-reviewer.md` Step 3.5 |
| **패턴** | Advocate(pro-PASS) vs Skeptic(pro-FAIL) → Synthesis, 각 포지션 file:line / spec/backlog 인용 필수. P0 hard-fail은 debate 대상 아님 |

### ⑩ 핸드오프 (Handoff)
| 항목 | 내용 |
|------|------|
| **상태** | ✅ 구현됨 |
| **CoolHan 구현** | 6단계 파이프라인 핸드오프 (Intent Analyzer→Spec Writer→Developer→Validator→QA→DevOps) + Baton 릴레이 + Auto-Handoff |
| **위치** | SKILL.md 메인 워크플로우; `♾️ 지속 개발 릴레이`; `🔖 Auto-Handoff` 섹션 |

### ⑪ 투표 (Vote)
| 항목 | 내용 |
|------|------|
| **상태** | ✅ 구현됨 (2026-07-21 추가) |
| **CoolHan 구현** | Validator의 Borderline Vote — 경계선 스테이지에 3-기준 독립 판정 (2/3 다수결) |
| **위치** | `agents/validator.md` Step 2.5 |
| **기준** | Criterion A (Spec Fidelity) + B (Risk Materiality) + C (Reproducibility) |

### ⑫ 그래프/순서도 흐름 제어 (Graph/DAG)
| 항목 | 내용 |
|------|------|
| **상태** | ✅ 구현됨 |
| **CoolHan 구현** | G1→G8 게이트 DAG (provision→exec→trace→regression, 단락 포함); gates.js 조건부 분기 |
| **위치** | `scripts/gates.js`; SKILL.md G1-G8 섹션; `agents/devops-deployer.md` |

---

## 요약표

| # | 패턴 | 상태 | 위치 |
|---|------|------|------|
| ① | Agent Teams | ✅ | SKILL.md / Agent tool |
| ② | A2A 프로토콜 | ❌ | (외부 인프라 필요) |
| ③ | 공유 폴더 (Blackboard) | ✅ | `_workspace/` |
| ④ | 메시지 큐 | ❌ | (외부 인프라 필요) |
| ⑤ | API 호출 | ⚠️ | C2/C3 (외부만) |
| ⑥ | MCP 연결 | ✅ | harness-capabilities §C2 |
| ⑦ | CLI 호출 | ✅ | scripts/gates.js 등 |
| ⑧ | 작업자-감사관 | ✅ | validator / self-auditor |
| ⑨ | 토론 | ✅ | plan-reviewer Step 6.5 · security-reviewer Step 3.5 |
| ⑩ | 핸드오프 | ✅ | SKILL.md 파이프라인 |
| ⑪ | 투표 | ✅ | validator Step 2.5 |
| ⑫ | 그래프 흐름 제어 | ✅ | scripts/gates.js |

**구현 완료 10개 / 부분 1개 / 미구현 2개 (②④ — 외부 서버 인프라 필요)**

---

## 미구현 패턴 (②④) 대안

| 패턴 | 이유 | CoolHan 대안 |
|------|------|------------|
| ② A2A | HTTP 서버 필요; CoolHan은 단일 프로세스 에이전트 | ① Agent Teams + ③ _workspace/ 조합으로 동일 효과 |
| ④ 메시지 큐 | Redis/Kafka 외부 인프라 필요 | ③ _workspace/ + 에이전트 의존성 체인 |

---

**최종 업데이트:** 2026-07-21  
**분석 기반:** "AI끼리 일을 주고받는 방법 총정리" 12-pattern 분류

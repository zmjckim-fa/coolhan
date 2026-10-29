# AI Agent 개발 아키텍처 및 개발 원칙 (00_AI_ARCHITECTURE_PRINCIPLES)

**Effective date:** 2026-10-29 · **Status:** MANDATORY — 쿨한으로 수행하는 모든 신규 개발, 기능 추가, 기존 기능 수정, 리팩토링, 자동화, AI Agent 개발에 기본 적용
**Mechanical gate:** `scripts/ai-arch-check.js` (G19) · **Judgment gate:** Plan Reviewer (§13 다섯 질문, §17 체크리스트) · **Decision record:** `docs/AI_DECISIONS.md` (§14 양식)

> 한 줄 요약 — **Do not use one large LLM for everything. Use the right brain for the right task.**
> LLM은 추론·생성, Decision Model은 빠르고 경계가 정해진 판단, Vision Decision Model은 시각 분류,
> Deterministic code는 결정적 규칙, 그리고 **최종 실행은 항상 Application Code가 소유한다.**

---

## 1. 핵심 원칙

하나의 LLM에게 모든 판단과 작업을 맡기는 방식으로 개발하지 않는다. 항상 작업의 성격을 먼저 판단하고 다음 세 계층으로 분리한다.

### A. LLM — Reasoning Brain
Open-ended reasoning · 복잡한 문제 분석 · 계획 수립 · 여러 단계의 추론 · 자연어 생성 · 이메일/메시지 작성 · 코드 생성 · 복잡한 의사결정 설명 · 예외 상황 분석 · 사용자 의도 해석.
→ **생각하고, 분석하고, 설명하고, 생성해야 하는 작업**은 LLM.

### B. Decision Model — Fast Decision Brain
선택지가 제한되어 있고 결과의 형태가 미리 정해진 판단에는 일반 LLM 대신 Decision Model을 우선 사용한다.
현재 후보: **Jev**(TypeSafe AI) · **Cloudflare Clef** · **Clef-flash** · 향후 동일 목적의 더 적합한 모델.
용도: Classification · Scoring · Routing · Risk assessment · Intent/Priority classification · Approval/rejection · Team routing · Status classification · Category selection · Fixed-option decision · Threshold-based decision · 이미지/멀티모달 분류(Clef 계열).

```
Which team should handle this?  Billing / Technical / Sales
→ 장문 자연어 답변 ✗      → { "billing": 0.08, "technical": 0.87, "sales": 0.05 } ✓
```

### C. Application Code — 최종 통제권 (§3)

---

## 2. Visual Input은 별도로 판단한다
이미지 판단이 필요하면 텍스트 LLM만 쓰지 않는다. `Image/Multimodal Input → Clef(또는 적절한 Vision Decision Model) → Structured Decision → Application Code`.
예: 상품 사진 상태 판정 · 파손 여부 · 문서 이미지 분류 · 이미지 안전성 · 제품 카테고리 · 이미지 risk scoring · OCR 결과 정형 분류.
단, 이미지에 대한 복잡한 설명/생성적 분석이 필요하면 Vision-capable LLM을 쓸 수 있다.

## 3. Application Code는 반드시 최종 통제권을 가진다
AI는 판단 결과를 제공하고, 실제 비즈니스 로직과 시스템 변경은 Application Code가 담당한다.

```
User/Event → Agent Context → Decision/Reasoning → AI Model → Structured Result
 → Application Code → Validation → Business Rules → Threshold → Action / Route / Escalate
```
Application Code 책임: AI 결과 검증 · Schema validation · Threshold 적용 · Business rule 적용 · Permission 확인 · 상태/DB 상태 확인 · API 호출 여부 결정 · 실제 시스템 변경 · 실패 처리 · Retry · Human escalation.
AI가 `BUY / APPROVE / REFUND / DELETE / SHIP` 을 반환했다고 무조건 실행하지 않는다. 항상 Application Code가 최종 검증한다.

## 4. AI 결과는 Structured Output으로
자연어 결과를 그대로 후속 로직에 넘기지 않는다. JSON/명확한 schema를 쓰고 Application Code에서 schema validation을 수행한다.
```
{ "decision": "technical", "confidence": 0.87, "reason_code": "DEPLOYMENT_RELATED" }
AI → JSON Schema validation → Business rule validation → Threshold validation → Action
```

## 5. Confidence / Probability를 적극 활용한다
```
confidence >= 0.90         → 자동 처리
0.70 <= confidence < 0.90  → 추가 검증
confidence <  0.70         → LLM 분석 또는 Human Review
```
**Threshold는 AI가 결정하지 않는다. Threshold는 Application Code의 비즈니스 규칙이다.**

## 6. 모든 작업에 무조건 Decision Model을 쓰는 것은 금지
"모든 작업에 Jev/Clef를 쓰라"는 뜻이 아니다. 반드시 작업 성격을 먼저 판단한다.
Open-ended/reasoning → LLM · Fixed choices/classification/scoring/routing → Decision Model · Image/visual decision → Clef 계열 · 실제 시스템 실행 → Application Code · 복잡한 판단 + 정해진 최종 선택 → LLM → Structured result → Decision Model 또는 Application Code → Final validation → Action.

## 7. Hybrid Architecture가 기본
```
                Agent Context
          ┌──────────┼──────────┐
          ▼          ▼          ▼
         LLM        Jev       Clef
          │       Decision    Vision
          └──────────┼──────────┘
                     ▼
             Structured Result → Application Code → Action / Route / Escalate
```

## 8. Agent Context를 명확하게 설계한다
User request · User state · Workflow state · DB state · Tool state · Previous actions · 관련 비즈니스 데이터(상품/주문/결제/배송/권한). 불필요한 데이터를 무조건 LLM에 넣지 않는다 — **각 모델에는 그 판단에 필요한 최소 context만.**

## 9. Routing을 적극 사용한다
```
Incoming Request → Task Router
   ├── Open-ended          → LLM
   ├── Classification      → Jev
   ├── Fast classification → Clef-flash
   ├── Image decision      → Clef
   └── Deterministic rule  → Application Code
```
`if payment_status === "paid"` 같은 문제를 AI에게 판단시키지 않는다. 코드로 확실히 결정할 수 있는 것은 코드로.

## 10. AI 사용 최소화, 필요한 곳엔 적극 사용 — 우선순위
```
1. Deterministic Code → 2. Decision Model → 3. LLM → 4. Human Review
```
AI를 쓰기 위한 AI를 만들지 않는다. AI가 확신하지 못하면 Human Review로 보낸다.

## 11. Human-in-the-loop를 기본으로 고려한다
불확실하거나 위험도가 높으면 자동 실행하지 않는다(§5 임계). 특히 **고액 결제 · 환불 · 계정 삭제 · 중요 데이터 변경 · 법률/세금 · 계약 · 고객 영향이 큰 결정 · 외부 시스템의 되돌릴 수 없는 작업**은 Human Review 또는 강력한 추가 검증.
(쿨한 Auto-Pilot 4조건 중 ②비용·③비가역 파괴와 정합 — 이 범주의 "실행"은 사람이 쥔다.)

## 12. Performance와 비용도 아키텍처의 일부
Latency · Cost · Accuracy · Reliability · Context size · Structured-output reliability · Vision capability · Scalability를 함께 본다. 단순 분류를 수천~수만 번 수행하는 작업에 무거운 LLM을 반복 사용하지 않는다 — 빠른 Decision Model을 우선 검토한다.

## 13. 개발 전 반드시 먼저 묻는 다섯 질문
| # | 질문 | 답이 "예"면 |
|---|---|---|
| Q1 | Deterministic code로 해결할 수 있는가? | AI를 쓰지 않는다 |
| Q2 | 선택지가 제한된 classification / scoring / routing 문제인가? | Decision Model 검토 |
| Q3 | 이미지/multimodal input이 필요한가? | Clef 또는 적절한 Vision Model 검토 |
| Q4 | 복잡한 reasoning / generation이 필요한가? | LLM |
| Q5 | AI 결과가 실제 시스템을 변경하는가? | 반드시 Application Code에서 validation + business rules |

## 14. Architecture Decision 기록 (코드 작성 전, `docs/AI_DECISIONS.md`)
AI를 쓰는 기능마다 아래 10필드를 **모두** 채운다. 대괄호 자리표시자(`[…]`)가 남아 있으면 G19가 `record-incomplete`로 FAIL한다.
```
Feature:          [기능 설명]
Input:            [입력]
Decision type:    [Deterministic / Classification / Reasoning / Vision]
Selected model:   [Code / Jev / Clef / Clef-flash / LLM]
Expected output:  [Structured output]
Confidence:       [필요 여부]
Threshold:        [기준]
Fallback:         [실패 시 처리]
Human escalation: [필요 여부]
Final action:     [Application Code가 수행할 작업]
Rationale:        (선택 — 단, Classification/Vision을 LLM으로 결정할 때는 필수, §18)
```

## 15. 모델 호출을 비즈니스 로직에 흩뿌리지 않는다
```
/services/ai   llm.service · decision.service · vision.service · router.service
/domain        business rules
/application   workflows · use-cases
/infrastructure database · external APIs
```
AI provider가 바뀌어도 business logic을 크게 고치지 않도록 한다. G19는 서비스 계층(`services/ai`, `src/services/ai`, `lib/ai`, `src/ai` … `--service-dirs`로 변경) 밖의 provider 호출을 FAIL로 잡는다.

## 16. Vendor Lock-in을 피한다
`DecisionService`(추상) ← `JevDecisionProvider` / `ClefDecisionProvider` / `OtherDecisionProvider`(구현). Jev·Clef를 쓰더라도 애플리케이션 전체가 특정 모델에 종속되지 않게 한다.

## 17. 모든 개발 결과물은 이 원칙을 검토한다 (Plan Reviewer / Validator 체크리스트)
```
[ ] 이 작업은 AI가 정말 필요한가?            [ ] Deterministic code로 해결할 수 있는가?
[ ] Decision Model이 더 적합한가?            [ ] LLM이 필요한가?
[ ] Vision Model이 필요한가?                 [ ] Structured output을 사용했는가?
[ ] AI 결과를 Application Code에서 검증하는가? [ ] Threshold가 코드에 명확히 정의되어 있는가?
[ ] 실패 시 fallback이 있는가?               [ ] Human escalation이 필요한가?
[ ] 모델 교체가 가능한 구조인가?             [ ] latency와 cost를 고려했는가?
[ ] AI가 직접 중요한 시스템 작업을 실행하지 않는가?
```

## 18. 가장 중요한 개발 원칙
```
Do not use one large LLM for everything.  Use the right brain for the right task.
LLM for reasoning and generation.  Decision Models for fast, bounded decisions.
Vision Decision Models for visual classification.  Deterministic code for deterministic rules.
Application Code always owns the final action.
```
이 구조를 일회성 기능이 아니라 프로젝트 전체의 기본 개발 원칙으로 적용한다. **이 원칙과 다른 방식이 더 적합하다고 판단되면 임의로 무시하지 말고, 왜 다른 접근이 더 적합한지 먼저 설명한 후 구현한다** — 쿨한에서는 그 설명을 §14 레코드의 `Rationale:` 줄 + `docs/DECISIONS.md`에 남기고, 더 나은 안은 Improvement-Proposal 채널(`_workspace/_proposals.md`)로 올린다(기획 의도 P0 게이트는 그대로).

---

## 부록 A. 쿨한 하네스에서의 집행 지점
| 원칙 | 집행 주체 | 방식 |
|---|---|---|
| §13 다섯 질문 · §14 레코드 | Spec Writer | AI를 쓰는 요구사항마다 스펙 §"AI Architecture Decision" + `docs/AI_DECISIONS.md` 레코드 |
| §13 · §17 판단 | Plan Reviewer (G3, Task 2.5) | 체크리스트 검토 + `node scripts/ai-arch-check.js` 실행; 근거 없는 "경계 판단을 LLM으로"는 P1 open risk |
| §3 · §4 · §5 · §15 · §16 구현 | Developer | `services/ai` 추상 계층, structured output + schema validation, threshold 상수는 application code, AI 서비스는 DB/결제 클라이언트를 import하지 않음 |
| §3 · §4 · §5 · §9 · §14 · §15 정적 검증 | Validator stage 7 (G19) | `node scripts/ai-arch-check.js <root>` FAIL → stage-7 FAIL |
| §3 · §11 보안면 | Security Reviewer step 3.7 | AI 결과가 검증 없이 비가역 행위(결제/환불/삭제/전송)를 트리거하면 A/B 범주 finding(해당 범주면 P0) |
| 모델 교체·신규 Decision Model | model-capability-map (C12) | 모델명은 게이트 로직에 하드코딩하지 않음 — "Decision Model"이 추상, Jev/Clef는 현재 provider |

**쿨한 자체의 적합성:** 하네스는 이미 이 원칙을 따른다 — 게이트(G1–G19)는 deterministic code, 에이전트는 LLM(추론·생성), 임계(테스트 exit code·완료 판정·confidence)는 스크립트가 소유하고 LLM은 결정하지 못한다. 아직 Decision Model을 쓰는 지점은 없다(후보: HX Vision Critic의 "통과/반복" 분류, Task Router의 의도 분류 — 측정 후 도입, G17 self-growth 백로그 항목).

## 부록 B. Decision Model 사실 확인 (C3 웹 확인 2026-10-29 · C12 recorded ≠ current)
- **Jev** — TypeSafe AI, 2026-09 공개. 텍스트를 생성하지 않고 선택지·점수·확률을 반환하는 분류/라우팅 모델. TypeSafe API, OpenRouter, Vercel AI Gateway, ZenMux 경유. 보고된 지연 70–500 ms(30-class 중앙값 154 ms, 제3자 측정). 출처: Towards Data Science, Braintrust, Maxim/Bifrost, ZenMux.
- **Cloudflare Clef / Clef-flash** — 2026-10-01 공개, open-weight(Apache 2.0, Hugging Face), Workers AI 모델 ID `@cf/cloudflare/clef`, `@cf/cloudflare/clef-flash`. Clef 27B(정밀) / Clef-flash 9B(hot path), Qwen 기반 vision encoder 유지 → 이미지 분류 가능. Cloudflare 자체 벤치마크 중앙값 지연 Clef 209 ms · Clef-flash 39 ms · Jev 524 ms; 10개 decision 벤치마크 중 7개 선두(자체 측정, ECE 미공개 → 보정 미검증). 가격은 기록하지 않는다(빠르게 변함). 출처: Cloudflare changelog 2026-10-01, The Register, flaviocopes.com, developersdigest.tech.
- 둘 다 **측정 전 채택 금지(C10)**: 프로젝트의 라벨 세트로 정확도·보정(ECE)·지연을 실측한 뒤 §12 기준으로 선택하고, 결과를 §14 레코드 `Rationale:`에 남긴다.

## 부록 C. 참조
- `scripts/ai-arch-check.js` (G19) · `src/__tests__/ai-arch-check.test.js` · `_harness_test/track35-ai-arch/`
- `knowledge_base/00_SECURITY_STANDARDS.md` (§3·§11의 보안면) · `references/prompt-injection-defense.md` (AI 입력은 데이터)
- `references/model-capability-map.md` (모델 세대·effort) · `references/harness-capabilities.md` C3·C4·C10·C12

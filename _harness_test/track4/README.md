# 트랙 4: 실제 테스트 앱 기반 재검증

**목적:** CoolHan Development Harness(Task 1-8)를 실제 FastAPI 샘플 앱에 실행하여,
**기획자 의도 강제 메커니즘(P0, 트랙 3 구축)**이 실제로 작동하는지 재검증한다.

## 검증 대상

1. **6명 팀 워크플로우 실작동** — Task 1(의도분석)→2(스펙)→3(코드)→4(검증)→5(테스트)→6(배포)
2. **기획자 의도 강제** — Task 4 Validator의 0단계가 기획서에 없는 무단 기능 추가를 잡아내는가
3. **하네스 갭 발견** — validator.md가 전제하는 npm 스크립트(`npm run list-endpoints` 등)가
   Python/FastAPI 프로젝트에서 어떻게 깨지는가 (이식성 결함 식별)

## 구조

```
_harness_test/track4/
├── README.md          ← (이 파일)
├── SCENARIO.md        ← 테스트 시나리오: 기획자 명령 + 사전 정의 답변(19항목)
├── sample-app/        ← FastAPI 베이스 스캐폴드 (하네스가 빌드해 들어갈 대상)
│   ├── requirements.txt
│   └── src/
│       ├── __init__.py
│       ├── main.py
│       └── database.py
├── _workspace/        ← Task 1-6 산출물
└── track4-report.md   ← 최종 재검증 리포트
```

## 판정 기준

| 항목 | PASS 조건 |
|------|-----------|
| Task 1-3 | 기획서·스펙·코드 산출물이 기획자 의도 범위 내에서만 생성됨 |
| Task 4 (정상 코드) | 0단계 기획 의도 검증 PASS + 무단추가 0건 |
| Task 4 (위반 코드) | 0단계가 무단 추가 기능을 **FAIL로 감지** + 항목 명시 |
| 하네스 갭 | npm 전제 명령의 Python 비호환 지점이 리포트에 기록됨 |

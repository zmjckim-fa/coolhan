# DEPLOYMENT MANIFEST

**목적:** 모든 배포를 기록하여 이전 버전 추적, 롤백, 감사 추적 가능  
**갱신:** 모든 배포 후 자동 업데이트  
**보관:** 법적 요구사항 (90일 이상)

---

## 배포 기록 (최신순)

### 배포 #[번호]

```
배포 환경: [LOCAL/STAGING/PRODUCTION]
배포자: [사용자명]
배포 시각: [ISO8601 타임스탬프]
배포 완료 시각: [ISO8601 타임스탬프]
소요 시간: [시간:분:초]

git 정보:
  커밋 SHA: [abc123def456...]
  브랜치: [develop/staging/main]
  태그: [v1.2.3 (프로덕션만)]
  
변경 파일:
  수정: [app.ts, user.service.ts, ...] (개수)
  추가: [new-file.ts, ...] (개수)
  삭제: [deleted-file.ts, ...] (개수)

배포 방식:
  수동/자동: [manual/automated]
  배포 도구: [GitHub Actions/Jenkins/Manual SSH]
  배포 전략: [blue-green/rolling/canary]

검증 결과:
  Pre-deploy 검사: ✅ PASS
  빌드 성공: ✅ PASS (빌드 시간)
  테스트 성공: ✅ PASS (테스트 개수)
  보안 검사: ✅ PASS
  
Post-deploy 검사 (12개):
  1. API 헬스: ✅ 200 OK (응답 시간)
  2. DB 연결: ✅ Connected
  3. 캐시 상태: ✅ OK
  4. 외부 API: ✅ All Reachable
  5. 성능: ✅ < 500ms
  6. 에러율: ✅ < 0.1%
  7. 스모크 테스트: ✅ PASS
  8. 보안 헤더: ✅ Present
  9. 상태 전이: ✅ Valid
  10. 모듈 격리: ✅ Enforced
  11. API 준수: ✅ Compliant
  12. Spec Drift: ✅ None Detected

모니터링 기간: [배포 완료 ~ 24시간 후]
모니터링 결과: ✅ Normal / ⚠️ Issues / ❌ Critical

이슈 발생:
  발생 여부: [없음/있음]
  내용: [이슈 설명]
  조치: [롤백/패치/무시]

롤백 필요: [필요 없음/필요함]
  원인: [롤백 사유]
  롤백 시각: [시간]
  복구 상태: ✅ Fully Restored

상태: ✅ SUCCESS / ⚠️ PARTIAL / ❌ FAILED

메모:
  [배포 과정 중 특이사항]
```

---

## 배포 히스토리 (자동 생성)

> 아래 내용은 배포 후 자동으로 추가됩니다.

---

## 환경별 최신 배포

### LOCAL 환경

```
마지막 배포: [YYYY-MM-DD HH:mm:ss UTC]
배포 커밋: [SHA]
배포 버전: [develop 최신]
현재 상태: [실행 중]
```

### STAGING 환경

```
마지막 배포: [YYYY-MM-DD HH:mm:ss UTC]
배포 커밋: [SHA]
배포 버전: [staging 최신]
현재 상태: [실행 중]

다음 배포 예정: [YYYY-MM-DD] (스테이징에서 최소 7일 검증)
```

### PRODUCTION 환경

```
마지막 배포: [YYYY-MM-DD HH:mm:ss UTC]
배포 커밋: [SHA]
배포 버전: [v1.2.3]
현재 상태: [실행 중, 정상]

다음 배포 윈도우: [다음 금요일 02:00 UTC]
```

---

## 배포 빈도 및 통계

### 일일 배포 수 (최근 30일)

```
총 배포: [개수]
  LOCAL: [개수]
  STAGING: [개수]
  PRODUCTION: [개수]

평균:
  일일: [개수]
  주간: [개수]
  월간: [개수]
```

### 배포 성공률

```
전체: [99.X%]
  LOCAL: [99.X%]
  STAGING: [99.X%]
  PRODUCTION: [99.X%]

실패 원인:
  빌드 실패: [개수]
  테스트 실패: [개수]
  배포 스크립트 오류: [개수]
  기타: [개수]
```

### 배포 소요 시간

```
평균:
  LOCAL: [분:초]
  STAGING: [분:초]
  PRODUCTION: [분:초]

최소:
  LOCAL: [분:초]
  STAGING: [분:초]
  PRODUCTION: [분:초]

최대:
  LOCAL: [분:초]
  STAGING: [분:초]
  PRODUCTION: [분:초]
```

---

## 롤백 기록

### 최근 롤백

```
롤백 #[번호]
  환경: [STAGING/PRODUCTION]
  시각: [YYYY-MM-DD HH:mm:ss UTC]
  원인: [이전 배포 버그]
  복구 버전: [이전 커밋 SHA]
  소요 시간: [분:초]
  결과: ✅ SUCCESS
```

### 롤백 통계

```
최근 30일 롤백: [개수]
최근 90일 롤백: [개수]
연간 롤백: [개수]

롤백률:
  LOCAL: [X%]
  STAGING: [X%]
  PRODUCTION: [X%]
```

---

## 문제 발생 기록

### Critical Issues

```
이슈 #[번호]
  환경: [PRODUCTION]
  시각: [YYYY-MM-DD HH:mm:ss UTC]
  영향: [영향받은 사용자 수]
  심각도: ❌ CRITICAL
  설명: [문제 설명]
  감지 방법: [자동/수동]
  해결 방법: [롤백/긴급 패치/...]
  해결 시각: [YYYY-MM-DD HH:mm:ss UTC]
  다운타임: [분:초]
```

### High Impact Issues

```
이슈 #[번호]
  환경: [STAGING/PRODUCTION]
  시각: [YYYY-MM-DD HH:mm:ss UTC]
  영향: [일부 기능 또는 사용자]
  심각도: ⚠️ HIGH
  설명: [문제 설명]
  감지 방법: [모니터링/수동]
  해결 방법: [수정 배포/...]
  해결 시각: [YYYY-MM-DD HH:mm:ss UTC]
```

---

## 배포 정책 준수

### 배포 윈도우 준수

```
LOCAL:
  준수율: 100% (제한 없음)

STAGING:
  준수율: 100% (언제든 가능, 최소 7일 검증)

PRODUCTION:
  배포 윈도우: 금요일 02:00 ~ 04:00 UTC (36시간 모니터링)
  준수율: [X%]
  위반 횟수: [개수]
    - 시간대 외 배포: [개수]
    - 금요일 아님: [개수]
    - 긴급 배포 예외: [개수]
```

### 검증 단계 준수

```
Pre-deploy 검증: [X% 통과율]
Post-deploy 검증: [X% 통과율]
모니터링 기간: [X% 준수]
```

---

## 환경별 버전 관리

### 버전 스키마

```
[MAJOR].[MINOR].[PATCH]

예시:
  1.0.0 (초기 프로덕션)
  1.0.1 (버그 수정)
  1.1.0 (새로운 기능)
  2.0.0 (주요 변경)
```

### 버전 매핑

```
LOCAL:
  현재 버전: [dev]
  최신 커밋: [SHA]
  브랜치: develop

STAGING:
  현재 버전: [staging]
  최신 커밋: [SHA]
  브랜치: staging
  예상 프로덕션: [v1.2.3 (예정일)]

PRODUCTION:
  현재 버전: [v1.2.3]
  최신 커밋: [SHA]
  태그: v1.2.3
  브랜치: main
  릴리스 날짜: [YYYY-MM-DD]
```

---

## 보안 및 감사

### 배포 승인 기록

```
배포 #[번호]
  승인자 1: [이름] - [일시]
  승인자 2: [이름] - [일시] (PRODUCTION만)
  요청 사유: [배포 요청 내용]
```

### SSH 접근 기록 (PRODUCTION)

```
배포 #[번호]
  SSH 호스트: prod.kleinanzeigen.co.kr:2222
  SSH 사용자: deploy
  접속 시각: [YYYY-MM-DD HH:mm:ss UTC]
  접속 해제: [YYYY-MM-DD HH:mm:ss UTC]
  실행 명령어:
    1. cd /home/deploy/production
    2. npm run build
    3. pm2 restart kleinanzeigen-api
    4. health-check.sh
  결과: ✅ SUCCESS
```

### 감사 추적 (Audit Log)

```
모든 배포는 다음 정보가 기록됩니다:
  - 배포자 (사용자명, 이메일)
  - 배포 시각 (UTC)
  - 배포 환경
  - 배포 커밋
  - 변경 파일
  - 배포 결과
  - 모니터링 기간
  - 이슈 발생 여부
```

---

## 성능 메트릭

### 배포 후 모니터링

```
배포 #[번호] (PRODUCTION)

30분 모니터링:
  API 응답 시간: [평균 ms]
  에러율: [X%]
  활성 사용자: [명]

24시간 모니터링:
  가동 시간: [99.X%]
  에러율: [X%]
  성능: [정상/저하/]
  이슈: [없음/있음]
```

### 성능 트렌드 (최근 3개월)

```
API 응답 시간:
  평균: [ms]
  최소: [ms]
  최대: [ms]
  추세: [안정/증가/감소]

에러율:
  평균: [X%]
  최대: [X%]
  추세: [안정/증가]

가동 시간:
  평균: [X%]
  최소: [X%]
```

---

## 알려진 이슈 및 제약사항

### 배포 제약사항

```
STAGING:
  - 제약사항 없음
  - 언제든 배포 가능

PRODUCTION:
  - 금요일 02:00 ~ 04:00 UTC만 배포
  - 최소 7일 스테이징 검증 필수
  - 2명 이상 승인 필수
  - 치명적 버그만 긴급 배포 가능
```

### 알려진 이슈

```
이슈 [ID]
  상태: ⚠️ Known Issue
  심각도: Medium
  설명: [이슈 설명]
  영향 범위: [영향받는 기능]
  회피 방법: [임시 해결 방법]
  예정 수정: [v1.2.4]
```

---

## 배포 체크리스트

### 배포 전

```
[ ] Staging에서 최소 7일 검증 (PRODUCTION만)
[ ] 모든 테스트 통과
[ ] 성능 벤치마크 확인
[ ] 보안 스캔 완료
[ ] 코드 리뷰 완료
[ ] 배포 승인 획득
[ ] 모니터링 담당자 배정
[ ] 롤백 계획 수립
```

### 배포 중

```
[ ] Pre-deploy 검증 통과
[ ] 빌드 성공
[ ] SSH 연결 확인
[ ] 배포 락 확인
[ ] 배포 스크립트 실행
[ ] 배포 로그 기록
```

### 배포 후

```
[ ] Post-deploy 검증 12개 항목 모두 통과
[ ] 모니터링 시작
[ ] 로그 확인 (에러 없음)
[ ] 헬스 체크 통과
[ ] 사용자 피드백 수집
[ ] 배포 기록 업데이트
```

---

## 자동 생성 필드

> 다음 필드는 배포 후 자동으로 생성됩니다:

```json
{
  "deploymentId": "[배포 번호 자동 생성]",
  "timestamp": "[ISO8601 현재 시간]",
  "environment": "[자동 감지]",
  "gitCommit": "[자동 추출]",
  "gitBranch": "[자동 추출]",
  "changedFiles": "[자동 분석]",
  "deploymentDuration": "[자동 계산]",
  "preDeployChecks": "[자동 실행]",
  "postDeployChecks": "[자동 실행]",
  "status": "[SUCCESS/FAILED]"
}
```

---

**이 매니페스트는 법적 감사 추적을 제공합니다.**  
**모든 배포는 자동으로 기록되며 90일 보관됩니다.**  
**롤백 기록도 함께 유지됩니다.**

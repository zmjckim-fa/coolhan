# M-09 GDPR·개인정보 (Privacy)

- **maps_to_existing:** `10_gdpr_privacy` · **novelty:** existing
- **proposed_kb_file:** `10_gdpr_privacy.md` (diff 제안, 미반영)
- **evidence:** F-10 · src/routes/gdpr.py, src/models/gdpr.py
- **coupling:** medium (user_id 단방향; 단 삭제/내보내기는 개념적 cross-cutting)

## 1. 용어
data_subject · consent_log · deletion_request · data_export

## 2. 기능
- 데이터 주체 조회 — user 1:1 (F-10)
- 삭제 요청/목록 — right-to-erasure (F-10)
- 데이터 내보내기 요청 — data portability (F-10)
- 동의 갱신/이력 조회 — consent_log (F-10)

## 3. 상태값
미발견 (삭제요청 처리 상태 enum 미확인)

## 4. 데이터 모델
- `data_subject` (id, user_id[unique]) — gdpr.py:26 (user 1:1)
- `consent_log` (id, user_id) — gdpr.py:58

## 5. API
- GET /api/gdpr/data-subject/{user_id} — gdpr.py:17
- POST /api/gdpr/deletion-request/{user_id} — gdpr.py:24
- POST /api/gdpr/data-export/{user_id} — gdpr.py:29
- POST /api/gdpr/consent/{user_id} — gdpr.py:34
- GET /api/gdpr/consent-history/{user_id} — gdpr.py:39
- GET /api/gdpr/deletion-requests/ — gdpr.py:44

## 6. 권한
미발견 (무인증; 본인/관리자 게이트 코드 미확인 — **R1 보안 발견, 개인정보 노출 위험**)

## 7. 금지
미발견 (타인 개인정보 조회/삭제 차단 코드 미확인)

## 8. 보안
data_subject user 1:1 매핑 · consent 이력 보관. **단, 무인증 노출이 critical gap.**

## 9. 승인 기준
삭제 요청·내보내기·동의 이력 흐름 동작

## 10. 통합점
- M-01 (회원) — references (data_subject/consent_log.user_id)

## 11. 설정
미발견 (보관 기간 등 미수집)

## 12. 의존성
M-01 회원

## 재사용 메모
user_id 단방향 의존. 단, 실제 '삭제/내보내기'는 모든 모듈의 user 데이터에 교차 영향(개념적 cross-cutting) — cascade가 타 모듈 레코드까지 닿아야 완전하나 코드상 미확인. **무인증 노출은 추출 전 반드시 인증 게이트 추가 필요.**

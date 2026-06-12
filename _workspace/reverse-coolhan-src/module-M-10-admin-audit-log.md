# M-10 관리자 감사 로그 (Admin Audit Log)

- **maps_to_existing:** `05_admin_system` · **novelty:** existing
- **proposed_kb_file:** `05_admin_system.md` (diff 제안, 미반영)
- **evidence:** F-11 · src/routes/admin.py, src/models/admin.py
- **coupling:** low (admin_user_id 단방향; append-only)

## 1. 용어
admin_log · admin_user · resource_type/resource_id · user-action

## 2. 기능
- 감사 로그 생성 — 관리자 행위 기록 (F-11)
- 로그 조회/관리자별·리소스별·전체 목록 (F-11)
- 사용자 행위 로깅 — user-action (F-11)

## 3. 상태값
미발견 (감사 로그는 append-only, 상태 enum 없음)

## 4. 데이터 모델
- `admin_log` (id, admin_user_id) — admin.py:34

## 5. API
- POST /api/admin/logs/ — admin.py:17
- GET /api/admin/logs/{log_id} — admin.py:29
- GET /api/admin/logs/admin/{admin_user_id} — admin.py:36
- GET /api/admin/logs/resource/{resource_type}/{resource_id} — admin.py:41
- GET /api/admin/logs/ — admin.py:46
- POST /api/admin/logs/user-action/ — admin.py:51

## 6. 권한
미발견 (**require_admin 정의됨 auth.py:72 — 단, 어떤 /api/admin 라우트에도 미적용. R1 보안 발견: 관리자 로그가 무인증 노출**)

## 7. 금지
미발견 (감사 로그 변조/삭제 금지 기대되나 코드 미확인)

## 8. 보안
감사 로그 모델 존재 · 다만 인가 게이트 미적용이 critical gap (R1)

## 9. 승인 기준
관리자/리소스/전체 필터로 로그 조회 · user-action 기록

## 10. 통합점
- M-01 (회원) — references (admin_log.admin_user_id → user)

## 11. 설정
미발견

## 12. 의존성
M-01 회원

## 재사용 메모
admin_user_id 단방향 참조만. append-only 로그로 경계 명확. **추출 전 require_admin 게이트를 라우트에 실제 적용 필요(현재 미적용).**

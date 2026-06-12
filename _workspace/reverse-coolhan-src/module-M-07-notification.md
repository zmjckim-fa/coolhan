# M-07 알림 (Notification)

- **maps_to_existing:** `06_notification_system` · **novelty:** existing
- **proposed_kb_file:** `06_notification_system.md` (diff 제안, 미반영)
- **evidence:** F-08 · src/routes/notification.py, src/models/notification.py
- **coupling:** low (user_id 단방향; 실 발신 미구현)

## 1. 용어
notification · channel(enum incl. WEBHOOK) · sent/failed/pending

## 2. 기능
- 알림 발송 생성 — 사용자 대상 레코드 (F-08)
- 알림 조회/사용자별 목록 (F-08)
- 발송 완료/실패 표시 — sent/failed 전이 (F-08)
- 대기 목록 조회 — pending (F-08)

## 3. 상태값
pending · sent · failed (전이 엔드포인트로 확인)

## 4. 데이터 모델
- `notification` (id, user_id) — notification.py:37

## 5. API
- POST /api/notifications/ — notification.py:17
- GET /api/notifications/{notification_id} — notification.py:24
- GET /api/notifications/user/{user_id} — notification.py:31
- POST /api/notifications/{notification_id}/sent — notification.py:36
- POST /api/notifications/{notification_id}/failed — notification.py:43
- GET /api/notifications/pending/list — notification.py:50

## 6. 권한
미발견 (무인증 — R1 보안 발견)

## 7. 금지
미발견

## 8. 보안
미발견

## 9. 승인 기준
발송 레코드 생성→sent/failed 전이 · pending 목록 조회

## 10. 통합점
- M-01 (회원) — references (notification.user_id)

## 11. 설정
미발견

## 12. 의존성
M-01 회원

## 재사용 메모
user_id 단방향 참조. 실제 발신(SMTP/SMS/webhook) 미구현 — channel enum + 상태기계만. 재사용 시 발신 디스패처 신규 연결. 상태기계 자체는 그대로 추출 가능.

# M-01 회원 시스템 (Member & Auth)

- **maps_to_existing:** `01_member_system` · **novelty:** existing
- **proposed_kb_file:** `01_member_system.md` (diff 제안, 미반영)
- **evidence:** F-01, F-02 · src/routes/auth.py, src/routes/member.py, src/models/member.py, src/auth.py
- **coupling:** low (foundation — 외향 의존 0, 다수 모듈이 피참조)

## 1. 용어
user · role · user_role(assoc) · user_role_explicit(assigned_by) · session(JWT) · current_user

## 2. 기능
- 회원 가입 — 이메일+비밀번호 등록, bcrypt 해싱 (F-01)
- 로그인 — JWT 발급 (F-01)
- 현재 사용자 조회 — 토큰 기반 본인 조회, auth 강제 (F-01)
- 로그아웃 — 세션 종료, auth 강제 (F-01)
- 회원 CRUD — 생성/목록/조회/수정/삭제 (F-02)

## 3. 상태값
미발견 (user.status 필드 존재하나 상태값 집합 코드 미확인)

## 4. 데이터 모델
- `role` (id, name) — src/models/member.py:43
- `user` (id, email, password/hash, status) — src/models/member.py:61
- `user_role` assoc (user_id, role_id) — src/models/member.py:32
- `user_role_explicit` (user_id, role_id, assigned_by) — src/models/member.py:93

## 5. API
- POST /api/auth/register — auth.py:34
- POST /api/auth/login — auth.py:60
- GET /api/auth/me — auth.py:84 (auth 강제)
- POST /api/auth/logout — auth.py:98 (auth 강제)
- POST/GET/GET{id}/PUT{id}/DELETE{id} /api/members/ — member.py:37/64/55/71/80

## 6. 권한
authenticated → get_me, logout · anonymous → register, login · member CRUD는 현 코드상 무인증

## 7. 금지
미발견

## 8. 보안
bcrypt 해싱 (auth.py:38) · JWT 세션 (auth.py:53) · require_admin 정의됨 auth.py:72 — **member CRUD에 미적용 (R1 보안 발견)**

## 9. 승인 기준
register→login→me 흐름 동작 · 비밀번호 평문 미저장(해싱)

## 10. 통합점
없음 (foundation, 외향 의존 없음)

## 11. 설정
미발견 (JWT secret/exp 미수집)

## 12. 의존성
없음 (leaf). 피참조: M-04, M-07, M-08, M-09, M-10

## 재사용 메모
foundation. get_current_user/require_admin 인터페이스 명확. 추출 시 JWT secret만 파라미터화.

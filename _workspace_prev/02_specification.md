# Task 2: CoolHan 규격 작성

## 기능: 사용자 피드백 수집 시스템

### 1. 도메인 모듈
**선택**: 새 모듈 생성 (11_feedback_system)

### 2. 데이터 모델

**테이블: feedback**
```
- id (UUID, PK)
- user_id (UUID, FK → users.id)
- title (VARCHAR 255, NOT NULL)
- content (TEXT, NOT NULL)
- category (ENUM: BUG, FEATURE_REQUEST, IMPROVEMENT, OTHER)
- status (ENUM: NEW, IN_PROGRESS, COMPLETED, REJECTED, default=NEW)
- created_at (TIMESTAMP, auto)
- updated_at (TIMESTAMP, auto)

INDEX: user_id, status, category, created_at
```

### 3. API 엔드포인트

**사용자**
- POST /api/feedback
  - 입력: { title, content, category }
  - 인증: JWT (필수)
  - 검증: title (1-255), content (1-5000), category (enum)
  - 응답: { id, created_at }
  - 상태: 201 Created

- GET /api/feedback/{id}
  - 인증: JWT
  - 응답: { id, title, content, category, status, created_at }
  - 상태: 200 OK / 404 Not Found

**관리자**
- GET /admin/api/feedback
  - 쿼리: status, category, page, limit
  - 응답: { total, items: [...], page }
  - 상태: 200 OK

- GET /admin/api/feedback/{id}
  - 응답: { id, user_id, title, content, category, status, created_at }
  - 상태: 200 OK

- PATCH /admin/api/feedback/{id}/status
  - 입력: { status }
  - 검증: status (enum)
  - 응답: { id, status, updated_at }
  - 상태: 200 OK

- DELETE /admin/api/feedback/{id}
  - 상태: 204 No Content

### 4. UI/UX

**사용자 페이지**
- /feedback
- 폼: 제목 (입력), 내용 (텍스트에어), 카테고리 (드롭다운), 제출 버튼
- 피드백: 성공/실패 메시지

**관리자 대시보드**
- /admin/feedback
- 피드백 목록 (테이블): ID, 제목, 카테고리, 상태, 작성일
- 필터: 카테고리, 상태
- 상세 보기 (모달): 전체 정보 + 상태 변경 + 삭제 버튼

### 5. 보안 요구사항
- 인증: JWT 토큰
- 권한: 관리자 권한 (@admin role)
- 입력값 검증: 길이, XSS 방지
- SQL Injection: Parameterized queries

### 6. 테스트 케이스 (10개)
1. 피드백 제출 성공
2. 미인증 사용자 피드백 제출 거부
3. 빈 제목 검증 실패
4. 빈 내용 검증 실패
5. 카테고리 enum 검증 실패
6. 관리자 대시보드 접근 (관리자만)
7. 상태 변경 (관리자만)
8. 피드백 삭제 (관리자만)
9. 피드백 목록 필터링
10. 페이지네이션

---

## 산출물 요약
✅ 스펙 완성
✅ API 명세 완성
✅ 데이터 모델 완성
✅ 보안 요구사항 완성
✅ Task 3으로 진행 준비 완료

**상태**: PASS ✅

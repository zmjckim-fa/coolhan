# M-08 리뷰·평점 (Review & Rating)

- **maps_to_existing:** `07_review_rating_system` · **novelty:** existing
- **proposed_kb_file:** `07_review_rating_system.md` (diff 제안, 미반영)
- **evidence:** F-09 · src/routes/review.py, src/models/review.py
- **coupling:** medium (user_id + product_id 두 외향 FK)

## 1. 용어
review · rating · product aggregate rating

## 2. 기능
- 리뷰 작성/조회 — 상품·사용자 리뷰 (F-09)
- 상품별/사용자별 리뷰 목록 (F-09)
- 평점 생성 — rating 레코드 (F-09)
- 상품 집계 평점 조회 — product 평균 (F-09)

## 3. 상태값
미발견 (모더레이션 상태 enum 코드 미확인)

## 4. 데이터 모델
- `review` (id, product_id, user_id) — review.py:16
- `rating` (id, product_id, user_id) — review.py:47

## 5. API
- POST /api/reviews/ — review.py:21
- GET /api/reviews/{review_id} — review.py:26
- GET /api/reviews/product/{product_id} — review.py:33
- GET /api/reviews/user/{user_id} — review.py:38
- POST /api/reviews/ratings/ — review.py:43
- GET /api/reviews/product/{product_id}/rating — review.py:48

## 6. 권한
미발견 (무인증 — R1 보안 발견)

## 7. 금지
미발견 (구매자만 리뷰 등 검증 코드 미확인)

## 8. 보안
미발견

## 9. 승인 기준
리뷰·평점 생성 · 상품 집계 평점 산출

## 10. 통합점
- M-01 (회원) — references (review/rating.user_id)
- M-02 (쇼핑) — references (review/rating.product_id)

## 11. 설정
미발견

## 12. 의존성
M-01 회원, M-02 쇼핑

## 재사용 메모
두 외향 FK. 집계 평점이 product 참조 — 쇼핑/회원과 함께 또는 어댑터 경유로 추출.

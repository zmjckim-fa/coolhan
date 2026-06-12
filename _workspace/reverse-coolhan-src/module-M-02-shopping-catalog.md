# M-02 쇼핑몰 카탈로그 (Shopping Catalog)

- **maps_to_existing:** `02_shopping_mall` · **novelty:** existing
- **proposed_kb_file:** `02_shopping_mall.md` (diff 제안, 미반영)
- **evidence:** F-03 · src/routes/shopping.py, src/models/shopping.py
- **coupling:** low (외향 의존 0; product가 피참조)

## 1. 용어
category(self-nesting) · product · featured product

## 2. 기능
- 카테고리 생성/목록/조회 — parent_category_id 자기참조 트리 (F-03)
- 상품 생성/목록/조회 (F-03)
- 카테고리별 상품 조회 — category_id 필터 (F-03)
- 추천 상품 목록 — featured (F-03)

## 3. 상태값
미발견

## 4. 데이터 모델
- `category` (id, name, parent_category_id) — shopping.py:16 (self-referential 1:N)
- `product` (id, category_id) — shopping.py:41

## 5. API
- POST/GET/GET{id} /api/shopping/categories/ — shopping.py:21/26/31
- POST/GET/GET{id} /api/shopping/products/ — shopping.py:38/43/48
- GET /api/shopping/products/category/{category_id} — shopping.py:55
- GET /api/shopping/featured/ — shopping.py:60

## 6. 권한
미발견 (모든 엔드포인트 무인증 — R1 보안 발견; 생성/수정에 관리자 게이트 없음)

## 7. 금지
미발견

## 8. 보안
미발견 (생성/수정 인증·관리자 게이트 부재 — R1 보안 발견)

## 9. 승인 기준
카테고리 자기참조 트리 구성 · 카테고리별/추천 필터 동작

## 10. 통합점
없음 (외향 의존 없음)

## 11. 설정
미발견

## 12. 의존성
없음 (leaf). 피참조: M-04, M-05, M-08

## 재사용 메모
독립 카탈로그. 그대로 추출 가능. product가 주문/재고/리뷰의 참조 대상.

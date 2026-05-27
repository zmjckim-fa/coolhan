# Shopping Mall Core - B2C 이커머스 표준 정의
**Version:** 1.0.0  
**Effective Date:** 2026-05-27  
**Purpose:** B2C E-Commerce Platform Standard Definition  
**Status:** MANDATORY for shopping mall projects  
**Language:** Korean (한국어)

---

## 📌 Executive Summary

Shopping Mall Core는 B2C 이커머스 플랫폼의 최소 필요 기능, 데이터 구조, 상태값, API 패턴을 정의합니다. 이 Core를 로드하면 "쇼핑몰이란 무엇인가"를 반복 설명할 필요가 없습니다.

**핵심 원칙:**
- 단일 판매자 (Platform-to-Consumer, P2C)
- 회원 기반 구매
- 신용카드/계좌이체 결제
- 배송 추적
- 기본 관리자 기능

---

## 1️⃣ 기본 포함 기능 (Non-Negotiable)

반드시 포함되는 기능. 제거 불가:

### 회원 시스템
- **회원가입**: 이메일 기반 인증
  - 필수 정보: 이메일, 비밀번호, 이름, 휴대폰
  - 이메일 인증 필수
  - 중복 가입 방지
- **로그인/로그아웃**: 이메일 + 비밀번호
  - 세션 관리 (또는 JWT)
  - 자동 로그인 옵션 (30일)
  - 비밀번호 찾기/변경
- **프로필 관리**: 개인정보 수정
  - 이름, 휴대폰, 배송 주소 관리
  - 비밀번호 변경
  - 회원 탈퇴

### 상품 카탈로그
- **상품 조회**: 브라우징 기능
  - 카테고리별 상품 목록
  - 검색 기능 (상품명, 설명)
  - 정렬 (인기도, 가격, 신상품)
  - 페이지네이션 (20-50개/페이지)
- **상품 상세**: 상품 정보 조회
  - 상품명, 설명, 이미지, 가격
  - 재고 상태 (재고 있음/없음)
  - 상품 평점 및 리뷰 개수

### 장바구니
- **추가/삭제**: 장바구니 관리
  - 상품 추가 시 수량 지정 (1개 이상)
  - 삭제 버튼
  - 수량 변경
  - 계속 쇼핑 옵션
- **장바구니 조회**: 현재 장바구니 상태
  - 상품 목록 (이미지, 이름, 가격, 수량, 소계)
  - 총합계 자동 계산
  - 배송료 미포함 (결제 단계에서 계산)

### 주문 (주문 생성 ~ 배송 추적)
- **주문 생성**: 장바구니 → 주문 전환
  - 배송 주소 입력/선택
  - 배송 방법 선택 (일반 배송만, 특급 배송은 로직 추가 필요)
  - 배송료 추가
  - 주문 검토 화면
- **주문 확인**: 생성된 주문 조회
  - 주문번호, 주문일시, 주문 상태
  - 상품 목록, 수량, 가격
  - 배송 예정일
- **주문 취소**: 배송 전 취소 가능
  - pending_payment 또는 payment_confirmed 상태에서만 가능
  - 취소 사유 기록
  - 환불 자동 처리 (결제 취소)
- **배송 추적**: 배송 상태 실시간 확인
  - 배송사, 송장번호
  - 현재 배송 상태
  - 배송 예정일
  - 배송 히스토리

### 결제
- **결제 수단**: 신용카드, 계좌이체
  - PG사 연동 (예: Stripe, NHN KCP)
  - 카드사 인증 (또는 OTP)
  - 거래 키 발급 및 저장
- **결제 처리**: 결제 실행
  - 결제 전 금액 재확인 (장바구니 수정 방지)
  - 결제 타임아웃: 30분 (미완료 시 자동 취소)
  - 멱등성 보장 (같은 요청 반복 시 한 번만 결제)
- **결제 확인**: 결제 상태 조회
  - 결제 성공/실패 여부
  - 거래번호, 결제 수단
  - 결제 일시

### 배송
- **배송 관리**: 주문 → 배송 처리
  - 주문 확인 후 배송 준비
  - 배송사 선택 (대한통운, CJ, 로젠 등)
  - 송장 입력
  - 배송 상태 자동 업데이트 (배송사 API 연동)
- **반품/교환**: 배송 후 반품 처리
  - 배송 완료 후 30일 이내 반품 신청 가능
  - 반품 사유 선택
  - 반품 배송 주소 제공
  - 반품 수령 후 환불 처리

### 관리자 기능
- **상품 관리**: 상품 CRUD
  - 상품 등록 (이름, 설명, 이미지, 가격, 재고)
  - 상품 수정 (가격, 재고 등)
  - 상품 비활성화 (삭제 아님)
  - 카테고리 관리
- **주문 관리**: 전체 주문 조회 및 처리
  - 주문 목록 (필터: 상태, 날짜)
  - 주문 상세 조회
  - 주문 상태 수동 변경 (배송 준비 완료 등)
- **사용자 관리**: 회원 조회 및 처리
  - 회원 목록
  - 회원 정보 조회
  - 회원 비활성화/활성화
- **통계**: 기본 판매 통계
  - 일일 판매액
  - 상품별 판매량
  - 주문 수

---

## 2️⃣ 기본 DB 구조 (9개 핵심 테이블)

| # | 테이블 | 목적 | 소유 모듈 | 행 수 추정 (1년) |
|---|--------|------|---------|-----------------|
| 1 | `users` | 회원 정보 | 01_member_system | 10K-100K |
| 2 | `products` | 상품 정보 | 02_shopping_mall | 1K-10K |
| 3 | `product_images` | 상품 이미지 | 02_shopping_mall | 5K-50K |
| 4 | `addresses` | 배송 주소 | 01_member_system | 20K-200K |
| 5 | `cart_items` | 장바구니 항목 | 02_shopping_mall | 100K-1M (임시) |
| 6 | `orders` | 주문 | 09_order_management | 10K-100K |
| 7 | `order_items` | 주문 항목 | 09_order_management | 30K-300K |
| 8 | `payments` | 결제 | 03_payment_system | 10K-100K |
| 9 | `shipments` | 배송 | 04_shipping_logistics | 10K-100K |

### 테이블 스키마 개요

**users**
```
id (PK) | email (UNIQUE) | password_hash | name | phone | created_at | updated_at | is_active
```

**products**
```
id (PK) | name | description | price | stock | category_id | image_url | is_active | created_at | updated_at
```

**orders**
```
id (PK) | user_id (FK) | order_number (UNIQUE) | total_amount | status | shipping_address | created_at | updated_at
```

**payments**
```
id (PK) | order_id (FK) | amount | status | payment_method | transaction_id | created_at
```

**shipments**
```
id (PK) | order_id (FK) | shipping_company | tracking_number | status | shipped_at | delivered_at | created_at
```

---

## 3️⃣ 기본 상태값 (Status Value Registry)

### Order Status (주문 상태)
```
(1) pending_payment
    → (2) payment_confirmed
        → (3) shipping_ready
            → (4) in_transit
                → (5) delivered
                    → (6) completed
    
    또는
    → (X) canceled (어느 단계에서나)

(5) delivered 상태에서
    → (7) return_requested
        → (8) return_approved
            → (9) return_in_transit
                → (10) return_completed
                    → (11) refunded
```

**상태별 설명:**
- `pending_payment`: 주문 생성, 결제 대기 중. 타임아웃 30분
- `payment_confirmed`: 결제 완료
- `shipping_ready`: 상품 포장 완료, 배송사 픽업 대기
- `in_transit`: 배송 중
- `delivered`: 배송 완료
- `completed`: 거래 완료 (일반적으로 배송 후 7일 경과)
- `canceled`: 취소됨
- `return_requested`: 반품 요청됨
- `return_approved`: 반품 승인됨
- `return_in_transit`: 반품 배송 중
- `return_completed`: 반품 도착
- `refunded`: 환불 완료

### Payment Status (결제 상태)
```
(1) pending
    → (2) completed
        → (3) refunded

또는
→ (X) failed
→ (X) canceled
```

### Shipment Status (배송 상태)
```
(1) ready_to_ship
    → (2) in_transit
        → (3) delivered

또는
→ (X) failed (배송 실패, 반송)
→ (X) returned (반품)
→ (X) canceled
```

---

## 4️⃣ 기본 API 엔드포인트 (30+ endpoints)

### Authentication (5 endpoints)
```
POST   /auth/register              회원가입
POST   /auth/login                 로그인
POST   /auth/logout                로그아웃
POST   /auth/refresh-token         토큰 갱신
POST   /auth/forgot-password       비밀번호 찾기
```

### Member (8 endpoints)
```
GET    /members/{id}               개인정보 조회
PUT    /members/{id}               개인정보 수정
DELETE /members/{id}               회원 탈퇴
POST   /members/{id}/addresses     배송 주소 추가
GET    /members/{id}/addresses     배송 주소 목록
PUT    /members/{id}/addresses/{addr_id}  주소 수정
DELETE /members/{id}/addresses/{addr_id}  주소 삭제
POST   /members/{id}/password      비밀번호 변경
```

### Product (6 endpoints)
```
GET    /products                   상품 목록 (검색, 필터, 정렬)
GET    /products/{id}              상품 상세 조회
POST   /products                   상품 등록 (관리자)
PUT    /products/{id}              상품 수정 (관리자)
DELETE /products/{id}              상품 비활성화 (관리자)
GET    /products/{id}/reviews      상품 리뷰 조회
```

### Cart (5 endpoints)
```
GET    /cart                       장바구니 조회
POST   /cart/items                 상품 추가
PUT    /cart/items/{item_id}       수량 변경
DELETE /cart/items/{item_id}       상품 제거
DELETE /cart                       장바구니 비우기
```

### Order (8 endpoints)
```
POST   /orders                     주문 생성
GET    /orders                     주문 목록 (개인)
GET    /orders/{id}                주문 상세 조회
PUT    /orders/{id}/cancel         주문 취소
GET    /orders/{id}/shipment       배송 조회
POST   /orders/{id}/return         반품 신청
GET    /admin/orders               주문 목록 (관리자, 필터 가능)
PUT    /admin/orders/{id}/status   주문 상태 변경 (관리자)
```

### Payment (4 endpoints)
```
POST   /payments                   결제 실행
GET    /payments/{id}              결제 상세 조회
POST   /payments/{id}/refund       환불 (관리자)
GET    /admin/payments             결제 목록 (관리자)
```

### Admin Dashboard (4 endpoints)
```
GET    /admin/dashboard/stats      판매 통계
GET    /admin/products             상품 관리
GET    /admin/members              회원 관리
GET    /admin/audit-log            감사 로그
```

---

## 5️⃣ 금지사항 (Prohibitions)

**절대 구현하면 안 되는 기능들:**

- ❌ **다중 통화 (Multi-currency pricing)**
  - 예: 상품을 USD, EUR, KRW로 표시
  - 이유: 환율 관리 복잡도 증가
  
- ❌ **구독 상품 (Subscription products)**
  - 예: 월간 정기 배송
  - 이유: 반복 결제 로직 필요 (별도 Core)
  
- ❌ **복잡한 프로모션 (Dynamic discount rules)**
  - 예: "3개 구매 시 10% 할인", "특정 시간 할인"
  - 이유: 기본은 고정 가격만 지원
  - 허용: 고정 할인가(예: 정가 10,000 → 판매가 8,000)
  
- ❌ **상품 옵션 (Product variants)**
  - 예: "셔츠 (색상: 빨강/파랑, 사이즈: S/M/L)"
  - 이유: 별도 아키텍처 필요
  - 허용: 각 옵션을 별도 상품으로 등록
  
- ❌ **포인트/충성도 시스템 (Loyalty points)**
  - 예: 구매 시 포인트 적립, 포인트로 결제
  - 이유: 별도 Core 필요
  
- ❌ **드롭십핑 (Dropshipping)**
  - 예: 제3자 공급자에서 직배송
  - 이유: 별도 Core (marketplace) 필요

---

## 6️⃣ 산업 표준 시나리오

### Scenario 1: Happy Path - 정상 주문 흐름

```
Step 1: 회원가입 & 로그인 (5분)
  사용자: 이메일, 비밀번호, 이름, 휴대폰 입력
  시스템: 이메일 인증 메일 발송
  사용자: 이메일 클릭하여 인증 완료
  
Step 2: 상품 검색 & 선택 (10분)
  사용자: 카테고리 → 검색 → 상품 상세 조회
  시스템: 상품 정보 반환 (이름, 가격, 이미지, 재고)
  
Step 3: 장바구니 (2분)
  사용자: "장바구니 추가" 클릭 (수량 2개)
  시스템: 장바구니에 추가, 합계 표시
  
Step 4: 결제 (5분)
  사용자: "구매하기" 클릭
  시스템: 배송 주소 선택 화면
  사용자: 주소 선택 또는 새로 입력
  시스템: 배송료 계산 (예: 3,000원), 총합 표시
  사용자: 결제 수단 선택 (카드/계좌)
  사용자: 카드사 OTP 또는 인증
  시스템: 결제 완료, 주문번호 발급
  
Step 5: 배송 (2-7일)
  시스템: 배송사에 픽업 요청 (자동 또는 관리자)
  배송사: 상품 픽업 → 배송 시작
  시스템: 배송 상태 자동 업데이트 (배송사 API)
  사용자: 배송 추적 페이지에서 실시간 위치 확인
  
Step 6: 배송 완료
  배송사: 최종 배송지 도착 알림
  시스템: 상태 → "delivered"로 변경
  사용자: "배송 완료" 알림 수신
  
Step 7: 거래 완료 (7일 경과)
  시스템: 자동으로 상태 → "completed"로 변경
  사용자: 리뷰 작성 가능
```

**예상 시간:** 회원가입 5분 + 쇼핑 10분 + 결제 5분 + 배송 2-7일

---

### Scenario 2: 주문 취소

```
상황: 사용자가 결제 후 배송 전 취소

Step 1: 취소 요청
  사용자: 주문 상세 페이지에서 "주문 취소" 버튼 클릭
  시스템: 취소 가능 여부 확인
    ✓ 가능: pending_payment 또는 payment_confirmed
    ✗ 불가: shipping_ready 이상
  
Step 2: 취소 처리
  사용자: 취소 사유 선택 (선택사항)
  시스템: 
    - 주문 상태 → "canceled"
    - 결제 취소 (PG사에 요청)
    - 사용자 계좌에 환불
    - 알림 발송
  
Step 3: 확인
  사용자: 환불 확인 (1-3일 소요)
  시스템: 결제 상태 → "canceled"로 변경
```

**예상 시간:** 즉시 요청, 환불은 1-3일

---

### Scenario 3: 반품

```
상황: 배송 완료 후 상품 불만족

Step 1: 반품 신청
  사용자: 주문 상세 페이지에서 "반품 신청" 클릭
  시스템: 배송 완료 후 30일 이내 여부 확인
    ✓ 가능: delivered, completed 상태
    ✗ 불가: 30일 초과
  사용자: 반품 사유 선택 (예: "불량", "배송 손상", "색상 차이")
  시스템: 상태 → "return_requested"
  
Step 2: 반품 승인
  관리자: 반품 신청 검토
  시스템: 상태 → "return_approved"
  시스템: 반품 배송 주소 제공
  
Step 3: 반품 배송
  사용자: 제품을 반품 주소로 배송
  배송사: 반품사 픽업 → 창고 도착
  시스템: 상태 → "return_in_transit" → "return_completed"
  
Step 4: 환불
  관리자: 반품 수령 확인
  시스템: 상태 → "refunded"
  시스템: 결제액 전액 환불
  사용자: 환불 확인 (1-3일)
```

**예상 시간:** 신청부터 환불까지 1-2주

---

### Scenario 4: 배송 실패

```
상황: 배송 중 반송됨 (주소 불명확, 수령 거부 등)

Step 1: 배송 실패 감지
  배송사: 배송 불가 알림
  시스템: 배송사 API에서 상태 수신 → "failed"
  
Step 2: 사용자 연락
  시스템: "배송 실패" 알림 발송
  사용자: 배송 주소 변경 또는 환불 선택
  
Step 3-A: 재배송 (사용자가 선택)
  사용자: 올바른 주소 입력
  시스템: 재배송 주소 등록
  배송사: 다시 배송 시작
  
Step 3-B: 환불 (사용자가 선택)
  시스템: 상태 → "canceled"
  시스템: 환불 처리
```

---

## 7️⃣ 제약사항 (Constraints)

| 항목 | 제약 | 이유 |
|------|------|------|
| **최대 주문 항목** | 100개 | DB 성능, 배송 관리 편의성 |
| **최소 주문액** | 없음 | 모든 주문 수용 |
| **최대 주문액** | 없음 | 제한 없음 |
| **결제 타임아웃** | 30분 | 좌석 확보, 스팸 방지 |
| **환불 가능 기간** | 배송 완료 후 30일 | 산업 표준 |
| **배송 주소 개수** | 1개/주문 | 단순성 |
| **배송사** | 제한 없음 | 사용자 선택 |
| **배송 예상일** | 2-7일 | 국내 기준 |
| **이미지 크기** | 최대 10MB/파일 | 저장소 관리 |
| **상품 최대 이미지** | 10개/상품 | DB 효율성 |
| **회원 최대 주소** | 제한 없음 | 편의성 |
| **동시 주문** | 1개/유저/30초 | 스팸 방지 |

---

## ✅ 체크리스트 (이 Core 로드 시 확인사항)

- [ ] 9개 기본 DB 테이블 생성됨
- [ ] 30+ API 엔드포인트 구현됨
- [ ] 주문 상태 전이 로직 구현됨
  - pending_payment → payment_confirmed → shipping_ready → in_transit → delivered → completed
  - canceled 경로 구현
  - return 경로 구현
- [ ] PG사 연동 (결제, 환불)
- [ ] 배송사 API 연동 (배송 상태 업데이트)
- [ ] 금지사항 확인 (다중 통화 등 없음)
- [ ] 배송료 계산 로직 구현됨
- [ ] 재고 관리 로직 구현됨
- [ ] 이메일 알림 구현됨 (주문, 배송, 환불)

---

**최종 검증:** 이 Core를 로드하면 B2C 쇼핑몰의 최소 필요 기능이 모두 정의됩니다. 추가 기능(마케팅, 추천, 라이브커머스 등)은 별도 Core 또는 확장 모듈에서 정의합니다.

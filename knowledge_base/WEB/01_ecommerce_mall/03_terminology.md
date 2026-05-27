# 쇼핑몰 - 용어 정의 (E-Commerce Mall Terminology)

## 1. 기본 엔티티 용어

### 상품 (Product)
**정의:** 판매하는 물건 또는 서비스
- **SKU (Stock Keeping Unit):** 재고 관리용 상품 고유 번호
- **상품명:** 구매자가 검색할 때 사용하는 상품의 이름
- **상품 설명:** 상품의 상세 정보 (텍스트, 이미지, 동영상)
- **가격:** 고객이 지불해야 하는 금액
- **정가 (List Price):** 원래 정해진 가격
- **할인가 (Discounted Price):** 할인을 적용한 가격
- **할인율:** (정가 - 할인가) / 정가 × 100%
- **재고 (Inventory):** 현재 보유한 상품 수량

### 사용자 (User)
**정의:** 시스템을 사용하는 인물
- **구매자 (Buyer/Customer):** 상품을 구매하는 사람
- **판매자 (Seller/Vendor):** 상품을 판매하는 개인 또는 업체
- **관리자 (Admin):** 플랫폼을 운영하는 사람
- **UID (User ID):** 사용자의 고유 번호

### 주문 (Order)
**정의:** 구매자가 상품을 구매하기 위한 거래
- **주문번호 (Order ID):** 주문의 고유 번호
- **주문일:** 구매자가 주문한 날짜 및 시간
- **주문상태:** 주문의 현재 단계 (결제대기, 결제완료, 배송중, 배송완료, 취소, 환불)
- **주문항목 (Order Item):** 주문에 포함된 개별 상품
- **수량 (Quantity):** 구매한 상품의 개수
- **단가 (Unit Price):** 상품 1개의 가격 (주문 당시)
- **소계 (Subtotal):** 수량 × 단가

### 결제 (Payment)
**정의:** 금액을 지불하는 행위
- **결제수단 (Payment Method):** 결제 방법 (신용카드, 계좌이체, 무통장입금 등)
- **결제액 (Payment Amount):** 지불한 금액
- **결제상태 (Payment Status):** 결제의 현재 상태 (결제대기, 결제완료, 결제실패, 환불)
- **PG (Payment Gateway):** 결제를 중개하는 서비스 (신용카드, 무통장 등)
- **거래번호 (Transaction ID):** PG에서 발급한 거래 고유 번호
- **승인번호 (Approval Number):** 결제가 승인되었을 때의 번호

### 배송 (Shipping)
**정의:** 주문한 상품을 고객에게 전달하는 과정
- **배송지 (Delivery Address):** 상품을 받을 주소
- **배송사 (Shipping Company):** 배송을 담당하는 업체 (택배, 우체국 등)
- **송장번호 (Tracking Number):** 배송 추적용 번호
- **배송상태 (Shipping Status):** 배송의 현재 단계 (배송준비, 배송중, 배송완료, 배송실패)
- **배송비 (Shipping Fee):** 배송에 드는 비용
- **배송예상일 (Estimated Delivery Date):** 상품이 도착할 예상 날짜
- **무료배송 (Free Shipping):** 배송비를 부담하지 않음

### 장바구니 (Cart)
**정의:** 구매 전 상품을 임시로 보관하는 공간
- **장바구니 수량:** 장바구니에 담은 상품의 개수
- **장바구니 총액 (Cart Total):** 장바구니에 담은 상품들의 합계 금액

### 리뷰 (Review)
**정의:** 상품을 구매한 고객이 남기는 평가 및 의견
- **평점 (Rating):** 상품에 대한 점수 (보통 1~5점)
- **평균평점 (Average Rating):** 전체 리뷰의 평균 점수
- **리뷰제목 (Review Title):** 리뷰의 간단한 제목
- **리뷰내용 (Review Content):** 리뷰의 상세 내용
- **도움도 (Helpfulness):** 다른 고객들이 리뷰가 도움이 되었다고 평가한 정도
- **검수 (Moderation):** 리뷰가 적절한지 확인하는 과정

### 반품/환불 (Return/Refund)
**정의:** 구매한 상품을 돌려주고 금액을 돌려받는 과정
- **반품 (Return):** 구매한 상품을 판매자에게 돌려줌
- **환불 (Refund):** 지불한 금액을 다시 돌려받음
- **반품사유 (Return Reason):** 왜 반품하는지의 이유
- **반품신청 (Return Request):** 고객이 반품 의사를 표현
- **반품승인 (Return Approval):** 판매자가 반품을 허용
- **환불액 (Refund Amount):** 돌려받을 금액
- **환불상태 (Refund Status):** 환불의 현재 단계 (신청, 승인, 거절, 완료)

---

## 2. 금융 용어

### 가격 관련
- **원가 (Cost):** 판매자의 상품 구입 가격
- **정가 (List Price):** 정해진 표준 가격
- **할인 (Discount):** 원래 가격보다 낮추기
- **할인율 (Discount Rate):** 할인의 비율 (%)
- **마진 (Margin):** 정가에서 원가를 뺀 이익
- **마진율 (Margin Rate):** 마진의 비율

### 주문 금액
- **상품금 (Product Amount):** 상품 가격의 합
- **배송비 (Shipping Fee):** 배송 비용
- **할인금 (Discount Amount):** 할인 금액
- **포인트 사용액 (Points Used):** 포인트로 차감한 금액
- **최종결제액 (Final Payment Amount):** 실제 지불해야 할 금액
- **총액 (Total Amount):** 모든 비용의 합

### 정산 (Settlement)
- **정산액 (Settlement Amount):** 판매자가 받을 금액
- **수수료 (Commission Fee):** 플랫폼이 가져가는 수수료
- **수수료율 (Commission Rate):** 수수료의 비율 (%) (보통 5~15%)
- **정산주기 (Settlement Cycle):** 정산이 이루어지는 기간 (주 1회, 월 1회 등)
- **정산계좌 (Settlement Account):** 정산금을 받을 은행 계좌

### 포인트/마일리지
- **포인트 (Points):** 구매 또는 활동으로 획득하는 가상 자산
- **포인트적립 (Points Earned):** 포인트를 얻음
- **포인트사용 (Points Used):** 포인트를 사용하여 할인
- **포인트환전 (Points Redemption):** 포인트를 현금으로 바꿈
- **포인트율 (Points Rate):** 구매 금액의 몇 %를 포인트로 주는지

---

## 3. 상태 및 프로세스 용어

### 주문 상태 변화 (Order Lifecycle)
```
결제대기 (Pending Payment)
├─ 결제완료 (Payment Completed)
│  ├─ 배송준비 (Preparing Shipment)
│  ├─ 배송중 (Shipping)
│  └─ 배송완료 (Delivered)
│     ├─ 반품신청 (Return Requested)
│     │  ├─ 반품승인 (Return Approved)
│     │  │  └─ 환불완료 (Refund Completed)
│     │  └─ 반품거절 (Return Rejected)
│     └─ 리뷰작성 가능
└─ 주문취소 (Order Cancelled)
   └─ 환불대기/환불완료 (Refunding/Refunded)
```

### 상품 상태 (Product Status)
- **판매중 (Active):** 정상적으로 판매 중
- **품절 (Out of Stock):** 재고가 없어 주문 불가 (상품은 노출)
- **판매중단 (Discontinued):** 판매자가 판매를 중단 (상품 노출 안 함)
- **삭제 (Deleted):** 관리자가 강제 삭제 (더 이상 조회 불가)

---

## 4. 비즈니스 용어

### 판매 지표
- **판매액 (Revenue):** 상품 판매로 얻은 금액
- **주문건수 (Order Count):** 주문이 이루어진 횟수
- **평균주문금액 (AOV - Average Order Value):** 주문 1건당 평균 금액
- **고객수 (Customer Count):** 구매한 고객의 수
- **전환율 (Conversion Rate):** (구매한 고객수 / 방문자수) × 100%
- **재방문율 (Return Rate):** 다시 방문한 고객의 비율
- **재구매율 (Repeat Purchase Rate):** 다시 구매한 고객의 비율

### 고객 분석
- **DAU (Daily Active Users):** 하루에 활동한 사용자 수
- **MAU (Monthly Active Users):** 한 달에 활동한 사용자 수
- **CAC (Customer Acquisition Cost):** 고객 1명을 확보하는 데 드는 비용
- **LTV (Life Time Value):** 고객이 평생 동안 가져다주는 수익
- **RFM (Recency, Frequency, Monetary):** 
  - Recency: 최근 구매일
  - Frequency: 구매 횟수
  - Monetary: 구매 금액
  - 고객 세분화에 사용

### 품질 지표
- **고객만족도 (Customer Satisfaction):** 고객의 만족 정도
- **순추천지수 (NPS - Net Promoter Score):** 고객이 추천할 확률
- **반품율 (Return Rate):** 반품이 이루어진 비율
- **교환율 (Exchange Rate):** 교환이 이루어진 비율
- **취소율 (Cancellation Rate):** 주문이 취소된 비율
- **클레임 (Claim):** 고객의 불만 또는 문제 제기

---

## 5. 마케팅 용어

### 프로모션
- **할인 (Discount):** 가격을 낮춤
- **쿠폰 (Coupon):** 특정 조건에서 할인을 받는 권리
- **번들 (Bundle):** 여러 상품을 함께 판매
- **프래시 세일 (Flash Sale):** 기간/수량 제한으로 판매
- **카테고리 세일 (Category Sale):** 특정 카테고리의 특가

### 광고
- **배너 (Banner):** 광고 이미지
- **프로모션배너:** 프로모션을 알리는 배너
- **CPA (Cost Per Action):** 클릭당 지불하는 비용

---

## 6. 기술 용어

### 데이터베이스
- **테이블 (Table):** 데이터를 행과 열로 정리한 구조
- **스키마 (Schema):** 데이터베이스의 구조 설계도
- **인덱싱 (Indexing):** 빠른 검색을 위한 색인 생성
- **쿼리 (Query):** 데이터베이스에서 정보를 요청하는 명령

### API
- **REST API:** 표준 HTTP 메서드(GET, POST, PUT, DELETE)를 사용하는 API
- **엔드포인트 (Endpoint):** API의 특정 기능에 접근하는 주소
- **요청 (Request):** 클라이언트가 서버에 보내는 데이터
- **응답 (Response):** 서버가 클라이언트에 보내는 데이터
- **에러코드 (Error Code):** 문제 상황을 나타내는 숫자
  - 2xx: 성공
  - 4xx: 클라이언트 오류
  - 5xx: 서버 오류

### 보안
- **해시 (Hash):** 비밀번호를 암호화하는 방식
- **토큰 (Token):** 사용자 인증용 문자열
- **HTTPS:** 암호화된 통신
- **SSL/TLS:** 암호화 프로토콜
- **2FA (Two-Factor Authentication):** 이중인증
- **CSRF (Cross-Site Request Forgery):** 사이트 간 요청 위조 공격
- **XSS (Cross-Site Scripting):** 악의적 스크립트 실행 공격

---

## 7. 운영 용어

### 배송 관련
- **예상배송일:** 상품이 도착할 예상 날짜
- **배송추적:** 배송 상태를 추적함
- **배송사 API:** 배송사의 배송 정보를 가져오는 인터페이스

### 고객 서비스
- **Q&A (Question & Answer):** 고객이 상품에 대해 질문하는 공간
- **채팅상담:** 실시간 채팅으로 고객 지원
- **이메일 지원:** 이메일로 고객 문의 처리
- **콜센터:** 전화로 고객 지원

### 관리
- **내용심사 (Content Moderation):** 부적절한 내용 검토 및 삭제
- **신고 (Report):** 부적절한 상품 또는 리뷰를 신고
- **제한 (Restriction):** 사용자 또는 상품에 대한 제약
- **강제삭제 (Force Delete):** 관리자가 강제로 삭제

---

## 8. 약자 정리

| 약자 | 정의 | 설명 |
|------|------|------|
| SKU | Stock Keeping Unit | 상품 고유번호 |
| PG | Payment Gateway | 결제 서비스 |
| AOV | Average Order Value | 평균주문금액 |
| CAC | Customer Acquisition Cost | 고객획득비용 |
| LTV | Life Time Value | 고객생평가치 |
| DAU | Daily Active Users | 일일활성사용자 |
| MAU | Monthly Active Users | 월간활성사용자 |
| NPS | Net Promoter Score | 순추천지수 |
| RFM | Recency, Frequency, Monetary | 고객분석지표 |
| API | Application Programming Interface | 응용프로그램인터페이스 |
| REST | Representational State Transfer | 웹 API 표준 |
| HTTPS | Hypertext Transfer Protocol Secure | 보안 통신 프로토콜 |
| SSL | Secure Sockets Layer | 보안 프로토콜 |
| TLS | Transport Layer Security | 보안 프로토콜 |
| 2FA | Two-Factor Authentication | 이중인증 |
| CSRF | Cross-Site Request Forgery | 사이트간요청위조 |
| XSS | Cross-Site Scripting | 크로스사이트스크립팅 |
| PCI DSS | Payment Card Industry Data Security Standard | 결제카드산업보안표준 |
| GDPR | General Data Protection Regulation | 개인정보보호규정 |
| UID | User ID | 사용자고유번호 |
| FAQ | Frequently Asked Questions | 자주묻는질문 |

---

## 다음 문서로 읽어야 할 것

1. **04_database_schema.md** - 데이터베이스 설계
2. **05_api_standard.md** - API 표준
3. **06_security_requirements.md** - 보안 요구사항
4. **07_spec_template.md** - 기획서 템플릿

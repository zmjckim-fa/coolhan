# POS 시스템 - 용어 정의 (POS System - Terminology)

## 1. 기본 엔티티 용어

### 거래 (Transaction)
**정의:** 고객의 상품 구매 전체 과정
- **거래ID (Transaction ID):** 거래의 고유 번호
- **거래번호 (Receipt Number):** 영수증에 인쇄되는 번호
- **거래액 (Transaction Amount):** 거래 총액
- **거래시간 (Transaction Time):** 거래가 발생한 시간
- **거래상태 (Transaction Status):** 완료, 취소, 반품 등
- **판매원 (Cashier):** 거래를 처리한 직원
- **계산대 (Register/Terminal):** 거래가 처리된 계산대 번호

### 상품 (Product)
**정의:** 판매하는 개별 물품
- **상품코드 (Product Code):** 상품의 고유 번호
- **바코드 (Barcode):** 상품의 표준 바코드
- **상품명 (Product Name):** 판매할 때 사용하는 이름
- **카테고리 (Category):** 상품의 분류
- **판매가 (Selling Price):** 고객이 지불하는 가격
- **원가 (Cost Price):** 상품을 구입한 비용
- **마진 (Margin):** 판매가 - 원가
- **마진율 (Margin Rate):** 마진 / 판매가 × 100%

### 재고 (Inventory)
**정의:** 판매하지 않은 상품의 수량
- **현재 재고 (Current Stock):** 지금 보유한 수량
- **시작 재고 (Beginning Inventory):** 기간 시작 시점의 재고
- **마감 재고 (Ending Inventory):** 기간 종료 시점의 재고
- **최소 재고 (Minimum Stock):** 발주 기준이 되는 수량
- **재고 부족 (Out of Stock):** 재고가 0인 상태
- **재고 오버 (Overstock):** 재고가 최대 수량을 초과

### 거래 항목 (Transaction Item)
**정의:** 거래에 포함된 개별 상품
- **수량 (Quantity):** 구매한 상품의 개수
- **단가 (Unit Price):** 상품 1개의 가격 (거래 당시)
- **소계 (Subtotal):** 수량 × 단가
- **할인액 (Discount Amount):** 적용된 할인 금액
- **세금 (Tax):** 해당 항목의 세금액
- **항목 합계 (Line Total):** 소계 - 할인 + 세금

---

## 2. 가격 관련 용어

### 기본 가격
- **정상가 (Regular Price):** 할인 전 원래 가격
- **할인가 (Discounted Price):** 할인을 적용한 가격
- **할인액 (Discount Amount):** 할인으로 차감되는 금액
- **할인율 (Discount Rate):** 할인의 비율 (%)
- **세전 가격 (Pre-tax Price):** 세금 제외 가격
- **세후 가격 (Post-tax Price):** 세금 포함 가격

### 거래 금액
- **소계 (Subtotal):** 모든 항목의 판매가 합
- **할인 합계 (Total Discount):** 모든 항목의 할인액 합
- **세금 합계 (Total Tax):** 모든 항목의 세금액 합
- **최종 결제액 (Final Amount):** 소계 - 할인 + 세금
- **지불액 (Payment Amount):** 고객이 지불한 금액
- **거스름돈 (Change):** 지불액 - 최종 결제액

### 할인 유형
- **정액 할인 (Fixed Discount):** 일정한 금액 할인
- **정률 할인 (Percentage Discount):** 일정한 비율 할인
- **조건부 할인 (Conditional Discount):** 특정 조건 충족 시 할인
- **회원 할인 (Member Discount):** 회원 등급에 따른 할인
- **상품 할인 (Product Discount):** 특정 상품의 특별 가격
- **프로모션 할인 (Promotional Discount):** 일시적 할인 이벤트
- **수량 할인 (Volume Discount):** 구매 수량에 따른 할인

---

## 3. 결제 관련 용어

### 결제 수단
- **결제수단 (Payment Method):** 결제 방법의 종류
- **현금 (Cash):** 지폐와 동전으로 지불
- **신용카드 (Credit Card):** 신용 기반 카드 결제
- **체크카드 (Debit Card):** 계좌 직불 카드
- **기프트 카드 (Gift Card):** 선불 카드
- **모바일 결제 (Mobile Payment):** 휴대폰으로 결제
- **포인트 (Points):** 적립된 포인트 사용

### 결제 처리
- **PG (Payment Gateway):** 결제를 중개하는 서비스
- **거래번호 (Transaction ID):** PG에서 발급한 거래 번호
- **승인번호 (Approval Number):** 카드 결제 승인 번호
- **결제 승인 (Payment Approval):** 결제 거래 승인
- **결제 거절 (Payment Declined):** 결제 거래 거절
- **결제 대기 (Payment Pending):** 결제 처리 중

### 현금 거래
- **거스름돈 (Change):** 지불액보다 초과된 금액
- **거스름돈 계산 (Change Calculation):** 거스름돈 금액 계산
- **지폐 (Banknote):** 현금 지폐
- **동전 (Coin):** 현금 동전
- **Float (시작 자금):** 영업 시작 시 계산대에 준비한 금액

---

## 4. 반품/환불 용어

### 반품 관련
- **반품 (Return):** 구매한 상품을 다시 가져오기
- **반품 신청 (Return Request):** 반품 의사 표현
- **반품 승인 (Return Approval):** 반품 허용
- **반품 거절 (Return Rejection):** 반품 거부
- **반품 사유 (Return Reason):** 반품하는 이유
- **반품율 (Return Rate):** 반품된 거래 / 전체 거래 비율

### 환불 관련
- **환불 (Refund):** 지불한 금액 돌려주기
- **환불액 (Refund Amount):** 돌려받을 금액
- **환불상태 (Refund Status):** 환불 처리 단계
- **환불 대기 (Refund Pending):** 환불 처리 중
- **환불 완료 (Refund Completed):** 환불 처리 완료

---

## 5. 세금 관련 용어

### 세금 기본
- **세율 (Tax Rate):** 세금의 비율 (%)
- **세금액 (Tax Amount):** 실제 세금 금액
- **세전 (Pre-tax):** 세금을 더하기 전
- **세후 (Post-tax):** 세금을 더한 후
- **세금 면제 (Tax Exempt):** 세금 없음
- **세금 포함 (Tax Included):** 세금이 포함됨
- **세금 별도 (Tax Separate):** 세금이 제외됨

### 세금 정산
- **세금 합계 (Tax Total):** 거래의 총 세금액
- **세율별 세금 (Tax by Rate):** 세율별로 분류된 세금
- **세금 신고 (Tax Filing):** 세무 당국에 신고

---

## 6. 재고 관련 용어

### 재고 변동
- **판매 (Sale):** 상품 판매로 인한 재고 감소
- **입고 (Inbound):** 새로운 상품 구매로 인한 재고 증가
- **반품 (Return):** 반품 상품 수령으로 인한 재고 증가
- **손실 (Loss):** 도난, 손상 등으로 인한 재고 감소
- **폐기 (Disposal):** 불량 상품 폐기로 인한 재고 감소
- **조정 (Adjustment):** 재고 수정 및 조정

### 재고 추적
- **재고 추적 (Inventory Tracking):** 재고 변동 기록
- **재고 일치 (Inventory Match):** 시스템 재고 = 실제 재고
- **재고 불일치 (Inventory Discrepancy):** 시스템 재고 ≠ 실제 재고
- **재고 실사 (Physical Inventory):** 실제 재고 확인

---

## 7. 마감/정산 용어

### 일일 마감
- **마감 (End of Day):** 영업 종료 시 정산
- **마감 시간 (Closing Time):** 정산하는 시간
- **마감 보고서 (Closing Report):** 일일 정산 결과
- **거래 종료 (Transaction Close):** 거래 처리 종료

### 정산 관련
- **정산 (Settlement):** 금액 확인 및 차입 정산
- **정산액 (Settlement Amount):** 정산해야 할 금액
- **정산 불일치 (Settlement Discrepancy):** 금액 차이
- **정산 완료 (Settlement Complete):** 정산 끝남

### 합계 계산
- **총 판매액 (Total Sales):** 일일 총 판매액
- **총 환불액 (Total Refunds):** 일일 총 환불액
- **순 판매액 (Net Sales):** 총 판매액 - 총 환불액
- **거래 건수 (Transaction Count):** 일일 거래 수
- **평균 거래액 (Average Transaction):** 거래 1건당 평균 금액

---

## 8. 사용자 관련 용어

### 역할
- **판매원 (Cashier):** 거래를 처리하는 직원
- **관리자 (Manager):** 점포를 관리하는 사람
- **관리 사용자 (Admin):** 시스템을 관리하는 사람
- **회원 (Member):** 등록된 고객

### 권한
- **권한 (Permission):** 기능 실행 권한
- **역할 (Role):** 사용자의 역할과 권한 집합
- **로그인 (Login):** 시스템 접근 인증
- **로그아웃 (Logout):** 시스템 접근 종료

---

## 9. 보고 관련 용어

### 대시보드
- **실시간 판매 (Live Sales):** 현재 판매 진행 상황
- **판매액 (Revenue):** 판매로 얻은 금액
- **거래 건수 (Transaction Count):** 거래한 횟수
- **상품별 판매 (Product Sales):** 상품별 판매 현황

### 보고서
- **일일 보고서 (Daily Report):** 하루 정산 결과
- **주간 보고서 (Weekly Report):** 주간 판매 현황
- **월간 보고서 (Monthly Report):** 월간 판매 현황
- **판매원별 보고서 (Cashier Report):** 판매원별 실적
- **상품별 보고서 (Product Report):** 상품별 판매량
- **카테고리별 보고서 (Category Report):** 카테고리별 판매액

### 분석 지표
- **판매액 (Sales Amount):** 상품 판매액
- **판매 건수 (Sales Count):** 판매 거래 건수
- **환불액 (Refund Amount):** 환불한 금액
- **환불 건수 (Refund Count):** 환불 거래 건수
- **마진 (Profit Margin):** 판매가 - 원가
- **회전율 (Turnover Rate):** 재고가 팔리는 속도

---

## 10. 시스템 용어

### 운영
- **온라인 (Online):** 시스템이 작동 중
- **오프라인 (Offline):** 시스템이 작동 중단 (로컬 모드)
- **동기화 (Synchronization):** 서버와 로컬 데이터 일치
- **백업 (Backup):** 데이터 복사본 생성

### 보안
- **로그 (Log):** 시스템 활동 기록
- **감시 (Audit Trail):** 감시 추적 기록
- **권한 확인 (Authorization):** 권한 여부 확인
- **암호화 (Encryption):** 데이터 암호화

---

## 11. 약자 정리

| 약자 | 정의 | 설명 |
|------|------|------|
| POS | Point of Sale | 판매 지점 시스템 |
| PG | Payment Gateway | 결제 중개 서비스 |
| SKU | Stock Keeping Unit | 상품 고유번호 |
| ATV | Average Transaction Value | 평균 거래액 |
| RMA | Return Merchandise Authorization | 반품 승인 번호 |
| GST | Goods and Services Tax | 부가가치세 |
| VAT | Value Added Tax | 부가가치세 |
| EFT | Electronic Funds Transfer | 전자 송금 |
| EMV | Europay, Mastercard, Visa | 카드 칩 표준 |
| PIN | Personal Identification Number | 개인 식별 번호 |

---

## 12. 시나리오 예시 용어 사용

### 예시 1: 일반 거래
```
판매원: "거래 시작합니다"
고객: [상품 제시]
판매원: [바코드 스캔] "상품명: OOO, 판매가: 10,000원"
고객: "회원입니다"
판매원: [회원 할인 자동 적용] "회원 할인 10% 적용. 최종 결제액: 9,900원입니다"
고객: [신용카드 제시]
판매원: [카드 결제] "결제 완료. 거래번호: ABC123"
판매원: "영수증입니다. 감사합니다"
```

### 예시 2: 반품 거래
```
고객: "이 상품 반품하고 싶습니다"
판매원: "영수증 있으신가요?"
고객: [영수증 제시]
판매원: [거래 조회] "알겠습니다. 반품액은 9,900원입니다"
고객: "현금으로 환불해주세요"
판매원: [현금 환불 처리] "반품이 완료되었습니다"
```

### 예시 3: 일일 마감
```
관리자: "마감을 시작하겠습니다"
시스템: [거래 합계 계산]
- 총 판매액: 500,000원
- 총 환불액: 50,000원
- 순 판매액: 450,000원
- 거래 건수: 120건
- 평균 거래액: 4,166원

관리자: [금전 정산]
- 시작 자금: 50,000원
- 현금 판매: 200,000원
- 현금 환불: 20,000원
- 예상 금액: 230,000원
- 실제 금액: 230,000원 ✓

시스템: "일일 마감이 완료되었습니다"
```

---

이 용어들은 POS 시스템 관련자들이 공통으로 사용할 표준 용어입니다.

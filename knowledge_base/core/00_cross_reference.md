# Core KB 크로스 레퍼런스 (Cross-Reference Index)

**버전:** 1.0.0 | **작성일:** 2026-06-13 | **상태:** ACTIVE

---

## 개요

`core/` 디렉토리는 특정 비즈니스 패턴(쇼핑몰, 마켓플레이스, 구매대행 등)의 조합 규칙을 정의한다.
도메인 모듈(01~11)이 "기능 단위"라면, Core 문서는 "이 패턴에선 어떤 모듈을 어떤 규칙으로 조합하는가"를 담는다.

---

## Core 문서 목록

| 파일 | 패턴 | 포함 도메인 모듈 | 주요 솔루션 타입 |
|------|------|---------------|--------------|
| [`shopping_mall_core.md`](shopping_mall_core.md) | B2C 이커머스 (단일 판매자) | 01+02+03+04+06+07+08+09+10 | WEB, MOBILE |
| [`marketplace_core.md`](marketplace_core.md) | B2C 마켓플레이스 (다중 판매자) | 01+02+03+04+05+06+07+08+09+10 | WEB, MOBILE |
| [`purchase_agency_core.md`](purchase_agency_core.md) | 구매대행 (해외직구/B2B 에이전시) | 01+02+03+04+05+06+08+09+10+11 | WEB |

---

## Core vs 도메인 모듈 관계

```
도메인 모듈 (What)           Core 문서 (How to Combine)
┌──────────────────┐         ┌──────────────────────────────┐
│ 01_member_system │─────────┤ shopping_mall_core.md        │
│ 02_shopping_mall │─────────┤  → 단일 판매자 + 직접 결제   │
│ 03_payment_system│─────────┤  → 택배 중심 배송            │
│ ...              │         │  → 리뷰 필수                 │
└──────────────────┘         └──────────────────────────────┘

                              ┌──────────────────────────────┐
                              │ marketplace_core.md          │
                              │  → 다중 판매자 정산          │
                              │  → 에스크로 결제             │
                              │  → 판매자 온보딩 플로우      │
                              └──────────────────────────────┘
```

---

## Core 문서 선택 가이드

```
Q1: 판매자가 몇 명인가?
  → 1명 (자사 운영): shopping_mall_core.md
  → 다수 (입점 셀러): marketplace_core.md

Q2: 해외 또는 B2B 에이전시인가?
  → 해외직구/구매대행: purchase_agency_core.md

Q3: 해당 Core 없음?
  → 도메인 모듈 직접 조합 + 00_core_module_mapping.md 참조
```

---

## 솔루션 타입 KB와의 연결

Core 문서는 비즈니스 패턴을 정의하고, 솔루션 타입 KB는 플랫폼 구현을 정의한다.
두 문서를 함께 참조하여 완전한 규격을 생성한다.

| Core 문서 | + | 솔루션 타입 KB | = | 프로젝트 규격 |
|----------|---|--------------|---|-------------|
| shopping_mall_core.md | + | WEB/01_ecommerce_mall/ | = | 웹 쇼핑몰 규격 |
| shopping_mall_core.md | + | MOBILE/01_ios_app/ | = | iOS 쇼핑 앱 규격 |
| shopping_mall_core.md | + | MOBILE/02_android_app/ | = | Android 쇼핑 앱 규격 |
| marketplace_core.md | + | WEB/01_ecommerce_mall/ | = | 웹 마켓플레이스 규격 |
| purchase_agency_core.md | + | WEB/01_ecommerce_mall/ | = | 구매대행 웹 규격 |

---

## 신규 Core 문서 추가 기준

1. **새로운 비즈니스 패턴**이 도메인 모듈 조합만으로 표현이 어려울 때
2. **동일 모듈 조합**이지만 핵심 비즈니스 규칙이 전혀 다를 때 (예: 구독 vs 단건 결제)
3. **3개 이상의 프로젝트**에서 동일 패턴이 반복될 때

신규 Core 문서는 `shopping_mall_core.md`와 동일한 구조를 따른다:
- Executive Summary
- 기본 포함 기능 (Non-Negotiable)
- 선택적 기능 (Optional)
- 제외 기능 (Out of Scope)
- 도메인 모듈 의존성 테이블
- 핵심 비즈니스 규칙

---

**참조:**
- [`../00_core_module_mapping.md`](../00_core_module_mapping.md) — 전체 모듈 매핑
- [`../00_DOMAIN_MODULES_INDEX.md`](../00_DOMAIN_MODULES_INDEX.md) — 도메인 모듈 목록
- [`../00_KNOWLEDGE_BASE_EXTENSIBILITY.md`](../00_KNOWLEDGE_BASE_EXTENSIBILITY.md) — KB 확장 규칙

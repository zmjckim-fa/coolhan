# 매개변수화된 기획서 시스템 (Parameterized Specification System)

## 개요 (Overview)

전통적인 고정된 템플릿 방식의 기획서는 보안 취약점을 초래한다. 모든 개발 결과물이 동일한 구조, 명명 규칙, 로직 흐름을 가지면 패턴 인식 공격에 노출된다.

본 시스템은 **인간 개발자가 초기에 매개변수를 정의한 후, 이를 토대로 기획서가 생성되는 구조**로 설계되었다.

---

## 핵심 원칙 (Core Principles)

### 보안을 위한 다양성 (Diversity for Security)
- 모든 프로젝트의 데이터베이스 이름이 다르다
- 테이블 명명 규칙이 프로젝트마다 다르다
- 컬럼명 패턴이 다르다
- 비즈니스 로직 흐름이 구조적으로 달라진다
- API 엔드포인트 구조가 다르다

### 논리적 일관성 (Logical Consistency)
- 기본 비즈니스 로직은 변하지 않는다 (예: POS의 거래 처리 프로세스)
- 단, 구현 세부사항(naming, flow variations)은 모두 다르다
- 함수명, 변수명, 데이터베이스 구조는 완전히 다르다

### 규정 준수 (Compliance)
- 선택된 솔루션 타입의 기본 지식 라이브러리(01_basic_logic ~ 07_spec_template)를 따른다
- 모든 매개변수는 보안 및 법규 요구사항을 충족해야 한다

---

## 1. 매개변수 정의 스키마 (Parameterization Schema)

### 1.1 필수 매개변수 (Required Parameters)

모든 프로젝트는 기획서 생성 전에 다음을 정의해야 한다:

#### A. 데이터베이스 명명 규칙 (Database Naming Conventions)

```yaml
database_naming:
  # 데이터베이스 이름 규칙
  db_name_pattern: "[선택: snake_case|camelCase|PascalCase]"
  db_name_prefix: "[선택적 접두사, 예: 'app_', 'store_', '']"
  db_name_suffix: "[선택적 접미사, 예: '_db', '_data', '']"
  example: "pos_sales_db | ecom_platform | inventory_system"
  
  # 테이블 명명 규칙
  table_naming:
    pattern: "[단수형|복수형]"
    style: "[선택: snake_case|camelCase|PascalCase]"
    prefix: "[선택적, 예: 'tbl_', 'T_', '']"
    examples: "user|users, product|products, transaction|transactions"
    
  # 컬럼 명명 규칙
  column_naming:
    pattern: "[snake_case|camelCase]"
    pk_convention: "[id|entity_id|pk|primary_key]"
    fk_convention: "[entity_id|entity_fk|fk_entity]"
    timestamp_convention: "[created_at|created_ts|created_date]"
    boolean_prefix: "[is_|has_|can_|should_]"
    status_prefix: "[status_|state_|_status]"
    examples: 
      - snake_case: "user_id, product_name, is_active, created_at"
      - camelCase: "userId, productName, isActive, createdAt"
```

#### B. 테이블 구조 변형 (Table Structure Variations)

```yaml
table_structure_variation:
  # 추가 필드 옵션
  include_soft_delete: "[true|false]"  # deleted_at 또는 is_deleted
  include_audit_fields: "[true|false]" # created_by, updated_by, updated_at
  include_versioning: "[true|false]"   # version 필드
  
  # 데이터 타입 선호도
  string_length_defaults:
    short: "[50|100|128]"     # 이름, 코드
    medium: "[255|500]"       # 설명
    long: "[1000|5000|65535]" # 상세 내용
    
  # 시간 저장 방식
  timestamp_format: "[UTC_datetime|Unix_timestamp|datetime_with_timezone]"
  
  # 상태 관리 방식
  status_implementation:
    - "enum: [draft, active, inactive, deleted]"
    - "tinyint: 0=draft, 1=active, 2=inactive, 3=deleted"
    - "varchar: 'DRAFT', 'ACTIVE', 'INACTIVE', 'DELETED'"
```

#### C. API 엔드포인트 구조 (API Endpoint Variations)

```yaml
api_endpoint_variation:
  # 버전 관리 방식
  api_versioning:
    - "URL 경로: /api/v1/, /api/v2/"
    - "헤더: Accept-Version: 1.0"
    - "없음: 버전 없이"
  
  # 엔드포인트 명명
  resource_naming: "[복수형|단수형]"  # /products vs /product
  
  # 추가 경로 구조
  nested_resource_style:
    - "RESTful: /users/{id}/orders/{id}"
    - "Flat: /orders?user_id={id}"
    - "GraphQL: 단일 엔드포인트"
  
  # 응답 구조 변형
  response_wrapper:
    - "wrapped: {data: {...}, meta: {...}}"
    - "flat: {...}, directly"
    - "envelope: {success: true, payload: {...}}"
  
  # 페이지네이션 방식
  pagination_style:
    - "offset/limit: ?offset=0&limit=20"
    - "page/size: ?page=1&size=20"
    - "cursor: ?cursor=abc123&limit=20"
```

#### D. 비즈니스 로직 흐름 변형 (Business Logic Flow Variations)

```yaml
business_logic_variation:
  # 거래 처리 파이프라인
  transaction_flow:
    - "Linear: 입력 → 검증 → 처리 → 저장 → 응답"
    - "Event-driven: 입력 → 이벤트 발행 → 리스너 처리"
    - "State machine: 상태 전이 기반"
  
  # 재고 관리 방식
  inventory_tracking:
    - "Real-time: 매 거래 즉시 업데이트"
    - "Batch: 매 시간/일 배치 작업"
    - "Event-sourced: 모든 변경사항 기록"
  
  # 환불 프로세스
  refund_process:
    - "Immediate: 즉시 환불 처리"
    - "Approval: 승인 후 환불"
    - "Scheduled: 특정 시간에 환불"
  
  # 할인 적용 방식
  discount_application:
    - "Eager: 거래 생성 시점에 즉시 적용"
    - "Lazy: 결제 시점에 적용"
    - "Post-purchase: 거래 완료 후 적용"
```

#### E. 보안 및 규정 매개변수 (Security & Compliance Parameters)

```yaml
security_parameters:
  # 암호화 알고리즘 선택
  password_hashing:
    - "bcrypt"
    - "scrypt"
    - "PBKDF2"
    - "Argon2"
  
  # 암호화 수준
  encryption_level:
    - "sensitive: AES-256-GCM"
    - "standard: AES-128-GCM"
    - "logging: Plain (no encryption)"
  
  # 토큰 방식
  authentication_method:
    - "JWT: Bearer token"
    - "Session: Cookie-based"
    - "OAuth: Third-party"
    - "mTLS: Certificate-based"
  
  # 규정 준수
  compliance_requirements:
    - "GDPR"
    - "CCPA"
    - "PIPA (한국)"
    - "PCI-DSS"
```

---

## 2. 솔루션 타입별 필수 기획서 (Solution Type-Specific Required Specifications)

### 2.1 매핑 규칙 (Mapping Rules)

```
솔루션 타입 선택 → 기본 지식 라이브러리 결정 (01_basic_logic ~ 07_spec_template)
           → 필수 기획서 문서 자동 결정
           → 매개변수 스키마 적용
           → 기획서 생성
```

### 2.2 솔루션 타입별 기획서 종류 (Specification Types by Solution Type)

#### Web Solutions (웹 솔루션)

**E-Commerce Mall (쇼핑몰)**
- 필수: 01_basic_logic, 02_core_features, 03_terminology, 04_database_schema, 05_api_standard, 06_security_requirements, 07_spec_template
- 추가 필수: 08_payment_integration_spec (PG 연동 상세)
- 총 18개 /docs/ 문서 모두 생성

**Enterprise ERP System**
- 필수: 01_basic_logic, 02_core_features, 03_terminology, 04_database_schema, 05_api_standard, 06_security_requirements
- 추가 필수: 08_module_integration_spec (모듈간 연동)
- 추가 필수: 09_reporting_spec (보고서 정의)
- 추가 필수: 10_sso_spec (SSO 연동)
- 총 13개 문서 생성 (보안/권한/보고가 더 중요)

**Point of Sale (POS) System**
- 필수: 01_basic_logic, 02_core_features, 03_terminology, 04_database_schema, 05_api_standard, 06_security_requirements
- 추가 필수: 08_terminal_offline_spec (오프라인 모드)
- 추가 필수: 09_hardware_integration_spec (하드웨어 연동)
- 총 9개 문서 생성 (오프라인/하드웨어가 중요)

**Blog/CMS Platform**
- 필수: 01_basic_logic, 02_core_features, 03_terminology, 04_database_schema
- 추가 필수: 05_content_management_spec (콘텐츠 관리)
- 총 5개 문서 생성 (데이터베이스 구조 단순)

#### Mobile Solutions (모바일)

**iOS App (기본 구조)**
- 필수: 01_basic_logic, 02_core_features
- 추가 필수: 03_ios_ui_components_spec
- 추가 필수: 04_ios_permissions_spec
- 추가 필수: 05_ios_storage_spec
- 총 5개 문서 생성

**Android App (기본 구조)**
- 필수: 01_basic_logic, 02_core_features
- 추가 필수: 03_android_ui_components_spec
- 추가 필수: 04_android_permissions_spec
- 추가 필수: 05_android_storage_spec
- 총 5개 문서 생성

#### Desktop Solutions (데스크톱)

**Windows Desktop App**
- 필수: 01_basic_logic, 02_core_features
- 추가 필수: 03_windows_ui_spec
- 추가 필수: 04_windows_registry_spec
- 총 4개 문서 생성

---

## 3. 기획서 생성 프로세스 (Specification Generation Process)

### 3.1 단계별 흐름 (Step-by-Step Flow)

```
단계 1: 솔루션 타입 선택
  - 사용자: 196개 솔루션 중 선택
  - 시스템: 해당 솔루션의 기본 지식 라이브러리 로드

단계 2: 매개변수 입력 (Parameterization Phase)
  - 사용자: 다음을 정의
    ✓ 데이터베이스 명명 규칙
    ✓ 테이블 구조 변형 옵션
    ✓ API 엔드포인트 구조
    ✓ 비즈니스 로직 흐름 선택
    ✓ 보안 매개변수
  
  - 시스템: 입력값 검증
    ✓ 보안 요구사항 확인
    ✓ 호환성 검증

단계 3: 프로젝트 메타데이터 입력
  - 프로젝트명
  - 프로젝트 설명
  - 대상 고객
  - 예상 규모
  - 론칭 일정

단계 4: 기획서 생성
  - 시스템: 선택된 솔루션 타입의 필수 문서 생성
  - 각 문서에 Step 2의 매개변수 적용
  - 프로젝트별 고유한 기획서 세트 생성

단계 5: 생성물 검증
  - 기획서 간 일관성 검증
  - 매개변수 적용 완료도 확인
  - 보안 체크리스트 생성

단계 6: 개발 팀 인계
  - 생성된 기획서 패키지 제공
  - 매개변수 설정 문서 제공
  - 개발 환경 자동 구성
```

### 3.2 매개변수 적용 예시 (Example: POS System)

```
입력: POS System (SMB/02_pos_system)
     - database_naming: snake_case, prefix "store_"
     - table_naming: 단수형, prefix "tbl_"
     - api_versioning: /api/v1/
     - transaction_flow: Event-driven
     - encryption: AES-256-GCM

생성 결과 #1:
     데이터베이스: store_pos_db
     테이블: tbl_transaction, tbl_product, tbl_inventory
     API: /api/v1/transactions (POST), /api/v1/products (GET)
     이벤트: TransactionCreatedEvent, ProductSoldEvent

생성 결과 #2 (다른 개발자):
입력: 동일한 POS System이지만
     - database_naming: PascalCase, prefix "POS_"
     - table_naming: 복수형, prefix "T_"
     - api_versioning: /api/v2/
     - transaction_flow: State machine
     - encryption: Argon2

생성 결과:
     데이터베이스: POS_SalesDB
     테이블: T_Transactions, T_Products, T_Inventories
     API: /api/v2/sales (POST), /api/v2/catalog (GET)
     상태머신: PendingTransaction → ApprovedTransaction → CompletedTransaction

→ 동일한 기본 로직, 완전히 다른 구현 결과
→ 패턴 기반 공격 불가능
```

---

## 4. 기획서 문서 템플릿 재정의 (Redefined Specification Document Templates)

### 4.1 기본 원칙 (Base Principles)

모든 기획서 템플릿은 다음을 포함해야 한다:

```yaml
매개변수_참조_섹션:
  - 해당 기획서에 영향을 미친 매개변수
  - 대안적 구현 방식 (선택한 것과 선택하지 않은 것)
  - 왜 이 선택을 했는가? (의사결정 근거)

예시:
  document: "04_database_schema"
  affected_parameters:
    - database_naming: "snake_case, prefix 'store_'"
    - table_structure_variation: "soft_delete=true, audit_fields=true"
  alternative_not_chosen:
    - table_naming: "복수형 대신 단수형 선택"
    - timestamp_format: "Unix_timestamp 대신 UTC_datetime 선택"
  decision_rationale:
    - "감시(Audit)가 중요하므로 audit_fields 포함"
    - "삭제 이력 보존이 법규 요구사항이므로 soft_delete"
```

### 4.2 기획서별 매개변수 적용 방식 (Parameter Application per Document)

#### 01_basic_logic
- **변수**: 비즈니스 로직 흐름 선택이 전체 구조에 반영
- **예**: Linear vs Event-driven → 프로세스 다이어그램, 데이터 흐름이 달라짐

#### 02_core_features
- **변수**: 각 기능이 비즈니스 로직 흐름을 따르도록 재작성
- **예**: Transaction Flow가 Event-driven이면, 각 기능이 이벤트 기반으로 설명

#### 03_terminology
- **변수**: 솔루션 타입에 따라 용어 자체가 다름
- **예**: ERP vs POS → 용어집이 다름 (예: "거래" vs "문서")

#### 04_database_schema
- **변수**: 모든 매개변수가 적용됨
  - 데이터베이스명, 테이블명, 컬럼명 패턴 모두 적용
  - 테이블 구조 변형 (soft delete, audit fields) 적용
  - 상태 구현 방식 선택 적용

#### 05_api_standard
- **변수**: API 엔드포인트 구조, 응답 형식, 페이지네이션
  - 버전 관리 방식 적용
  - 리소스 명명 (단수/복수) 적용
  - 응답 래퍼 방식 적용

#### 06_security_requirements
- **변수**: 보안 매개변수
  - 암호화 알고리즘 선택
  - 인증 방식 선택
  - 규정 준수 항목 선택

#### 07_spec_template
- **변수**: 모든 매개변수 참조 문서
- **목적**: 개발 팀이 왜 이 선택을 했는지 이해

---

## 5. 솔루션 타입별 매개변수 프로필 (Solution Type Parameter Profiles)

### 5.1 프로필 정의 (Profile Definition)

각 솔루션 타입은 **기본 매개변수 프로필**을 가질 수 있다. 개발자는 이를 사용하거나 수정할 수 있다.

```yaml
솔루션_타입: "E-Commerce Mall"

기본_프로필:
  database_naming:
    pattern: "snake_case"
    prefix: "ecom_"
    
  api_endpoint_variation:
    versioning: "URL path (/api/v1/)"
    resource_naming: "복수형"
    response_wrapper: "wrapped"
    
  business_logic_variation:
    transaction_flow: "Linear"
    inventory_tracking: "Real-time"
    discount_application: "Eager"
    
  security_parameters:
    password_hashing: "bcrypt"
    encryption_level: "sensitive (AES-256-GCM)"
    authentication_method: "JWT"
    compliance_requirements: ["GDPR", "PCI-DSS"]

개발자_선택:
  ✓ 기본 프로필 사용
  ✓ 프로필 수정
  ✓ 처음부터 직접 정의
```

---

## 6. 보안 검증 (Security Validation)

### 6.1 매개변수 검증 규칙 (Parameter Validation Rules)

```
규칙 1: 명명 규칙 일관성
  - 같은 프로젝트 내에서 혼용 불가 (snake_case와 camelCase 동시 사용 금지)
  
규칙 2: 보안 기본값
  - password_hashing: 최소 bcrypt 이상 (plaintext 절대 불가)
  - encryption_level: 최소 "standard" 이상
  
규칙 3: 규정 준수
  - 금융 시스템: PCI-DSS 필수
  - 개인정보 처리: GDPR 또는 PIPA 필수
  
규칙 4: 최소 다양성 요구
  - 같은 팀 내 2개 프로젝트 이상의 경우, 명명 규칙 최소 1가지 차이 필요
  - 데이터베이스명, 테이블명, API 구조 중 최소 2개 이상 다르게
```

---

## 7. 개발 환경 자동 구성 (Automated Development Environment Setup)

기획서 생성 후, 개발 환경이 자동으로 구성된다:

```
생성 단계:
1. Git 저장소 구조
   /database
     /migrations  (선택된 명명 규칙으로 생성)
     /schema.sql
   /api
     /routes      (선택된 엔드포인트 구조로 생성)
   /models        (선택된 테이블명 매핑)
   
2. 설정 파일
   /.env.example (데이터베이스 명, 테이블 접두사 등)
   /config.js    (API 버전, 응답 형식 등)
   
3. 개발 템플릿
   /src/models/[Entity].js    (생성된 매개변수 반영)
   /src/routes/[endpoint].js  (생성된 API 구조 반영)
   
4. 문서 생성물
   /docs/PARAMETERS.md        (선택한 모든 매개변수 명시)
   /docs/WHY_THESE_CHOICES.md (의사결정 근거)
   /docs/MAINTENANCE.md       (유지보수 가이드)
```

---

## 8. 향후 확장 (Future Extensions)

### 8.1 머신러닝 기반 최적화 (ML-Based Optimization)

```
단계 1: 매개변수 조합 분석
  - 어떤 매개변수 조합이 자주 함께 선택되는가?
  - 프로젝트 규모별 최적 매개변수는?
  
단계 2: 자동 추천 (Auto-Recommendation)
  - 사용자: "쇼핑몰" 선택
  - 시스템: "유사한 성공 프로젝트의 매개변수 추천"
  
단계 3: 성능 최적화
  - 실제 개발 성능 데이터 수집
  - 어떤 매개변수 조합이 버그 율이 낮은가?
  - 개발 속도가 빠른가?
```

### 8.2 보안 통계 분석 (Security Analytics)

```
추적 항목:
  - 매개변수 다양성 지수 (Parameter Diversity Index)
  - 보안 설정 준수율
  - 실제 보안 사건과 매개변수 관계 분석
```

---

## 결론 (Conclusion)

이 시스템은 다음을 보장한다:

1. **보안**: 모든 프로젝트가 구조적으로 다르므로 패턴 기반 공격 불가능
2. **일관성**: 동일한 기본 비즈니스 로직 유지
3. **유연성**: 개발자가 자신의 선호도 반영 가능
4. **추적 가능성**: 모든 의사결정이 기록되어 있음
5. **유지보수성**: 왜 이렇게 했는지 명확히 문서화됨

---

**버전**: 1.0
**작성일**: 2026-05-27
**상태**: 초안 - 팀 피드백 대기

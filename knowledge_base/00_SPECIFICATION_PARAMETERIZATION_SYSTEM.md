# Parameterized Specification System

## Overview

Traditional fixed-template specifications introduce security vulnerabilities. When every development deliverable shares the same structure, naming conventions, and logic flows, it becomes exposed to pattern-recognition attacks.

This system is designed so that **a human developer defines parameters up front, and specifications are then generated based on those parameters**.

---

## Core Principles

### Diversity for Security
- Every project's database name differs
- Table naming conventions differ from project to project
- Column naming patterns differ
- Business logic flows differ structurally
- API endpoint structures differ

### Logical Consistency
- The underlying business logic does not change (e.g., the transaction-processing flow of a POS)
- However, implementation details (naming, flow variations) all differ
- Function names, variable names, and database structures are completely different

### Compliance
- Follows the base knowledge library (01_basic_logic ~ 07_spec_template) of the selected solution type
- Every parameter must satisfy security and regulatory requirements

---

## 1. Parameterization Schema

### 1.1 Required Parameters

Every project must define the following before specification generation:

#### A. Database Naming Conventions

```yaml
database_naming:
  # Database name rules
  db_name_pattern: "[choice: snake_case|camelCase|PascalCase]"
  db_name_prefix: "[optional prefix, e.g., 'app_', 'store_', '']"
  db_name_suffix: "[optional suffix, e.g., '_db', '_data', '']"
  example: "pos_sales_db | ecom_platform | inventory_system"
  
  # Table naming rules
  table_naming:
    pattern: "[singular|plural]"
    style: "[choice: snake_case|camelCase|PascalCase]"
    prefix: "[optional, e.g., 'tbl_', 'T_', '']"
    examples: "user|users, product|products, transaction|transactions"
    
  # Column naming rules
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

#### B. Table Structure Variations

```yaml
table_structure_variation:
  # Additional field options
  include_soft_delete: "[true|false]"  # deleted_at or is_deleted
  include_audit_fields: "[true|false]" # created_by, updated_by, updated_at
  include_versioning: "[true|false]"   # version field
  
  # Data type preferences
  string_length_defaults:
    short: "[50|100|128]"     # names, codes
    medium: "[255|500]"       # descriptions
    long: "[1000|5000|65535]" # detailed content
    
  # Time storage method
  timestamp_format: "[UTC_datetime|Unix_timestamp|datetime_with_timezone]"
  
  # Status management method
  status_implementation:
    - "enum: [draft, active, inactive, deleted]"
    - "tinyint: 0=draft, 1=active, 2=inactive, 3=deleted"
    - "varchar: 'DRAFT', 'ACTIVE', 'INACTIVE', 'DELETED'"
```

#### C. API Endpoint Variations

```yaml
api_endpoint_variation:
  # Versioning method
  api_versioning:
    - "URL path: /api/v1/, /api/v2/"
    - "Header: Accept-Version: 1.0"
    - "None: no versioning"
  
  # Endpoint naming
  resource_naming: "[plural|singular]"  # /products vs /product
  
  # Additional path structure
  nested_resource_style:
    - "RESTful: /users/{id}/orders/{id}"
    - "Flat: /orders?user_id={id}"
    - "GraphQL: single endpoint"
  
  # Response structure variations
  response_wrapper:
    - "wrapped: {data: {...}, meta: {...}}"
    - "flat: {...}, directly"
    - "envelope: {success: true, payload: {...}}"
  
  # Pagination method
  pagination_style:
    - "offset/limit: ?offset=0&limit=20"
    - "page/size: ?page=1&size=20"
    - "cursor: ?cursor=abc123&limit=20"
```

#### D. Business Logic Flow Variations

```yaml
business_logic_variation:
  # Transaction processing pipeline
  transaction_flow:
    - "Linear: input → validate → process → store → respond"
    - "Event-driven: input → publish event → listener processing"
    - "State machine: based on state transitions"
  
  # Inventory management method
  inventory_tracking:
    - "Real-time: update immediately on each transaction"
    - "Batch: hourly/daily batch jobs"
    - "Event-sourced: record all changes"
  
  # Refund process
  refund_process:
    - "Immediate: process refund immediately"
    - "Approval: refund after approval"
    - "Scheduled: refund at a specific time"
  
  # Discount application method
  discount_application:
    - "Eager: applied immediately at transaction creation"
    - "Lazy: applied at payment time"
    - "Post-purchase: applied after transaction completion"
```

#### E. Security & Compliance Parameters

```yaml
security_parameters:
  # Encryption algorithm choice
  password_hashing:
    - "bcrypt"
    - "scrypt"
    - "PBKDF2"
    - "Argon2"
  
  # Encryption level
  encryption_level:
    - "sensitive: AES-256-GCM"
    - "standard: AES-128-GCM"
    - "logging: Plain (no encryption)"
  
  # Token method
  authentication_method:
    - "JWT: Bearer token"
    - "Session: Cookie-based"
    - "OAuth: Third-party"
    - "mTLS: Certificate-based"
  
  # Compliance
  compliance_requirements:
    - "GDPR"
    - "CCPA"
    - "PIPA (Korea)"
    - "PCI-DSS"
```

---

## 2. Solution Type-Specific Required Specifications

### 2.1 Mapping Rules

```
Select solution type → determine base knowledge library (01_basic_logic ~ 07_spec_template)
           → automatically determine required specification documents
           → apply parameter schema
           → generate specifications
```

### 2.2 Specification Types by Solution Type

#### Web Solutions

**E-Commerce Mall**
- Required: 01_basic_logic, 02_core_features, 03_terminology, 04_database_schema, 05_api_standard, 06_security_requirements, 07_spec_template
- Additional required: 08_payment_integration_spec (PG integration details)
- Generates all 18 /docs/ documents

**Enterprise ERP System**
- Required: 01_basic_logic, 02_core_features, 03_terminology, 04_database_schema, 05_api_standard, 06_security_requirements
- Additional required: 08_module_integration_spec (inter-module integration)
- Additional required: 09_reporting_spec (report definitions)
- Additional required: 10_sso_spec (SSO integration)
- Generates 13 documents (security/permissions/reporting are more important)

**Point of Sale (POS) System**
- Required: 01_basic_logic, 02_core_features, 03_terminology, 04_database_schema, 05_api_standard, 06_security_requirements
- Additional required: 08_terminal_offline_spec (offline mode)
- Additional required: 09_hardware_integration_spec (hardware integration)
- Generates 9 documents (offline/hardware are important)

**Blog/CMS Platform**
- Required: 01_basic_logic, 02_core_features, 03_terminology, 04_database_schema
- Additional required: 05_content_management_spec (content management)
- Generates 5 documents (database structure is simple)

#### Mobile Solutions

**iOS App (base structure)**
- Required: 01_basic_logic, 02_core_features
- Additional required: 03_ios_ui_components_spec
- Additional required: 04_ios_permissions_spec
- Additional required: 05_ios_storage_spec
- Generates 5 documents

**Android App (base structure)**
- Required: 01_basic_logic, 02_core_features
- Additional required: 03_android_ui_components_spec
- Additional required: 04_android_permissions_spec
- Additional required: 05_android_storage_spec
- Generates 5 documents

#### Desktop Solutions

**Windows Desktop App**
- Required: 01_basic_logic, 02_core_features
- Additional required: 03_windows_ui_spec
- Additional required: 04_windows_registry_spec
- Generates 4 documents

---

## 3. Specification Generation Process

### 3.1 Step-by-Step Flow

```
Step 1: Select solution type
  - User: choose from 196 solutions
  - System: load the base knowledge library for that solution

Step 2: Parameter input (Parameterization Phase)
  - User: define the following
    ✓ Database naming conventions
    ✓ Table structure variation options
    ✓ API endpoint structure
    ✓ Business logic flow choices
    ✓ Security parameters
  
  - System: validate inputs
    ✓ Confirm security requirements
    ✓ Validate compatibility

Step 3: Project metadata input
  - Project name
  - Project description
  - Target customers
  - Estimated scale
  - Launch schedule

Step 4: Generate specifications
  - System: generate the required documents for the selected solution type
  - Apply Step 2 parameters to each document
  - Produce a project-specific, unique specification set

Step 5: Validate the deliverables
  - Verify consistency across specifications
  - Confirm completeness of parameter application
  - Generate a security checklist

Step 6: Hand off to development team
  - Provide the generated specification package
  - Provide the parameter configuration document
  - Automatically configure the development environment
```

### 3.2 Example: POS System

```
Input: POS System (SMB/02_pos_system)
     - database_naming: snake_case, prefix "store_"
     - table_naming: singular, prefix "tbl_"
     - api_versioning: /api/v1/
     - transaction_flow: Event-driven
     - encryption: AES-256-GCM

Generation result #1:
     Database: store_pos_db
     Tables: tbl_transaction, tbl_product, tbl_inventory
     API: /api/v1/transactions (POST), /api/v1/products (GET)
     Events: TransactionCreatedEvent, ProductSoldEvent

Generation result #2 (different developer):
Input: Same POS System but
     - database_naming: PascalCase, prefix "POS_"
     - table_naming: plural, prefix "T_"
     - api_versioning: /api/v2/
     - transaction_flow: State machine
     - encryption: Argon2

Generation result:
     Database: POS_SalesDB
     Tables: T_Transactions, T_Products, T_Inventories
     API: /api/v2/sales (POST), /api/v2/catalog (GET)
     State machine: PendingTransaction → ApprovedTransaction → CompletedTransaction

→ Same underlying logic, completely different implementation results
→ Pattern-based attacks impossible
```

---

## 4. Redefined Specification Document Templates

### 4.1 Base Principles

Every specification template must include the following:

```yaml
parameter_reference_section:
  - Parameters that affected this specification
  - Alternative implementation approaches (chosen vs. not chosen)
  - Why was this choice made? (decision rationale)

Example:
  document: "04_database_schema"
  affected_parameters:
    - database_naming: "snake_case, prefix 'store_'"
    - table_structure_variation: "soft_delete=true, audit_fields=true"
  alternative_not_chosen:
    - table_naming: "chose singular instead of plural"
    - timestamp_format: "chose UTC_datetime instead of Unix_timestamp"
  decision_rationale:
    - "Auditing is important, so audit_fields are included"
    - "Preserving deletion history is a regulatory requirement, so soft_delete"
```

### 4.2 Parameter Application per Document

#### 01_basic_logic
- **Variable**: the business logic flow choice is reflected across the whole structure
- **Example**: Linear vs Event-driven → process diagrams and data flows differ

#### 02_core_features
- **Variable**: each feature is rewritten to follow the business logic flow
- **Example**: if Transaction Flow is Event-driven, each feature is described in event-based terms

#### 03_terminology
- **Variable**: the terminology itself differs by solution type
- **Example**: ERP vs POS → glossaries differ (e.g., "transaction" vs "document")

#### 04_database_schema
- **Variable**: all parameters apply
  - Database name, table name, and column name patterns all apply
  - Table structure variations (soft delete, audit fields) apply
  - Status implementation choice applies

#### 05_api_standard
- **Variable**: API endpoint structure, response format, pagination
  - Versioning method applies
  - Resource naming (singular/plural) applies
  - Response wrapper method applies

#### 06_security_requirements
- **Variable**: security parameters
  - Encryption algorithm choice
  - Authentication method choice
  - Compliance item choice

#### 07_spec_template
- **Variable**: document referencing all parameters
- **Purpose**: help the development team understand why each choice was made

---

## 5. Solution Type Parameter Profiles

### 5.1 Profile Definition

Each solution type may have a **default parameter profile**. Developers can use it or modify it.

```yaml
solution_type: "E-Commerce Mall"

default_profile:
  database_naming:
    pattern: "snake_case"
    prefix: "ecom_"
    
  api_endpoint_variation:
    versioning: "URL path (/api/v1/)"
    resource_naming: "plural"
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

developer_choice:
  ✓ Use default profile
  ✓ Modify profile
  ✓ Define from scratch
```

---

## 6. Security Validation

### 6.1 Parameter Validation Rules

```
Rule 1: Naming convention consistency
  - No mixing within the same project (snake_case and camelCase cannot be used together)
  
Rule 2: Security defaults
  - password_hashing: at least bcrypt (plaintext absolutely not allowed)
  - encryption_level: at least "standard"
  
Rule 3: Compliance
  - Financial systems: PCI-DSS required
  - Handling personal data: GDPR or PIPA required
  
Rule 4: Minimum diversity requirement
  - For 2 or more projects within the same team, at least one difference in naming conventions is required
  - At least 2 of database name, table name, and API structure must differ
```

---

## 7. Automated Development Environment Setup

After specifications are generated, the development environment is configured automatically:

```
Generation steps:
1. Git repository structure
   /database
     /migrations  (generated with the selected naming conventions)
     /schema.sql
   /api
     /routes      (generated with the selected endpoint structure)
   /models        (mapped to the selected table names)
   
2. Configuration files
   /.env.example (database name, table prefix, etc.)
   /config.js    (API version, response format, etc.)
   
3. Development templates
   /src/models/[Entity].js    (reflecting the generated parameters)
   /src/routes/[endpoint].js  (reflecting the generated API structure)
   
4. Documentation deliverables
   /docs/PARAMETERS.md        (lists all selected parameters)
   /docs/WHY_THESE_CHOICES.md (decision rationale)
   /docs/MAINTENANCE.md       (maintenance guide)
```

---

## 8. Future Extensions

### 8.1 ML-Based Optimization

```
Step 1: Analyze parameter combinations
  - Which parameter combinations are frequently selected together?
  - What are the optimal parameters per project scale?
  
Step 2: Auto-Recommendation
  - User: selects "shopping mall"
  - System: "recommends parameters from similar successful projects"
  
Step 3: Performance optimization
  - Collect real development performance data
  - Which parameter combinations have lower bug rates?
  - Which yield faster development speed?
```

### 8.2 Security Analytics

```
Tracked items:
  - Parameter Diversity Index
  - Security configuration compliance rate
  - Analysis of the relationship between actual security incidents and parameters
```

---

## Conclusion

This system guarantees the following:

1. **Security**: every project is structurally different, so pattern-based attacks are impossible
2. **Consistency**: the same underlying business logic is maintained
3. **Flexibility**: developers can reflect their own preferences
4. **Traceability**: every decision is recorded
5. **Maintainability**: the reasons behind each choice are clearly documented

---

**Version**: 1.0
**Created**: 2026-05-27
**Status**: Draft - awaiting team feedback

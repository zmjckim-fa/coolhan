# CoolHan KB Core Module Mapping

**Version:** 1.0.0 | **Created:** 2026-06-13 | **Status:** ACTIVE

---

## Overview

The CoolHan Knowledge Base is organized into two layers:

```
Layer 1 — Domain Modules (01~11)
  Business capability units. Platform-agnostic.
  Examples: member system, payment system, inventory management

Layer 2 — Solution Type KB
  Platform-specific implementation standards. How to implement domain modules.
  Example: member system of an iOS app = Keychain + LAContext + APNs
```

A project loads both layers to generate an integrated specification combining "what to build (domain)" + "how to build it (solution)".

---

## 1. Domain Module → Solution Type Mapping Table

| Domain Module | WEB (Ecommerce) | MOBILE (iOS) | MOBILE (Android) | DESKTOP (Windows) | SMB (POS) |
|---------------|-----------------|--------------|------------------|-------------------|-----------|
| **01 Member** | JWT + bcrypt + Express session | Keychain + LAContext + APNs | EncryptedSharedPref + BiometricPrompt + FCM | Windows Credential Manager + Windows Hello | Local users + roles |
| **02 Shopping Mall** | ProductGrid + Cart + Wishlist | CollectionView + SwiftUI | LazyColumn (Compose) + Room cache | DataGrid + ObservableCollection | Product barcode lookup |
| **03 Payment** | PG (Toss/KG Inicis) + virtual account | StoreKit (in-app) or WebView PG | Billing Library or WebView PG | WebView PG or external integration | Cash/card POS terminal |
| **04 Shipping** | Carrier API + tracking + address | Shipment tracking screen | Shipment tracking + Room | Shipment management DataGrid | Local delivery/pickup |
| **05 Admin** | Express Admin Routes + permissions | (omitted — uses web admin) | (omitted — uses web admin) | NavigationView admin panel | POS admin screen |
| **06 Notification** | Email (Nodemailer) + SMS + FCM | APNs + UNUserNotification | FCM + NotificationChannel | Toast notification + tray notification | Receipt printer + SMS |
| **07 Review/Rating** | REST API + star-rating UI | SwiftUI Rating View | Compose Rating | Star-rating DataTemplate | Customer rating |
| **08 Inventory** | DB inventory field + reservation transaction | Inventory display (view only) | Inventory display + Room | DataGrid inventory management | Real-time stock deduction |
| **09 Order** | OrderService + state machine | OrderHistoryView | OrderHistory (Compose+Room) | Order DataGrid + filter | Receipt + order queue |
| **10 Privacy** | GDPR endpoints + consent UI | Privacy Nutrition Labels + ATT | Play Data Safety section + runtime permissions | Privacy policy link + delete feature | Minimal customer data collection |
| **11 Purchase Application** | B2B quote request flow | B2B mobile application form | B2B mobile application form | Enterprise purchase application DataGrid | (not applicable) |

---

## 2. Solution Type KB Completeness

| Solution Type | Path | Completeness | File Status |
|---------------|------|--------------|-------------|
| **WEB — E-Commerce Mall** | `WEB/01_ecommerce_mall/` | ✅ 7/7 | 01~07 complete |
| **MOBILE — iOS App** | `MOBILE/01_ios_app/` | ✅ 7/7 | 01~07 complete |
| **MOBILE — Android App** | `MOBILE/02_android_app/` | ✅ 7/7 | 01~07 complete |
| **DESKTOP — Windows App** | `DESKTOP/01_windows_app/` | ✅ 7/7 | 01~07 complete |
| **SMB — POS System** | `SMB/02_pos_system/` | ✅ 7/7 | 01~07 complete |

**Total Solution Type KB:** 5 types, 35 files — all complete ✅

---

## 3. Domain Module Completeness

| Module | File | Completeness | Sections |
|--------|------|--------------|----------|
| **01 Member System** | `01_member_system.md` | ✅ | 12/12 |
| **02 Shopping Mall** | `02_shopping_mall.md` | ✅ | 12/12 |
| **03 Payment** | `03_payment_system.md` | ✅ | 12/12 |
| **04 Shipping** | `04_shipping_logistics.md` | ✅ | 12/12 |
| **05 Admin** | `05_admin_system.md` | ✅ | 12/12 |
| **06 Notification** | `06_notification_system.md` | ✅ | 12/12 |
| **07 Review/Rating** | `07_review_rating_system.md` | ✅ | 12/12 |
| **08 Inventory** | `08_inventory_management.md` | ✅ | 12/12 |
| **09 Order** | `09_order_management.md` | ✅ | 12/12 |
| **10 Privacy** | `10_gdpr_privacy.md` | ✅ | 12/12 |
| **11 Purchase Application** | `11_purchase_application.md` | ✅ | 12/12 |

**Total Domain Modules:** 11/11 complete ✅

---

## 4. Recommended Module Combinations by Project Type

### 4.1 Web-based

| Project | Required Modules | Optional Modules | KB Reference |
|---------|------------------|------------------|--------------|
| **B2C Shopping Mall** | 01+02+03+04+06+08+09+10 | 05+07+11 | `WEB/01_ecommerce_mall/` |
| **B2B Purchase System** | 01+05+06+10+11 | 03+08+09 | `WEB/01_ecommerce_mall/` |
| **SaaS Platform** | 01+05+06+10 | 03+08 | `WEB/01_ecommerce_mall/` |
| **Marketplace** | 01+02+03+04+05+06+07+08+09+10 | 11 | `core/marketplace_core.md` |

### 4.2 Mobile-based

| Project | Required Modules | Optional Modules | KB Reference |
|---------|------------------|------------------|--------------|
| **iOS Shopping App** | 01+02+03+06+09+10 | 04+07+08 | `MOBILE/01_ios_app/` |
| **Android Shopping App** | 01+02+03+06+09+10 | 04+07+08 | `MOBILE/02_android_app/` |
| **Mobile B2B App** | 01+05+06+10+11 | 08+09 | `MOBILE/01_ios_app/` or `MOBILE/02_android_app/` |
| **Cross-platform App** | 01+02+06+10 | 03+08+09 | Reference both mobile KBs in parallel |

### 4.3 Desktop-based

| Project | Required Modules | Optional Modules | KB Reference |
|---------|------------------|------------------|--------------|
| **Inventory Management App** | 01+05+06+08+10 | 09+11 | `DESKTOP/01_windows_app/` |
| **Enterprise Purchase System** | 01+05+06+10+11 | 03+08+09 | `DESKTOP/01_windows_app/` |
| **ERP Client** | 01+05+06+08+09+10 | 03+04+11 | `DESKTOP/01_windows_app/` |
| **Analytics/Reporting Tool** | 01+05+10 | 06 | `DESKTOP/01_windows_app/` |

### 4.4 SMB/Offline

| Project | Required Modules | Optional Modules | KB Reference |
|---------|------------------|------------------|--------------|
| **POS System** | 01+03+08+09+10 | 05+06+07 | `SMB/02_pos_system/` |
| **Cafe/Restaurant POS** | 01+03+08+09 | 06 | `SMB/02_pos_system/` |
| **Retail Store POS** | 01+02+03+08+09+10 | 05+06+07 | `SMB/02_pos_system/` |

---

## 5. Tech Stack Selection Guide

Solution Type KB load order by project type:

```
Step 1: Load 00_TECH_PARAMETER_DEFINITION.md → define tech parameters
Step 2: Load 00_TECH_PARAMETER_MAPPING.md → confirm parameter → module mapping
Step 3: Load the relevant Solution Type KB 01_basic_logic.md
Step 4: Selectively load required domain modules (01~11)
Step 5: Generate the integrated specification document (based on 07_spec_template.md)
```

---

## 6. Common Technical Pattern Cross-Reference

### Authentication Patterns (01_member_system.md implementations)

| Platform | Storage | Authentication Method | Refresh Strategy |
|----------|---------|-----------------------|------------------|
| Web | httpOnly Cookie | JWT + Refresh Token | Silent refresh (interceptor) |
| iOS | Keychain | JWT + Refresh | URLSession actor mutex |
| Android | EncryptedSharedPref | JWT + Refresh | OkHttp Interceptor + Mutex |
| Windows Desktop | Credential Manager | JWT + Refresh | SemaphoreSlim |
| POS | Local DB | PIN or role-based session | Manual switch |

### Offline Cache Patterns (related to modules 02, 08, 09)

| Platform | Cache Storage | Refresh Strategy | Sync |
|----------|---------------|------------------|------|
| Web | Redis / local memory | Cache-then-Network | WebSocket or polling |
| iOS | NSCache + Core Data | Cache-then-Network (AsyncStream) | Background App Refresh |
| Android | Room Database | Flow + network fallback | WorkManager |
| Windows | SQLite + EF Core | IDbContextFactory | BackgroundWorker |
| POS | SQLite | Offline-first, upload when connected | Batch sync |

### Notification Patterns (06_notification_system.md implementations)

| Platform | Push Service | Local Notification | Channel/Group |
|----------|--------------|--------------------|--------------|
| Web | FCM Web Push / SSE | Notification API | Browser permission |
| iOS | APNs | UNUserNotificationCenter | UNNotificationCategory |
| Android | FCM | NotificationChannel (required Android 8+) | NotificationManager |
| Windows | WNS / Toast | AppNotificationManager | NotificationGroup |
| POS | (none) | On-screen popup + printer | — |

---

## 7. Extension Module Roadmap

The current 11 domain modules cover roughly 80% of projects. Add as needed:

| # | Module Name | Priority | Main Solution Types |
|---|-------------|----------|---------------------|
| 12 | Subscription Billing | High | SaaS, service industry |
| 13 | Content Management (CMS) | Medium | blog, landing page |
| 14 | Analytics/Reporting | High | all types |
| 15 | Marketplace Seller (Multi-seller) | Medium | marketplace |
| 16 | Recommendation Engine | Low | E-Commerce |
| 17 | Booking/Scheduling | Medium | service industry, hospitals |

---

**Reference documents:**
- [`00_DOMAIN_MODULES_INDEX.md`](00_DOMAIN_MODULES_INDEX.md) — detailed module list
- [`00_TECH_PARAMETER_DEFINITION.md`](00_TECH_PARAMETER_DEFINITION.md) — tech parameter definition
- [`00_TECH_PARAMETER_MAPPING.md`](00_TECH_PARAMETER_MAPPING.md) — parameter mapping table
- [`00_MODULE_RESPONSIBILITY_MATRIX.md`](00_MODULE_RESPONSIBILITY_MATRIX.md) — module responsibility separation
- [`00_KNOWLEDGE_BASE_EXTENSIBILITY.md`](00_KNOWLEDGE_BASE_EXTENSIBILITY.md) — KB extension rules

# 07_review_rating_system.md - Review & Rating System Domain Module

## Overview
The Review & Rating System module handles product/service reviews, customer ratings, review moderation, and aggregated ratings. This module helps customers make informed purchasing decisions and helps merchants understand customer satisfaction.

---

## 1. Terminology Definition

| Term | Definition | Example |
|------|-----------|---------|
| **Review** | Detailed feedback from customer | "Great product, fast shipping" |
| **Rating** | Numeric score for product/service | 5 stars, 4.5 stars |
| **Star Rating** | 1-5 star scale | ★★★★★ = 5 stars |
| **Verified Purchase** | Customer actually bought the product | Badge shown on review |
| **Helpful** | Other customers found review useful | 25 people found helpful |
| **Unhelpful** | Customers found review not useful | 2 people found unhelpful |
| **Moderation** | Review approval process | Pending, Approved, Rejected |
| **Average Rating** | Mean of all reviews | 4.2 stars average |
| **Rating Distribution** | Count of reviews per star level | 100 x 5★, 50 x 4★, etc. |
| **Review Response** | Seller response to customer review | "Thank you for feedback" |
| **Spam/Abuse** | Inappropriate review | Fake review, harassment |
| **NPS Score** | Net Promoter Score (likelihood to recommend) | 0-100 scale |

---

## 2. Basic Functions

### 2.1 Create Review
- **Purpose**: Allow customer to submit product review
- **Input**: Product ID, rating, title, review text, verified purchase flag
- **Process**: Validate customer → Validate product → Create review → Queue for moderation
- **Output**: Review created (pending approval)
- **Error Handling**: Customer not found, duplicate review, invalid rating

### 2.2 Edit Review
- **Purpose**: Allow customer to modify their review
- **Input**: Review ID, new content
- **Process**: Verify ownership → Validate content → Update review → Re-queue moderation if needed
- **Output**: Review updated
- **Error Handling**: Review not found, not owner, review already moderated

### 2.3 Delete Review
- **Purpose**: Allow customer or admin to remove review
- **Input**: Review ID
- **Process**: Verify permission → Soft delete review → Update rating aggregate
- **Output**: Review deleted
- **Error Handling**: Review not found, not authorized

### 2.4 Mark as Helpful
- **Purpose**: Allow customers to vote on review usefulness
- **Input**: Review ID, helpful (true/false)
- **Process**: Record vote (prevent double voting) → Update helpful count → Update aggregate
- **Output**: Vote recorded
- **Error Handling**: Already voted, review not found

### 2.5 Approve/Reject Review
- **Purpose**: Moderate reviews to prevent spam/abuse
- **Input**: Review ID, approval status, reason (if rejected)
- **Process**: Admin review → Approve or reject → Update status → Notify customer
- **Output**: Review approved or rejected
- **Error Handling**: Review not found, already moderated

### 2.6 Review Response
- **Purpose**: Allow seller to respond to customer review
- **Input**: Review ID, response text
- **Process**: Validate seller ownership → Create response → Notify customer → Pin response
- **Output**: Response created
- **Error Handling**: Review not found, not seller, response already exists

### 2.7 View Product Reviews
- **Purpose**: Display reviews for product with filtering
- **Input**: Product ID, filters (rating, verified purchase, helpful), sort, pagination
- **Process**: Query reviews → Apply filters → Sort → Paginate → Include rating aggregate
- **Output**: Product reviews with aggregate rating
- **Error Handling**: Product not found, no reviews

### 2.8 Calculate Aggregate Rating
- **Purpose**: Calculate average rating and distribution
- **Input**: Product ID
- **Process**: Query all approved reviews → Calculate average → Count per rating → Cache
- **Output**: Average rating, distribution, review count
- **Error Handling**: No reviews, invalid product

### 2.9 Verify Purchase
- **Purpose**: Confirm customer actually purchased product
- **Input**: Customer ID, Product ID
- **Process**: Check order history → Verify product in order → Verify order completed
- **Output**: Verified purchase flag
- **Error Handling**: No purchase found, order not completed

### 2.10 Review Analytics
- **Purpose**: Provide seller/admin with review insights
- **Input**: Product ID, date range
- **Process**: Aggregate review data → Calculate trends → Average response time → Rating trends
- **Output**: Review analytics dashboard
- **Error Handling**: No reviews, invalid date range

---

## 3. Status Values

| Status | Description | Transitions | Business Rules |
|--------|-------------|-----------|-----------------|
| **Pending** | Awaiting admin moderation | → Approved, Rejected | Not visible |
| **Approved** | Approved by admin | → Archived, Removed | Visible to all |
| **Rejected** | Rejected by admin | None (final) | Not visible, customer notified |
| **Archived** | Removed by customer or admin | None (final) | Not visible, data preserved |
| **Spam** | Flagged as spam/abuse | → Rejected, Archived | Visible with warning (optional) |

---

## 4. Database Basic Structure

### Core Tables

#### product_reviews
```
- id (PK): UUID/INT
- product_id (FK): UUID/INT
- member_id (FK): UUID/INT
- rating: INT (1-5)
- title: VARCHAR(255)
- review_text: TEXT
- verified_purchase: BOOLEAN
- order_id (FK): UUID/INT (optional, reference)
- status: ENUM(pending, approved, rejected, archived, spam)
- helpful_count: INT
- unhelpful_count: INT
- response_count: INT
- created_at: TIMESTAMP
- updated_at: TIMESTAMP
- approved_at: TIMESTAMP
- approved_by: UUID/INT (admin_id)
```

#### review_responses
```
- id (PK): UUID/INT
- review_id (FK): UUID/INT
- respondent_id (FK): UUID/INT (seller/admin)
- respondent_type: VARCHAR(50) (seller, admin, brand)
- response_text: TEXT
- is_pinned: BOOLEAN (seller response pinned at top)
- created_at: TIMESTAMP
- updated_at: TIMESTAMP
```

#### review_helpful_votes
```
- id (PK): UUID/INT
- review_id (FK): UUID/INT
- member_id (FK): UUID/INT
- is_helpful: BOOLEAN (true=helpful, false=unhelpful)
- created_at: TIMESTAMP
- PRIMARY KEY (review_id, member_id) -- prevent double voting
```

#### product_rating_aggregate
```
- product_id (PK, FK): UUID/INT
- average_rating: DECIMAL(2,1)
- review_count: INT
- rating_distribution: JSON {1_star: 10, 2_star: 5, 3_star: 20, 4_star: 50, 5_star: 100}
- last_updated: TIMESTAMP
```

#### review_flags
```
- id (PK): UUID/INT
- review_id (FK): UUID/INT
- reported_by: UUID/INT (member_id)
- flag_type: VARCHAR(50) (spam, abuse, inappropriate, fake, etc.)
- description: TEXT
- status: ENUM(open, reviewed, dismissed, resolved)
- created_at: TIMESTAMP
- reviewed_at: TIMESTAMP
- reviewed_by: UUID/INT
```

#### nps_surveys
```
- id (PK): UUID/INT
- member_id (FK): UUID/INT
- product_id (FK): UUID/INT (optional)
- order_id (FK): UUID/INT
- score: INT (0-10)
- feedback: TEXT
- created_at: TIMESTAMP
```

---

## 5. API Basic Structure

### Review Endpoints
```
POST   /products/:id/reviews      - Create review
GET    /products/:id/reviews      - Get reviews (with filters)
GET    /reviews/:id               - Get single review
PUT    /reviews/:id               - Edit own review
DELETE /reviews/:id               - Delete own review
POST   /reviews/:id/helpful       - Mark as helpful/unhelpful
POST   /reviews/:id/responses     - Add response
GET    /reviews/:id/responses     - Get review responses
```

### Admin Moderation Endpoints
```
GET    /admin/reviews             - List pending reviews
GET    /admin/reviews/:id         - Review details
POST   /admin/reviews/:id/approve - Approve review
POST   /admin/reviews/:id/reject  - Reject review
POST   /admin/reviews/:id/flag    - Flag as spam/abuse
POST   /admin/reviews/:id/response - Add admin response
```

### Analytics Endpoints
```
GET    /products/:id/rating       - Get product rating aggregate
GET    /products/:id/reviews/analytics - Review analytics
GET    /products/:id/nps          - NPS score data
```

### NPS Survey Endpoints
```
POST   /surveys/nps               - Submit NPS response
GET    /surveys/nps/results       - View NPS results (admin)
```

---

## 6. Permissions

### Public (No Authentication)
- GET /products/:id/reviews (view only)

### Authenticated User
- POST /products/:id/reviews
- PUT /reviews/:id (own only)
- DELETE /reviews/:id (own only)
- POST /reviews/:id/helpful
- POST /surveys/nps

### Admin Only
- All /admin/reviews/* endpoints
- GET /products/:id/reviews/analytics
- GET /surveys/nps/results

---

## 7. Prohibitions

### Absolute Prohibitions
- **Cannot**: Post review without purchasing product (unless review verification disabled)
- **Cannot**: Post multiple reviews for same product from same customer
- **Cannot**: Modify review after approval
- **Cannot**: Delete approved review (only archive)
- **Cannot**: Post reviews containing obvious spam/harassment

### Conditional Prohibitions
- **Unless customer owns review**: Cannot edit or delete
- **Unless admin or owner**: Cannot respond to review
- **Unless verified purchase**: Cannot display "Verified Purchase" badge

---

## 8. Security Standards

### Review Security
- Input sanitization to prevent injection
- HTML stripping to prevent scripting
- Spam detection (language analysis, keyword matching)
- Rate limiting: Max 5 reviews per day per user
- Prevent review farming (must have time gap between reviews)

### Vote Security
- Prevent double-voting with user session tracking
- IP-based bot detection
- Aggregate helpful votes in batch to prevent manipulation

### Data Protection
- Store review text as-is (audit trail)
- Archive deleted reviews (don't permanently delete)
- Moderate before publishing (if moderation enabled)

---

## 9. Acceptance Criteria

### Review Creation
- ✅ Authenticated user can post review
- ✅ Verified purchase shows if applicable
- ✅ Review goes to pending status
- ✅ Customer cannot post duplicate review
- ✅ Rating field required and validated (1-5)

### Review Display
- ✅ Approved reviews visible to all
- ✅ Pending/rejected reviews hidden
- ✅ Helpful/unhelpful votes displayed
- ✅ Rating average calculated correctly
- ✅ Reviews filterable by rating
- ✅ Seller response pinned at top

### Review Moderation
- ✅ Admin can view pending reviews
- ✅ Admin can approve/reject reviews
- ✅ Customer notified of rejection
- ✅ Approval/rejection logged

### Helpful Votes
- ✅ User can vote helpful/unhelpful
- ✅ Cannot vote twice on same review
- ✅ Vote counts update
- ✅ Most helpful reviews surfaced first

### Analytics
- ✅ Product rating aggregate calculated
- ✅ Rating distribution shown (breakdown by stars)
- ✅ Review trends tracked over time
- ✅ NPS score calculated and reported

---

## 10. Integration Points

### Dependency Services
- **Shopping Mall** (02_): For product data
- **Member System** (01_): For customer info
- **Order Management** (09_): For verified purchase check
- **Admin System** (05_): For moderation access
- **Notification System** (06_): For approval/rejection notifications

### Integration Hooks
- On review submission: Queue for moderation
- On review approval: Update product rating, notify customer
- On review response: Notify original reviewer
- On report/flag: Alert admin for review

---

## 11. Configuration Parameters

| Parameter | Default | Min | Max | Notes |
|-----------|---------|-----|-----|-------|
| Require verified purchase | false | - | - | Only verified buyers review |
| Review moderation required | true | - | - | Admin approval before publishing |
| Min review length | 10 | 0 | 1000 | Minimum characters |
| Max review length | 5000 | 100 | 10000 | Maximum characters |
| Reviews per day limit | 5 | 1 | 20 | Per user per day |
| Show rating aggregate | true | - | - | Display average rating |
| Allow seller responses | true | - | - | Sellers can respond |
| Response moderation | false | - | - | Approve seller responses |
| Rating distribution | true | - | - | Show 5-1 star breakdown |
| Helpful votes visible | true | - | - | Show helpful counts |

---

## 12. Known Dependencies

- **Review & Rating System** depends on **Shopping Mall** (02_) for product info
- **Review & Rating System** depends on **Member System** (01_) for customer info
- **Review & Rating System** depends on **Order Management** (09_) for verification
- **Review & Rating System** integrates with **Admin System** (05_) for moderation
- **Review & Rating System** integrates with **Notification System** (06_)

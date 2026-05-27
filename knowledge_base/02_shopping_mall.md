# 02_shopping_mall.md - Shopping Mall Domain Module

## Overview
The Shopping Mall module handles product catalog, shopping cart, wishlist, and product search/discovery. This is the core commerce module for any e-commerce or marketplace application.

---

## 1. Terminology Definition

| Term | Definition | Example |
|------|-----------|---------|
| **Product** | Item available for purchase with pricing and inventory | T-shirt, Book, Phone |
| **Catalog** | Complete collection of products organized by category | Clothing, Electronics |
| **Category** | Product classification for organization | Men's Clothing > Shirts |
| **Variant** | Product variation (size, color, etc.) | Blue T-shirt size M |
| **SKU** | Stock Keeping Unit - unique product identifier | SKU-12345-BLU-M |
| **Inventory** | Current stock quantity of product variant | 150 units in stock |
| **Price** | Cost of product variant at point of sale | $29.99 |
| **Discount** | Temporary price reduction | 20% off, $5 discount |
| **Coupon** | Code-based discount or promotion | WELCOME20 = 20% off |
| **Cart** | Temporary collection of items for purchase | [Item1, Item2] |
| **Wishlist** | Saved list of products for future consideration | Saved items for later |
| **Review** | Customer feedback and rating for product | 5 stars, "Great quality!" |
| **Stock Status** | Current availability state of product | In Stock, Out of Stock, Pre-order |

---

## 2. Basic Functions

### 2.1 Product Catalog Management
- **Purpose**: Maintain product information and catalog structure
- **Input**: Product data (name, description, images, pricing, variants)
- **Process**: Validation → Create/update product → Index for search → Update pricing
- **Output**: Product record, searchable product
- **Error Handling**: Invalid data, duplicate SKU, image upload failure

### 2.2 Product Listing
- **Purpose**: Display products with filtering and pagination
- **Input**: Category, filters (price range, ratings), sort (popularity, price), pagination
- **Process**: Query products → Apply filters → Sort → Paginate → Return with inventory status
- **Output**: Product list with pricing, images, availability
- **Error Handling**: Invalid category, empty results

### 2.3 Product Search
- **Purpose**: Allow customers to find products by keyword
- **Input**: Search query, filters
- **Process**: Full-text search → Apply filters → Rank by relevance → Return results
- **Output**: Matching products with relevance score
- **Error Handling**: No results, search timeout

### 2.4 Product Details
- **Purpose**: Display complete product information
- **Input**: Product ID/slug
- **Process**: Fetch product data → Fetch reviews → Fetch inventory → Format for display
- **Output**: Product details including variants, pricing, reviews, availability
- **Error Handling**: Product not found, deleted product

### 2.5 Add to Cart
- **Purpose**: Add product variant to shopping cart
- **Input**: Product ID, variant (size/color/etc), quantity
- **Process**: Validate product exists → Check inventory → Validate quantity → Add to cart
- **Output**: Updated cart with new item
- **Error Handling**: Out of stock, invalid quantity, product not found

### 2.6 Manage Cart
- **Purpose**: Modify cart items (quantity, removal)
- **Input**: Cart ID, item ID, new quantity or removal
- **Process**: Find cart → Find item → Update quantity or remove → Recalculate total
- **Output**: Updated cart with new total
- **Error Handling**: Cart not found, item not in cart, invalid quantity

### 2.7 View Cart
- **Purpose**: Display current cart contents with pricing
- **Input**: Cart ID
- **Process**: Fetch cart items → Recalculate totals → Include tax estimate → Include shipping estimate
- **Output**: Cart with items, subtotal, tax, shipping, total
- **Error Handling**: Cart not found or expired

### 2.8 Wishlist Management
- **Purpose**: Save products for later purchase
- **Input**: Product ID (add/remove)
- **Process**: Verify product exists → Add or remove from wishlist → Optionally notify on price drop
- **Output**: Updated wishlist
- **Error Handling**: Product not found, already in wishlist

### 2.9 Product Review
- **Purpose**: Allow customers to rate and review products
- **Input**: Product ID, rating (1-5), review text, verified purchase flag
- **Process**: Verify customer purchased product (optional) → Validate review → Store review → Update product rating
- **Output**: Review published, updated product rating
- **Error Handling**: Invalid rating, duplicate review, unverified purchaser

### 2.10 Inventory Management
- **Purpose**: Track and update product stock levels
- **Input**: Product variant ID, quantity change, reason
- **Process**: Update stock level → Log transaction → Alert if below threshold → Update status
- **Output**: Updated inventory record
- **Error Handling**: Invalid quantity, product not found, negative stock

---

## 3. Status Values

| Status | Description | Transitions | Business Rules |
|--------|-------------|-----------|-----------------|
| **In Stock** | Sufficient inventory for purchase | → Low Stock, Out of Stock | Can be added to cart |
| **Low Stock** | Below reorder threshold | → In Stock, Out of Stock | Can purchase, may display urgency |
| **Out of Stock** | No inventory available | → Back in Stock, Discontinued | Cannot add to cart |
| **Back Order** | Pre-order available, will ship later | → In Stock | Limited quantity allowed |
| **Discontinued** | Product no longer sold | None (final state) | Cannot add to cart |
| **Hidden** | Not visible to customers | → In Stock | Visible only to admin |
| **Draft** | Being prepared, not published | → In Stock | Visible only to admin/editor |

---

## 4. Database Basic Structure

### Core Tables

#### products
```
- id (PK): UUID/INT
- sku (UNIQUE): VARCHAR(50)
- name: VARCHAR(255)
- slug (UNIQUE): VARCHAR(255)
- description: TEXT
- category_id (FK): UUID/INT
- status: ENUM(draft, hidden, in_stock, low_stock, out_of_stock, back_order, discontinued)
- base_price: DECIMAL(12,2)
- images: JSON (array of {url, alt_text, order})
- specifications: JSON
- weight: DECIMAL(10,3)
- dimensions: JSON {length, width, height, unit}
- created_at: TIMESTAMP
- updated_at: TIMESTAMP
- published_at: TIMESTAMP
- deleted_at: TIMESTAMP (soft delete)
- meta_title: VARCHAR(160)
- meta_description: VARCHAR(160)
- meta_keywords: VARCHAR(255)
```

#### product_variants
```
- id (PK): UUID/INT
- product_id (FK): UUID/INT
- sku (UNIQUE): VARCHAR(50)
- variant_name: VARCHAR(255) (e.g., "Blue - Size M")
- attributes: JSON {size, color, material, etc.}
- price: DECIMAL(12,2)
- cost: DECIMAL(12,2)
- stock_quantity: INT
- stock_reserved: INT
- status: VARCHAR(50)
- created_at: TIMESTAMP
- updated_at: TIMESTAMP
```

#### product_categories
```
- id (PK): UUID/INT
- name: VARCHAR(255)
- slug (UNIQUE): VARCHAR(255)
- parent_category_id (FK): UUID/INT (for nested categories)
- description: TEXT
- image_url: VARCHAR(500)
- meta_title: VARCHAR(160)
- meta_description: VARCHAR(160)
- display_order: INT
- is_active: BOOLEAN
- created_at: TIMESTAMP
- updated_at: TIMESTAMP
```

#### shopping_carts
```
- id (PK): UUID/INT
- member_id (FK): UUID/INT (nullable for guests)
- session_id: VARCHAR(500) (for guests)
- status: ENUM(active, abandoned, completed)
- subtotal: DECIMAL(12,2)
- tax_amount: DECIMAL(12,2)
- shipping_cost: DECIMAL(12,2)
- discount_amount: DECIMAL(12,2)
- total: DECIMAL(12,2)
- expires_at: TIMESTAMP
- created_at: TIMESTAMP
- updated_at: TIMESTAMP
```

#### cart_items
```
- id (PK): UUID/INT
- cart_id (FK): UUID/INT
- product_variant_id (FK): UUID/INT
- quantity: INT
- unit_price: DECIMAL(12,2) (price at time of add)
- line_total: DECIMAL(12,2)
- added_at: TIMESTAMP
- updated_at: TIMESTAMP
```

#### wishlists
```
- id (PK): UUID/INT
- member_id (FK): UUID/INT
- name: VARCHAR(255) (e.g., "Birthday Wishlist")
- is_public: BOOLEAN
- created_at: TIMESTAMP
- updated_at: TIMESTAMP
```

#### wishlist_items
```
- wishlist_id (FK): UUID/INT
- product_id (FK): UUID/INT
- added_at: TIMESTAMP
- PRIMARY KEY (wishlist_id, product_id)
```

**Note**: product_reviews table is owned by **07_review_rating_system** module.
**Note**: inventory_transactions table is owned by **08_inventory_management** module.

---

## 5. API Basic Structure

### Product Endpoints
```
GET    /products                  - List products (with filters)
GET    /products/search           - Search products by keyword
GET    /products/:id              - Get product details
GET    /categories                - List all categories
GET    /categories/:id/products   - List products in category
```

**Note**: Review endpoints (/products/:id/reviews, POST /products/:id/reviews) are owned by **07_review_rating_system** module.

### Cart Endpoints
```
GET    /cart                      - View current cart
POST   /cart/items                - Add item to cart
PUT    /cart/items/:itemId        - Update cart item quantity
DELETE /cart/items/:itemId        - Remove item from cart
DELETE /cart                      - Clear entire cart
POST   /cart/checkout             - Proceed to checkout (move to Order module)
```

### Wishlist Endpoints
```
GET    /wishlists                 - List user's wishlists
POST   /wishlists                 - Create new wishlist
PUT    /wishlists/:id             - Update wishlist
DELETE /wishlists/:id             - Delete wishlist
POST   /wishlists/:id/items       - Add product to wishlist
DELETE /wishlists/:id/items/:productId - Remove from wishlist
```

### Admin Endpoints
```
POST   /admin/products            - Create product
PUT    /admin/products/:id        - Update product
DELETE /admin/products/:id        - Delete product
POST   /admin/products/:id/variants - Create variant
PUT    /admin/products/:id/variants/:variantId - Update variant
PUT    /admin/products/:id/status - Change product status
GET    /admin/products/:id/analytics - Product analytics (views, sales)
GET    /admin/products/:id/details - Get product details with inventory summary
```

**Note**: Detailed inventory management endpoints (/admin/inventory/*, POST/PUT for inventory updates) are owned by **08_inventory_management** module.

---

## 6. Permissions

### Public (No Authentication)
- GET /products
- GET /products/:id
- GET /products/search
- GET /categories
- GET /products/:id/reviews (view only)
- GET /cart (view only, guest cart via session)

### Authenticated User
- POST /cart/items
- PUT /cart/items/:itemId
- DELETE /cart/items/:itemId
- DELETE /cart
- GET /wishlists
- POST /wishlists
- POST /wishlists/:id/items
- DELETE /wishlists/:id/items/:productId
- POST /products/:id/reviews

### Admin Only
- POST /admin/products
- PUT /admin/products/:id
- DELETE /admin/products/:id
- All product management endpoints
- GET /admin/products/:id/details
- Product analytics
- **Note**: Detailed inventory adjustment endpoints are in **08_inventory_management** module

---

## 7. Prohibitions

### Absolute Prohibitions
- **Cannot**: Sell product with no inventory without explicit back-order flag
- **Cannot**: Show prices inconsistent with active promotions/discounts
- **Cannot**: Allow negative inventory without explicit authorization
- **Cannot**: Remove product variant if it has pending orders
- **Cannot**: Change product price retroactively for completed orders
- **Cannot**: Allow cart items to exceed stock without reservation
- **Cannot**: Display reviews without approval (if moderation enabled)

### Conditional Prohibitions
- **Unless admin approval**: Cannot publish new product
- **Unless published**: Cannot sell product
- **Unless has inventory**: Cannot allow cart add (unless back-order enabled)
- **Unless verified purchase**: Cannot remove/hide review (by customer)

---

## 8. Security Standards

### Price Handling
- All prices stored as DECIMAL(12,2) - never float
- Price calculations rounded at each step, documented
- No manipulation of price on client side
- Final price validated before order creation
- Historical price maintained for audit

### Image Security
- Images uploaded to secure storage (S3, CDN, or local secure folder)
- File type validation (only image formats allowed)
- Image size limits enforced (max 10MB per image)
- Virus scan optional but recommended
- Original filename sanitized, stored with hash name

### Inventory Security
- Stock updates atomic, using transactions
- Concurrent update handling (optimistic or pessimistic locking)
- All inventory changes logged with reason and user
- Negative stock prevented by default, flagged if occurs
- Regular inventory audit/reconciliation

### Cart Security
- Cart tied to user session or authenticated member
- Cart expiration after 30 days of inactivity
- Prices re-validated on checkout (prevent stale pricing)
- Inventory re-reserved at checkout
- Cart data encrypted at rest

### Search Security
- Input sanitization to prevent injection attacks
- Rate limiting on search requests
- No sensitive data leaked through search filters
- Search logs anonymized (for analytics)

---

## 9. Acceptance Criteria

### Product Management
- ✅ Admin can create product with variants
- ✅ Product SKU enforced as unique
- ✅ Images upload and display correctly
- ✅ Product status transitions work correctly
- ✅ Pricing and cost fields stored separately
- ✅ Product metadata (SEO tags) stored

### Product Discovery
- ✅ Products display in categories
- ✅ Listing shows all variants with availability
- ✅ Search returns relevant results
- ✅ Filters (price, category, rating) work correctly
- ✅ Sorting (popularity, price, newest) works correctly
- ✅ Pagination returns correct subsets

### Shopping Cart
- ✅ Item can be added with quantity validation
- ✅ Cart total calculated correctly (subtotal + tax + shipping estimate)
- ✅ Items can be removed or quantity updated
- ✅ Cart persists across sessions (for authenticated users)
- ✅ Guest cart works via session
- ✅ Out-of-stock items show appropriate status
- ✅ Cart expiration works (30 days)

**Note**: Product Review acceptance criteria are in **07_review_rating_system** module.

### Inventory
- ✅ Stock quantity updated on purchase
- ✅ Stock updated on return
- ✅ Restock operations tracked
- ✅ Low stock alerts trigger
- ✅ Back-order flag prevents overselling

---

## 10. Integration Points

### Dependency Services
- **Payment Service**: For checkout processing
- **Shipping Service**: For shipping cost calculation
- **Notification Service**: For inventory alerts
- **Search Service**: For full-text product search (Elasticsearch, etc.)
- **File Storage Service**: For product images
- **Analytics Service**: For product views and sales tracking
- **Review System** (07_): For product reviews and ratings

### Integration Hooks
- On product create: Index for search
- On inventory update: Check if low stock, send notification if needed
- On cart abandonment: Send reminder email
- On product delete: Archive related orders
- **Note**: Review submission hooks are handled by **07_review_rating_system** module

---

## 11. Configuration Parameters

| Parameter | Default | Min | Max | Notes |
|-----------|---------|-----|-----|-------|
| Cart expiry (days) | 30 | 1 | 90 | Inactive cart cleanup |
| Low stock threshold | 10 | 1 | 100 | Alert when below |
| Allow back orders | false | - | - | Permit pre-orders |
| Images per product | 10 | 1 | 20 | Maximum images |
| Max image size (MB) | 10 | 1 | 50 | Per image limit |
| Show product ratings | true | - | - | Display star ratings |
| Price decimal places | 2 | 2 | 4 | Precision for rounding |

**Note**: Review-related configuration parameters (review moderation, min review length) are in **07_review_rating_system** module.

---

## 12. Known Dependencies

- **Shopping Mall** depends on **Member System** (01_) for user context
- **Shopping Mall** integrates with **Review & Rating System** (07_) for product reviews and ratings
- **Shopping Mall** is used by **Order Management** (09_) for product data
- **Shopping Mall** is used by **Inventory Management** (08_) for stock levels
- **Shopping Mall** is used by **Payment System** (03_) for product pricing
- **Shopping Mall** integrates with **Notification System** (06_) for alerts

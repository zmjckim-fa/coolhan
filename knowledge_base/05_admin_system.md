# 05_admin_system.md - Admin System Domain Module

## Overview
The Admin System module provides administrative functionality for managing the application including user management, content management, reporting, audit logs, configuration, and system monitoring. This is the backend control panel for administrators and operators.

---

## 1. Terminology Definition

| Term | Definition | Example |
|------|-----------|---------|
| **Admin** | User with elevated permissions to manage system | Administrator, Manager |
| **Role** | Set of permissions for admin users | Admin, Moderator, Editor |
| **Permission** | Specific action admin can perform | Can view reports, can edit users |
| **Dashboard** | Main admin interface showing system status | Metrics, recent activity |
| **Audit Log** | Record of all system actions and changes | User created at 10:00 AM |
| **Report** | Analysis of system data | Sales report, user growth |
| **Configuration** | System settings and parameters | Max password length, timezone |
| **Content** | Manageable system content | Static pages, notifications |
| **Flag/Tag** | Metadata for categorizing items | Featured, Promoted, Spam |
| **Moderation** | Approval/rejection process for content | Review and approve user reviews |
| **Bulk Operation** | Action affecting multiple items | Bulk email, bulk status update |
| **Webhook** | System event notification | Order created, payment failed |
| **Activity** | User action in system | Login, product viewed, purchase made |

---

## 2. Basic Functions

### 2.1 Dashboard
- **Purpose**: Display high-level system status and metrics
- **Input**: Optional date range, filters
- **Process**: Aggregate metrics → Cache results → Format for display
- **Output**: Dashboard with KPIs (users, orders, revenue, etc.)
- **Error Handling**: Slow queries, missing data

### 2.2 User Management
- **Purpose**: View, create, edit, and manage system users
- **Input**: User data (email, name, role, status)
- **Process**: Validation → Create/update user → Log action → Update roles
- **Output**: User created/updated
- **Error Handling**: Duplicate user, invalid email, role error

### 2.3 Role and Permission Management
- **Purpose**: Define and assign roles with specific permissions
- **Input**: Role name, permissions list
- **Process**: Create role → Assign permissions → Assign to users → Validate permissions
- **Output**: Role created/updated
- **Error Handling**: Role exists, invalid permission, cannot remove admin role

### 2.4 Audit Log Viewing
- **Purpose**: Display all system actions and changes
- **Input**: Filters (user, action type, date range, resource)
- **Process**: Query audit log → Filter results → Return with pagination
- **Output**: Audit log entries
- **Error Handling**: No matching logs

### 2.5 Content Management
- **Purpose**: Manage static content (pages, emails, notifications)
- **Input**: Content type, content data
- **Process**: Validation → Create/update content → Version control → Publish
- **Output**: Content published or in draft
- **Error Handling**: Invalid content type, too large

### 2.6 Configuration Management
- **Purpose**: Update system configuration and settings
- **Input**: Setting key, new value
- **Process**: Validate value → Update setting → Invalidate cache → Audit log
- **Output**: Setting updated
- **Error Handling**: Invalid setting, invalid value type, permission denied

### 2.7 Reporting
- **Purpose**: Generate reports on system data
- **Input**: Report type, date range, filters
- **Process**: Query data → Aggregate → Format → Export (CSV, PDF, Excel)
- **Output**: Report document
- **Error Handling**: Invalid report type, data query timeout

### 2.8 Bulk Operations
- **Purpose**: Perform action on multiple items
- **Input**: Item IDs or filter criteria, action
- **Process**: Select items → Preview changes → Execute action → Log results
- **Output**: Results of bulk operation
- **Error Handling**: Invalid IDs, action fails on some items

### 2.9 Moderation Queue
- **Purpose**: Manage content requiring approval (reviews, comments, etc.)
- **Input**: Filter criteria (pending, rejected, approved)
- **Process**: Query pending items → Display with context → Allow approve/reject/edit
- **Output**: Item approved or rejected
- **Error Handling**: Item not found, invalid action

### 2.10 System Health Monitoring
- **Purpose**: Monitor system status (database, APIs, services)
- **Input**: Optional service filter
- **Process**: Check each service health → Aggregate status → Return status
- **Output**: Health status for each component
- **Error Handling**: Cannot connect to service, timeout

---

## 3. Status Values

| Status | Description | Transitions | Business Rules |
|--------|-------------|-----------|-----------------|
| **Pending Review** | Content awaiting admin approval | → Approved, Rejected | Not visible to users |
| **Approved** | Content approved and published | → Archived, Removed | Visible to users |
| **Rejected** | Content rejected by admin | → Pending Review | Not visible, can resubmit |
| **Archived** | Content removed from active use | None (final) | Not visible, data preserved |
| **Flagged** | Content marked for investigation | → Reviewed, Removed | Visible but marked |

---

## 4. Database Basic Structure

### Core Tables

#### admin_users
```
- id (PK): UUID/INT
- member_id (FK): UUID/INT
- username: VARCHAR(100)
- email: VARCHAR(255)
- role_id (FK): UUID/INT
- status: ENUM(active, suspended, inactive)
- last_login_at: TIMESTAMP
- password_changed_at: TIMESTAMP
- two_factor_enabled: BOOLEAN
- last_ip: VARCHAR(45)
- created_at: TIMESTAMP
- updated_at: TIMESTAMP
```

#### admin_roles
```
- id (PK): UUID/INT
- name: VARCHAR(100)
- description: TEXT
- is_system_role: BOOLEAN (cannot delete system roles)
- created_at: TIMESTAMP
- updated_at: TIMESTAMP
```

#### admin_permissions
```
- id (PK): UUID/INT
- name: VARCHAR(100) (unique, e.g., "users.view", "users.edit", "products.create")
- description: VARCHAR(255)
- resource: VARCHAR(50) (users, products, orders, etc.)
- action: VARCHAR(50) (view, create, edit, delete)
- created_at: TIMESTAMP
```

#### admin_role_permissions
```
- role_id (FK): UUID/INT
- permission_id (FK): UUID/INT
- PRIMARY KEY (role_id, permission_id)
```

#### audit_log
```
- id (PK): UUID/INT
- admin_id (FK): UUID/INT (who made the change)
- resource_type: VARCHAR(50) (user, product, order, etc.)
- resource_id: UUID/INT (ID of changed resource)
- action: VARCHAR(50) (create, update, delete, approve, reject)
- changes: JSON (old_value → new_value for each field)
- ip_address: VARCHAR(45)
- user_agent: VARCHAR(500)
- reason: VARCHAR(255) (optional, why action taken)
- created_at: TIMESTAMP (indexed)
```

#### system_configurations
```
- id (PK): UUID/INT
- config_key (UNIQUE): VARCHAR(100)
- config_value: TEXT
- config_type: VARCHAR(50) (string, int, boolean, json)
- description: VARCHAR(255)
- is_internal: BOOLEAN (hidden from some admins)
- created_at: TIMESTAMP
- updated_at: TIMESTAMP
- updated_by: UUID/INT
```

#### admin_notifications
```
- id (PK): UUID/INT
- admin_id (FK): UUID/INT
- notification_type: VARCHAR(50) (alert, warning, info)
- title: VARCHAR(255)
- message: TEXT
- related_resource: VARCHAR(255) (resource_type:resource_id)
- is_read: BOOLEAN
- created_at: TIMESTAMP
- read_at: TIMESTAMP
```

#### moderation_queue
```
- id (PK): UUID/INT
- resource_type: VARCHAR(50) (review, comment, product, etc.)
- resource_id: UUID/INT
- submitted_by: UUID/INT (member who created)
- submission_date: TIMESTAMP
- status: ENUM(pending, approved, rejected, archived)
- admin_notes: TEXT
- reviewed_by: UUID/INT (admin who reviewed)
- reviewed_at: TIMESTAMP
- reason_for_action: VARCHAR(255)
- context: JSON (preview of resource)
```

#### system_activity
```
- id (PK): UUID/INT
- member_id (FK): UUID/INT
- activity_type: VARCHAR(50) (login, purchase, product_view, etc.)
- resource_type: VARCHAR(50)
- resource_id: UUID/INT
- ip_address: VARCHAR(45)
- user_agent: VARCHAR(500)
- metadata: JSON
- created_at: TIMESTAMP
```

---

## 5. API Basic Structure

### Dashboard Endpoints
```
GET    /admin/dashboard          - Get dashboard metrics
GET    /admin/dashboard/stats    - Get detailed statistics
GET    /admin/dashboard/activity - Get recent activity
```

### User Management Endpoints
```
GET    /admin/users              - List all users (paginated)
GET    /admin/users/:id          - Get user details
POST   /admin/users              - Create new user
PUT    /admin/users/:id          - Update user
DELETE /admin/users/:id          - Deactivate user
PUT    /admin/users/:id/role     - Change user role
PUT    /admin/users/:id/status   - Change user status
```

### Role and Permission Endpoints
```
GET    /admin/roles              - List all roles
GET    /admin/roles/:id          - Get role details
POST   /admin/roles              - Create role
PUT    /admin/roles/:id          - Update role
DELETE /admin/roles/:id          - Delete role (not system roles)
GET    /admin/permissions        - List all permissions
PUT    /admin/roles/:id/permissions - Update role permissions
```

### Audit Log Endpoints
```
GET    /admin/audit-log          - View audit log (filtered)
GET    /admin/audit-log/:id      - Get specific audit entry
GET    /admin/audit-log/user/:userId - Get user's actions
GET    /admin/audit-log/resource/:resourceId - Get changes to resource
```

### Configuration Endpoints
```
GET    /admin/configuration      - List all configurations
GET    /admin/configuration/:key - Get specific configuration
PUT    /admin/configuration/:key - Update configuration
POST   /admin/configuration/bulk - Bulk update configurations
```

### Content Management Endpoints
```
GET    /admin/content            - List content items
GET    /admin/content/:id        - Get content item
POST   /admin/content            - Create content item
PUT    /admin/content/:id        - Update content item
DELETE /admin/content/:id        - Delete content item
```

### Moderation Endpoints
```
GET    /admin/moderation         - List pending items
POST   /admin/moderation/:id/approve - Approve item
POST   /admin/moderation/:id/reject - Reject item
PUT    /admin/moderation/:id     - Update item (before decision)
GET    /admin/moderation/history - View moderation history
```

### Reporting Endpoints
```
GET    /admin/reports            - List available reports
POST   /admin/reports/:type      - Generate report
GET    /admin/reports/:id/download - Download generated report
GET    /admin/reports/sales      - Sales report
GET    /admin/reports/users      - User growth report
GET    /admin/reports/orders     - Order analytics
GET    /admin/reports/products   - Product performance
```

### System Monitoring Endpoints
```
GET    /admin/health             - System health status
GET    /admin/health/services    - Detailed service status
GET    /admin/logs               - View system logs
```

---

## 6. Permissions

### System Permissions (Examples)
```
users.view              - View list of users
users.create            - Create new user
users.edit              - Edit user details
users.delete            - Delete user
users.change_role       - Change user role
roles.manage            - Create/edit/delete roles
audit.view              - View audit logs
content.manage          - Create/edit/delete content
moderation.review       - Review pending content
reports.generate        - Generate reports
configuration.view      - View configuration
configuration.edit      - Edit configuration
system.monitor          - View system health
```

### Admin Only
- All endpoints require at least one permission
- Super Admin has all permissions
- Roles define permission combinations
- Lower-level admins cannot access higher functions

---

## 7. Prohibitions

### Absolute Prohibitions
- **Cannot**: Delete Super Admin role
- **Cannot**: Change own role (prevent privilege escalation)
- **Cannot**: Create user without role assignment
- **Cannot**: Modify audit log (audit trail must be immutable)
- **Cannot**: Bypass moderation for flagged content
- **Cannot**: Update configuration without audit log entry
- **Cannot**: Mass delete users without confirmation

### Conditional Prohibitions
- **Unless Super Admin**: Cannot edit other admins' roles
- **Unless approved by 2+ admins**: Cannot change critical configurations
- **Unless at least 1 Super Admin remains**: Cannot demote all super admins

---

## 8. Security Standards

### Admin Access
- All admin access requires strong authentication (2FA mandatory)
- IP whitelisting optional for admin endpoints
- Session timeout after 15 minutes of inactivity
- All admin actions logged with timestamp, IP, user agent
- Failed login attempts tracked and account locked after threshold

### Configuration Security
- Sensitive configurations (API keys, secrets) encrypted at rest
- Configuration changes logged with before/after values
- Bulk configuration updates require approval
- Configuration backups taken before changes
- Rollback capability for recent changes

### Audit Log Security
- Audit logs immutable (write-once, cannot edit/delete)
- Audit logs encrypted at rest
- Audit logs backed up separately from main data
- Retention of audit logs: minimum 1 year, recommended 7 years
- Regular audit log analysis for anomalies

### Permission System
- Principle of least privilege enforced
- Default deny (permissions explicitly granted, not implied)
- Permission checks on every API call
- Role-based access control (RBAC) implemented
- Regular permission audits and cleanup

---

## 9. Acceptance Criteria

### Dashboard
- ✅ Dashboard displays all key metrics (users, orders, revenue)
- ✅ Metrics update in real-time or near real-time
- ✅ Recent activity feed shows latest actions
- ✅ Alert section highlights critical issues

### User Management
- ✅ Admin can view all users with filters
- ✅ Admin can create new admin users
- ✅ Admin can edit user details
- ✅ Admin can change user roles
- ✅ Admin can suspend/activate users
- ✅ Cannot edit own role

### Roles and Permissions
- ✅ Roles can be created with specific permissions
- ✅ Permissions properly enforce access (403 if denied)
- ✅ Role changes take effect immediately
- ✅ System roles cannot be deleted

### Audit Log
- ✅ All admin actions logged
- ✅ Audit log is immutable
- ✅ Filtering by user, action, resource works
- ✅ Detailed change tracking shows before/after values
- ✅ Timestamps accurate and in correct timezone

### Configuration
- ✅ Configurations can be viewed
- ✅ Configurations can be updated
- ✅ Invalid configurations rejected
- ✅ Changes logged in audit trail
- ✅ Cached configurations invalidated on update

### Moderation
- ✅ Pending items displayed in queue
- ✅ Admin can approve items
- ✅ Admin can reject items with reason
- ✅ Admin can edit content before deciding
- ✅ Moderation history tracked

### Reporting
- ✅ Reports generated with correct data
- ✅ Reports can be exported (CSV, PDF, Excel)
- ✅ Date range filtering works
- ✅ Report generation includes timestamps
- ✅ Large reports handle gracefully

---

## 10. Integration Points

### Dependency Services
- **Member System** (01_): For user/admin info
- **Notification Service** (06_): For admin alerts
- **All other modules**: Trigger audit log entries, require permission checks

### Integration Hooks
- On user action: Log to activity log
- On sensitive change: Alert admin, audit log
- On moderation decision: Notify affected user
- On configuration change: Invalidate caches, audit log
- On role change: Update user permissions immediately

---

## 11. Configuration Parameters

| Parameter | Default | Min | Max | Notes |
|-----------|---------|-----|-----|-------|
| Admin session timeout (min) | 15 | 5 | 480 | Inactivity timeout |
| Audit log retention (days) | 2555 | 365 | 3650 | 7 years recommended |
| 2FA required for admins | true | - | - | Mandatory security |
| Failed login limit | 5 | 1 | 20 | Before account lock |
| Lockout duration (min) | 30 | 5 | 1440 | Auto-unlock time |
| Max bulk operation items | 1000 | 10 | 10000 | Limit per operation |
| Moderation review SLA (hours) | 24 | 1 | 168 | Target review time |
| Configuration backup frequency | daily | - | - | Before updates |
| Audit log backup frequency | daily | - | - | Separate storage |

---

## 12. Known Dependencies

- **Admin System** depends on **Member System** (01_) for user data
- **Admin System** integrates with all other modules for audit logging
- **Admin System** integrates with **Notification System** (06_) for alerts
- All modules require Admin System for permission checks

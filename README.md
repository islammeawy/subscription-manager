# Subscription Tracker API

A production-grade, secure RESTful API for managing recurring subscriptions, handling automated reminder workflows via Upstash/QStash, and enforcing robust role-based access control and security telemetry.

---

## 🔒 Security & Authorization Architecture

### 1. Authentication & Session Management
- **JWT Authentication**: Pass tokens in the standard `Authorization: Bearer <token>` header or via HTTP-only cookie `token`.
- **Registration Role Isolation**: Public user registration (`POST /api/v1/auth/register`) strictly assigns the default role `user`. Elevated roles cannot be injected during registration.
- **Security Telemetry**: Authentication and authorization failures are systematically logged with request context, method, path, and client IP without recording sensitive credentials.

### 2. Authorization & Least Privilege
- **Profile Protection (`GET /api/v1/users/:id`)**: Protected by strict owner-or-admin checks. Only the account owner or a verified administrator can view user profile details. Non-owners receive a `403 Forbidden` and an audit entry is logged.
- **Subscription Ownership**: All subscription modifications, cancellations, and user-specific views enforce strict owner or admin validation.
- **Admin Endpoints**: Endpoints such as `GET /api/v1/users/`, `GET /api/v1/subscriptions/admin/all`, and `PATCH /api/v1/users/:id/role` require `role: 'admin'`.

### 3. Workflow Webhook Protection (`POST /api/v1/workflow/subscription/reminders`)
- Intended exclusively for Upstash Workflow and QStash event triggers.
- **QStash Signature Verification**: Cryptographically verified via `@upstash/workflow` when `QSTASH_CURRENT_SIGNING_KEY` and `QSTASH_NEXT_SIGNING_KEY` are provided.
- **Workflow Secret Token**: Configurable `WORKFLOW_SECRET` verified via the `x-workflow-secret` header for defense-in-depth and local/testing workflows.
- Direct unauthorized requests from external sources without valid credentials return `401 Unauthorized`.

---

## 👥 Admin Creation & Role Management

Since public registration cannot assign administrative privileges, admins can be created or promoted via secure channels:

### Option 1: CLI Provisioning Script (Recommended)
Run the administrative provisioning CLI tool directly in the environment:

```bash
# Create a new administrator account
npm run create-admin -- --email admin@example.com --username admin --password SecurePassword123

# Or promote an existing registered user to administrator
npm run create-admin -- --promote --email user@example.com
# or by username:
npm run create-admin -- --promote --username existinguser
```

### Option 2: Admin-Only Role Management Endpoint
An existing administrator can promote or demote users using the authenticated API endpoint:

- **Endpoint**: `PATCH /api/v1/users/:id/role`
- **Headers**: `Authorization: Bearer <ADMIN_JWT>`
- **Body**:
  ```json
  {
    "role": "admin"
  }
  ```
- *Note*: The system prevents demoting the sole remaining administrator to prevent administrative lockout.

---

## 📋 API Endpoints Reference

### Authentication (`/api/v1/auth`)
| Method | Endpoint | Access | Description |
| :--- | :--- | :--- | :--- |
| `POST` | `/api/v1/auth/register` | Public | Register new account (default role: `user`) |
| `POST` | `/api/v1/auth/login` | Public | Login with email/username and password |
| `POST` | `/api/v1/auth/logout` | Public | Clear session cookie |

### Users (`/api/v1/users` or `/api/v1/user`)
| Method | Endpoint | Access | Description |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/v1/users` | Admin | List all registered users |
| `GET` | `/api/v1/users/:id` | Owner / Admin | Get user profile (403 for other users) |
| `GET` | `/api/v1/users/:id/subscriptions` | Owner / Admin | Get subscriptions for a specific user |
| `PATCH` | `/api/v1/users/:id/role` | Admin | Update user role (`user` or `admin`) |

### Subscriptions (`/api/v1/subscriptions` or `/api/v1/subscription`)
| Method | Endpoint | Access | Description |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/v1/subscriptions` | Authenticated | List current user's subscriptions |
| `GET` | `/api/v1/subscriptions/:id` | Owner / Admin | Get subscription details by ID |
| `POST` | `/api/v1/subscriptions` | Authenticated | Create a new subscription and trigger reminder workflow |
| `PUT` | `/api/v1/subscriptions/:id` | Owner | Update subscription details |
| `PATCH` | `/api/v1/subscriptions/:id/cancel` | Owner | Cancel an active subscription |
| `GET` | `/api/v1/subscriptions/upcoming-renewals` | Authenticated | Get user's upcoming subscription renewals |
| `GET` | `/api/v1/subscriptions/active` | Authenticated | Get user's active subscriptions |
| `GET` | `/api/v1/subscriptions/expired` | Authenticated | Get user's expired subscriptions |
| `GET` | `/api/v1/subscriptions/canceled` | Authenticated | Get user's canceled subscriptions |
| `GET` | `/api/v1/subscriptions/admin/all` | Admin | List all subscriptions across all users |

### Workflow Webhook (`/api/v1/workflow`)
| Method | Endpoint | Access | Description |
| :--- | :--- | :--- | :--- |
| `POST` | `/api/v1/workflow/subscription/reminders` | Upstash / Secret | Trigger and process automated reminder workflows |

---

## ⚙️ Environment Variables

Create `.env.development.local` or `.env.production.local` with the following configuration:

```env
# Server
PORT=5500
SERVER_URL="http://localhost:5500"
NODE_ENV=development

# Database
DATABASE_URL="mongodb+srv://<user>:<password>@cluster.mongodb.net/dbname"

# Security & JWT
JWT_SECRET="your-256-bit-secret"
JWT_EXPIRES_IN="1d"
Arcjet_KEY="your-arcjet-key"
Arcjet_ENV="development"

# Upstash & QStash Workflow
QSTASH_URL="http://127.0.0.1:8080"
QSTASH_TOKEN="your-qstash-token"
QSTASH_CURRENT_SIGNING_KEY="your-current-signing-key"
QSTASH_NEXT_SIGNING_KEY="your-next-signing-key"
WORKFLOW_SECRET="your-workflow-shared-secret"

# Email Notifications (Nodemailer)
EMAIL_USER="your-email@gmail.com"
EMAIL_PASSWORD="your-email-app-password"
```

---

## 🚀 Getting Started

```bash
# Install dependencies
npm install

# Start development server with live reload
npm run dev

# Start production server
npm start
```

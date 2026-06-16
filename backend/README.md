# ⚙️ FreshCart Backend - Node Express API Server

[![Bun](https://img.shields.io/badge/Bun-%23000000.svg?style=flat&logo=bun&logoColor=white)](https://bun.sh)
[![Express](https://img.shields.io/badge/Express-000000?style=flat&logo=express&logoColor=white)](https://expressjs.com)
[![Prisma](https://img.shields.io/badge/Prisma-2D3748?style=flat&logo=prisma&logoColor=white)](https://www.prisma.io)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-316192?style=flat&logo=postgresql&logoColor=white)](https://www.postgresql.org)
[![Inngest](https://img.shields.io/badge/Inngest-FF4F00?style=flat&logo=inngest&logoColor=white)](https://www.inngest.com)

This subdirectory contains the backend application for FreshCart. It is a RESTful API built with Express (v5) and TypeScript, running on the Bun runtime. The backend uses Prisma ORM to connect to a PostgreSQL database, handles file uploads via Multer and Cloudinary, processes payments using Stripe, and manages background tasks using Inngest.

---

## 📁 Project Structure

The server application is organized inside the following folders:

```
backend/
├── config/                 # Initializers for third-party service connections
│   ├── cloudinary.ts       # Cloudinary media storage client initialization
│   ├── multer.ts           # Multipart form file parser config
│   ├── nodemailer.ts       # Nodemailer SMTP mail transport client
│   └── prisma.ts           # Shared database Prisma client instance
├── middlewares/            # Express request interceptor pipelines
│   ├── admin.middlewares.ts# Validates admin access against email lists
│   └── auth.middlewares.ts # Validates customer JWT credentials
├── prisma/                 # Database schema models and migrations
│   └── schema.prisma       # Relational models, fields, and indices definition
├── src/
│   ├── controllers/        # Request handlers containing business logic
│   │   ├── auth.controllers.ts # Handles customer logins & registration
│   │   ├── order.controllers.ts# Manages cart orders & payment checkout
│   │   └── product.controllers.ts# Handles product lookups & catalog edits
│   ├── inngest/            # Event-driven background tasks and worker actions
│   ├── routes/             # Path route maps linking urls to controllers
│   ├── types/              # Custom TypeScript request definitions
│   └── server.ts           # Express server setup and startup entrypoint
├── seed.ts                 # Database seeding engine script
└── package.json            # Run scripts and package dependencies
```

---

## 🔁 Request Lifecycle Pipeline

The server processes every request through a structured middleware chain:

```mermaid
graph TD
    %% Styling
    classDef edgeNode fill:#fff,stroke:#333,stroke-width:1px;
    classDef mwNode fill:#fff9c4,stroke:#fbc02d,stroke-width:2px;
    classDef ctrlNode fill:#e1f5fe,stroke:#0288d1,stroke-width:2px;
    classDef dbNode fill:#fbe9e7,stroke:#d84315,stroke-width:2px;

    ClientRequest([Incoming HTTP Request]):::edgeNode
    
    subgraph ExpressStack ["Express Request Pipeline"]
        Helmet[Helmet Header Protection]:::mwNode
        CORS[CORS Checks]:::mwNode
        RateLimit[Rate Limiting Checks]:::mwNode
        BodyParse[Body Parsers: JSON / URLencoded]:::mwNode
        Router[Router Engine]:::mwNode
        AuthGuard[Auth Token Validator]:::mwNode
        AdminGuard[Admin Privilege Check]:::mwNode
        Controller[Target Controller Action]:::ctrlNode
    end
    
    subgraph DatabaseStack ["Database Engine"]
        PrismaORM[Prisma Client Engine]:::dbNode
        Postgres[(PostgreSQL Instance)]:::dbNode
    end

    ClientRequest --> Helmet
    Helmet --> CORS
    CORS --> RateLimit
    RateLimit --> BodyParse
    BodyParse --> Router
    Router --> AuthGuard
    AuthGuard --> AdminGuard
    AdminGuard --> Controller
    Controller --> PrismaORM
    PrismaORM --> Postgres
    Postgres --> PrismaORM
    PrismaORM --> Controller
    Controller --> SendResponse([HTTP JSON Response]):::edgeNode
```

### Middleware Stage Details
1. **Security & Header Sanitization:** [server.ts](file:///c:/Programming/Grocery-Delivery-App/backend/src/server.ts) applies `helmet` to set standard HTTP security headers and configures CORS parameters.
2. **Rate Limiting:** Requests are evaluated against security rate limits to protect server resources.
3. **Body Parsing:** Handles incoming request payloads, parsing them into standard JSON structures.
4. **Auth & Privilege Guards:** Security interceptors decode JWT tokens, extract user information, and check user permissions before invoking controller actions.
5. **Controller Actions:** Process request inputs, query database entities, update transaction logs, and return responses using standard HTTP status codes.

---

## 🗄️ Database Schema & Index Design

The database schema is defined in [schema.prisma](file:///c:/Programming/Grocery-Delivery-App/backend/prisma/schema.prisma) and uses database indexes to optimize query performance:

* **User Email Index (`@@index([email])`):** Speeds up user lookups during authentication and registration validation.
* **Address User Index (`@@index([userId, isDefault])`):** Optimizes coordinate resolution when displaying a customer's default delivery address during checkout.
* **Product Catalog Index (`@@index([category, price])`):** Speeds up catalog filtering when customers filter products by price or category.
* **Order Status Index (`@@index([status, createdAt])`):** Speeds up queries on the admin dashboard and driver panels, which frequently fetch orders sorted by status and creation date.

---

## 💳 Payment Gateway (Stripe Integration)

Payments are integrated using Stripe hosted checkout pages:

* **Checkout Session Creation ([order.controllers.ts](file:///c:/Programming/Grocery-Delivery-App/backend/src/controllers/order.controllers.ts)):** When a customer submits an order, the server calculates item prices, creates an unpaid order entry, and generates a Stripe checkout session URL.
* **Stripe Webhook Signature Verification ([stripeWebhooks.controllers.ts](file:///c:/Programming/Grocery-Delivery-App/backend/src/controllers/stripeWebhooks.controllers.ts)):** When a payment is processed, Stripe sends a webhook notification to `/api/v1/stripe/webhook`. The server verifies the webhook signature using the `STRIPE_WEBHOOK_SECRET` before updating the order status to paid in the database.

---

## 🔮 Background Job Management (Inngest Worker)
Asynchronous tasks like email delivery are managed using Inngest, which keeps the main API fast:

* **Event-Driven Execution:** When a user registers, the server triggers an `app/user.registered` event. The Inngest worker intercepts this event to send a welcome email in the background.
* **Development Endpoint:** During development, background processes can be monitored and managed by running the Inngest local dev server alongside your backend.

---

## 🔑 Environment Variables
Configure the backend using a [backend/.env](file:///c:/Programming/Grocery-Delivery-App/backend/.env) file:

```env
# Server Port Configuration
PORT=8000

# Database Connection URL (e.g. Neon serverless URL)
DATABASE_URL="postgresql://user:password@subdomain.neon.tech/dbname?sslmode=require"

# JWT token signing secret
JWT_SECRET="define-a-secure-secret-key-phrase"

# List of administrators allowed access to admin actions
ADMIN_EMAIL="admin@freshcart.com"

# Authorized CORS client origin path
CLIENT_URL="http://localhost:5173"

# Cloudinary CDN credentials
CLOUDINARY_CLOUD_NAME="your-cloudinary-name"
CLOUDINARY_API_KEY="your-cloudinary-key"
CLOUDINARY_API_SECRET="your-cloudinary-secret"

# Stripe merchant keys
STRIPE_SECRET_KEY="sk_test_your_secret_key"
STRIPE_WEBHOOK_SECRET="whsec_your_webhook_secret"

# Outbound Mail configurations (SMTP settings)
SMTP_HOST="smtp.mailtrap.io"
SMTP_PORT=2525
SMTP_USER="smtp-username"
SMTP_PASS="smtp-password"
EMAIL_FROM="orders@freshcart.com"
```

---

## 🚀 Server Run Commands

Manage and run the backend application using the following commands in the `backend/` directory:

### Install Dependencies
```bash
bun install
```

### Start Development Server
```bash
# Runs the server inside a Nodemon wrapper to auto-reload on file edits
bun run server
```
The server will start on `http://localhost:8000`.

### Database Migrations
```bash
# Push schema designs to Neon PostgreSQL database tables
bunx prisma db push

# Generate TypeScript client types
bunx prisma generate
```

### Seeding Catalog Products
```bash
# Runs seed.ts to populate the database with default categories and products
bun run seed
```
This is useful for quickly setting up a local database with realistic test catalog data.

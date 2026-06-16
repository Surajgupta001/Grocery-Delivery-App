# 🥬 FreshCart - Full-Stack Grocery Delivery Application

[![Bun](https://img.shields.io/badge/Bun-%23000000.svg?style=flat&logo=bun&logoColor=white)](https://bun.sh)
[![React](https://img.shields.io/badge/React-20232A?style=flat&logo=react&logoColor=61DAFB)](https://react.dev)
[![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=flat&logo=typescript&logoColor=white)](https://www.typescriptlang.org)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-38B2AC?style=flat&logo=tailwind-css&logoColor=white)](https://tailwindcss.com)
[![Express](https://img.shields.io/badge/Express-000000?style=flat&logo=express&logoColor=white)](https://expressjs.com)
[![Prisma](https://img.shields.io/badge/Prisma-2D3748?style=flat&logo=prisma&logoColor=white)](https://www.prisma.io)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-316192?style=flat&logo=postgresql&logoColor=white)](https://www.postgresql.org)
[![Stripe](https://img.shields.io/badge/Stripe-626CD9?style=flat&logo=stripe&logoColor=white)](https://stripe.com)
[![Inngest](https://img.shields.io/badge/Inngest-FF4F00?style=flat&logo=inngest&logoColor=white)](https://www.inngest.com)
[![Cloudinary](https://img.shields.io/badge/Cloudinary-3448C5?style=flat&logo=cloudinary&logoColor=white)](https://cloudinary.com)
[![Vercel](https://img.shields.io/badge/Vercel-000000?style=flat&logo=vercel&logoColor=white)](https://vercel.com)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

FreshCart is a world-class, production-ready, full-stack hyperlocal Grocery Delivery Application designed to connect customers, local store administrators, and delivery partners in real time. Built using a modern TypeScript stack powered by React, Bun, Express, Prisma, and PostgreSQL, the platform delivers high-performance order coordination, automated delivery assignment, live tracking, and Stripe-secured checkout.

---

## 📖 Table of Contents

1. [Project Overview](#project-overview)
2. [Features](#features)
3. [Tech Stack](#tech-stack)
4. [System Architecture](#system-architecture)
5. [Application Flow](#application-flow)
6. [Folder Structure](#folder-structure)
7. [Backend Request Lifecycle](#backend-request-lifecycle)
8. [Database Design](#database-design)
9. [Authentication Flow](#authentication-flow)
10. [API Design](#api-design)
11. [Environment Variables](#environment-variables)
12. [Local Development Setup](#local-development-setup)
13. [Security Considerations](#security-considerations)
14. [Performance Optimizations](#performance-optimizations)
15. [Future Improvements](#future-improvements)
16. [Screenshots](#screenshots)
17. [Deployment Guide](#deployment-guide)
18. [Contribution Guide](#contribution-guide)
19. [Coding Standards](#coding-standards)
20. [Developer Notes & Architectural Tradeoffs](#developer-notes--architectural-tradeoffs)

---

## 🌟 Project Overview

### Core Business Problem
Traditional e-commerce delivery logistics are designed around hub-and-spoke models with multi-day transit times. Local grocery delivery requires a **hyperlocal, real-time coordinate system** where order creation, inventory allocation, store packing, and delivery routing must occur inside a tight 30-to-60-minute window. FreshCart solves this complexity by providing an integrated system that coordinates:
* Real-time location-aware checkout and distance mapping.
* Multi-user portals tailored for Customers, Store Admins, and Delivery Drivers.
* Atomic order status transitions and secured verification handshakes.

### Key Target Users
1. **Customers:** Consumers seeking a fluid storefront to search fresh goods, manage delivery addresses, make secure card payments, and track their delivery route.
2. **Store Admins:** Operational managers monitoring store performance metrics, updating catalog stock and prices, and dispatching orders to active drivers.
3. **Delivery Partners:** Freelance couriers accepting orders, routing via live maps, updating order steps, and validating deliveries securely using dynamic OTP tokens.

---

## 🛠️ Features

### Customer Features
* **Authentication:** Secure registration and login with JWT stored in local storage, featuring request auto-injection.
* **Browse Products:** High-performance catalog browsing by dynamic category tags (Produce, Dairy, Pantry, etc.).
* **Search Products:** Client-side search and filtering matching price ranges, rating metrics, and stock thresholds.
* **Cart Management:** Highly responsive local state cart supporting item incrementation, price calculations, and item persistence.
* **Place Orders:** Secure credit card checkout backed by Stripe Hosted Checkout sessions.
* **Track Orders:** Dynamic visual timeline matching live order states with tracking maps driven by Leaflet.

### Admin Features
* **Operations Dashboard:** Aggregated business metrics including total revenue, order count, user count, and active delivery partners.
* **Catalog Management (CRUD):** Add, update, and remove products with instant image uploads directly linked to Cloudinary.
* **Order Dispatch Center:** Live order monitor displaying order contents, shipping destinations, and driver assignment selectors.
* **Partner Control:** Onboard and track courier status (Active/Inactive) and assign deliveries dynamically.

### Delivery Partner Features
* **Acceptance Portal:** Live dashboard showing newly assigned orders with customer delivery details.
* **Route Mapping:** Visual display of delivery destinations using interactive maps to coordinate pickups and drop-offs.
* **Status Updates:** Order state transition control panel (Placed $\rightarrow$ Preparing $\rightarrow$ Out for Delivery $\rightarrow$ Delivered).
* **Delivery Validation:** Secure OTP verification prompt requiring the driver to enter a customer-provided token to successfully close out an order.

---

## 💻 Tech Stack

| Layer | Technology | Purpose |
| :--- | :--- | :--- |
| **Frontend** | React (v19) | Component-driven, single-page application user interface |
| | TypeScript | Static typing to prevent runtime errors across application layers |
| | Tailwind CSS (v4) | Utility-first styling with modern performance compile |
| | React Router DOM (v7) | Declarative client-side layouts, parameters, and protected routing |
| | React Context API | Light-weight client state engines for `Auth` and `Cart` domains |
| **Backend** | Bun (v1.3.9+) | Fast all-in-one JavaScript/TypeScript runtime & package manager |
| | Express (v5) | Robust middleware-driven REST API server |
| | Prisma ORM | Type-safe schema generator and database query engine |
| | Inngest | Event-driven background job manager for serverless schedules |
| **Database** | PostgreSQL | Relational transactional engine for ACID compliance |
| | Neon | Serverless PostgreSQL database with branch environments |
| **Services** | Stripe | Merchant checkout session processing and secure webhook capture |
| | Cloudinary | Asset delivery network hosting product catalog image files |
| | Nodemailer | SMTP-driven delivery for registration welcomes and verification emails |

---

## 🏗️ System Architecture

FreshCart uses a modern client-server architecture. The frontend application runs in the user's browser, communicating with the backend API via HTTP. The server delegates heavy or asynchronous processing (such as email dispatching) to background worker systems, ensuring fast API response times.

```mermaid
graph TD
    %% Styling
    classDef client fill:#e0f7fa,stroke:#006064,stroke-width:2px;
    classDef server fill:#efebe9,stroke:#4e342e,stroke-width:2px;
    classDef storage fill:#efe8e0,stroke:#e65100,stroke-width:2px;
    classDef external fill:#f1f8e9,stroke:#33691e,stroke-width:2px;

    %% Components
    User((Customer / Admin / Driver))
    
    subgraph ClientTier ["Client Application Tier (React & Tailwind)"]
        FE[SPA Frontend]:::client
        Map[Leaflet Map Engine]:::client
    end
    
    subgraph APITier ["API Application Tier (Bun & Express)"]
        API[Express REST API Server]:::server
        Auth[JWT Authentication & RBAC]:::server
        Prisma[Prisma Client ORM]:::server
        InngestClient[Inngest Event Client]:::server
    end
    
    subgraph StorageTier ["Data Storage Tier"]
        DB[(Neon Serverless PostgreSQL)]:::storage
    end

    subgraph ExternalServices ["External Platform integrations"]
        Cloudinary[(Cloudinary CDN)]:::external
        StripeAPI[(Stripe Gateway)]:::external
        InngestEngine[Inngest Background Job Engine]:::external
        SMTP[SMTP Mail Server]:::external
    end

    %% Connections
    User -->|Interacts with| FE
    FE -->|Renders map markers| Map
    FE -->|Sends JSON requests| API
    API -->|Validates token| Auth
    API -->|Dispatches events| InngestClient
    API -->|Queries / Writes| Prisma
    Prisma -->|TCP Connection pool| DB
    
    %% Service routes
    API -->|Image Buffers| Cloudinary
    API -->|Checkout Sessions| StripeAPI
    StripeAPI -->|Webhook Signatures| API
    InngestClient -->|Triggers Actions| InngestEngine
    InngestEngine -->|Sends Emails| SMTP
    InngestEngine -.->|Webhooks back to| API
```

---

## 🔄 Application Flow

### User Registration Flow
```mermaid
sequenceDiagram
    autonumber
    actor User as Client Browser
    participant API as Express Auth Endpoint
    participant DB as PostgreSQL DB
    participant Inngest as Inngest Serverless Job

    User->>API: POST /api/v1/auth/register (name, email, password)
    API->>API: Validate email availability
    API->>API: Hash password via bcryptjs (10 rounds)
    API->>DB: Create User record
    DB-->>API: User Record Created (id, email)
    API->>Inngest: Trigger event 'app/user.registered' (userId, email, name)
    API->>API: Generate JWT (userId, email)
    API-->>User: Return 201 Created (Token + User Object)
    
    Note over Inngest, API: Background Task executes asynchronously
    Inngest->>Inngest: Render email template
    Inngest->>User: Send welcome notification email
```

### Login Flow
```mermaid
sequenceDiagram
    autonumber
    actor User as Client Browser
    participant API as Express Auth Endpoint
    participant DB as PostgreSQL DB

    User->>API: POST /api/v1/auth/login (email, password)
    API->>DB: Query User where email = input_email
    DB-->>API: Return User Record (or null)
    alt User not found or password mismatch
        API-->>User: Return 401 Unauthorized
    else Passwords match
        API->>API: Sign JWT with user credentials (id, email)
        API-->>User: Return 200 OK (JWT Token + Profile payload)
        Note over User: JWT saved to LocalStorage
    end
```

### Product Purchase Flow
```mermaid
sequenceDiagram
    autonumber
    actor User as Client Browser
    participant API as Express Order Endpoint
    participant Stripe as Stripe Payment Gateway
    participant DB as PostgreSQL DB

    User->>API: POST /api/v1/orders (items, addressId)
    API->>DB: Fetch Product stocks and verify pricing
    DB-->>API: Validated products list
    API->>DB: Create Order record (status: "Placed", isPaid: false)
    DB-->>API: Order Object (orderId, total)
    API->>Stripe: Create checkout session (orderId, total)
    Stripe-->>API: Return checkout Session URL
    API-->>User: Redirect to Stripe Checkout Page
    User->>Stripe: Authorize Credit Card payment
    Stripe-->>User: Redirect back to /orders with success query param
    Stripe->>API: POST /api/v1/stripe/webhook (checkout.session.completed)
    Note over API: Verify webhook signature header
    API->>DB: Update Order (isPaid: true)
    DB-->>API: Updated Order record
```

### Order Delivery Flow
```mermaid
sequenceDiagram
    autonumber
    actor Customer as Customer Client
    actor Driver as Delivery Driver Client
    participant API as Express Delivery Endpoint
    participant DB as PostgreSQL DB

    Note over API: Order status updated to "Prepared"
    Driver->>API: PATCH /api/v1/delivery/accept (orderId)
    API->>DB: Assign deliveryPartnerId & update status to "Out for Delivery"
    API->>DB: Generate random 6-digit deliveryOtp
    DB-->>API: Order with OTP Saved
    API-->>Driver: Return Success (Map coordinates + route details)
    Customer->>API: GET /api/v1/orders/:id (Poll status & location)
    API-->>Customer: Return Status "Out for Delivery" + deliveryOtp
    Driver->>Customer: Arrives at shipping address
    Customer->>Driver: Verbalizes deliveryOtp
    Driver->>API: POST /api/v1/delivery/complete (orderId, otpCode)
    API->>API: Compare input OTP with database record
    alt OTP Matches
        API->>DB: Set status = "Delivered"
        API-->>Driver: Return 200 OK (Status update confirmed)
        Customer->>API: Status updates to "Delivered" on tracking map
    else OTP Mismatch
        API-->>Driver: Return 400 Bad Request (Invalid OTP)
    end
```

### Image Upload Flow
```mermaid
sequenceDiagram
    autonumber
    actor Admin as Admin Client
    participant API as Express Upload Endpoint
    participant Multer as Multer Middleware
    participant Cloudinary as Cloudinary SDK
    participant DB as PostgreSQL DB

    Admin->>API: POST /api/v1/upload (Form data with image binary file)
    API->>Multer: Parse file from multipart boundary
    Multer->>Multer: Check size & MIME type (image/png, image/jpeg)
    Multer-->>API: Expose File Buffer memory reference
    API->>Cloudinary: Upload buffer streaming
    Cloudinary-->>API: Return asset URL (https://res.cloudinary.com/...)
    API-->>Admin: Return 200 OK (image URL)
    Admin->>API: POST /api/v1/products (product detail payload including image URL)
    API->>DB: Create Product record
    DB-->>API: Product Saved
    API-->>Admin: Return 201 Created
```

---

## 📂 Folder Structure

The project is structured as a monorepo splits containing separate frontend and backend directories:

```
Grocery-Delivery-App/
├── frontend/                 # Client SPA Application
│   ├── src/
│   │   ├── assets/           # Static assets (images, default icons)
│   │   ├── components/       # Shared reusable UI elements
│   │   │   ├── Checkout/     # Checkout and address selection cards
│   │   │   ├── Delivery/     # Delivery routing panels
│   │   │   ├── Home/         # Home hero components and carousels
│   │   │   └── OrderTracking/# Map renderers and visual progress bars
│   │   ├── config/           # Axios interceptors and baseUrl setup
│   │   ├── context/          # Context API stores for Auth and Cart state
│   │   ├── pages/            # Page-level route views
│   │   │   ├── admin/        # Admin portal routes
│   │   │   └── delivery/     # Courier driver routes
│   │   ├── types/            # TypeScript frontend interface typings
│   │   ├── App.tsx           # Route definitions and entry configuration
│   │   └── index.css         # Styling system configuration
│   └── package.json          # Frontend dependencies & run scripts
│
├── backend/                  # Server Express API
│   ├── config/               # Prisma, Nodemailer, and Cloudinary clients
│   ├── middlewares/          # Request validation, auth guard, admin guard
│   ├── prisma/               # Prisma schema and deployment scripts
│   ├── src/
│   │   ├── controllers/      # Route endpoint controllers mapping database logic
│   │   ├── inngest/          # Background task queue and email functions
│   │   ├── routes/           # REST endpoints definition
│   │   ├── types/            # Custom TypeScript types
│   │   └── server.ts         # Express server setup and startup entrypoint
│   ├── seed.ts               # Database product seed engine
│   └── package.json          # Backend dependencies & Bun execution scripts
```

### Folder Responsibilities

* **frontend/src/components:** Home to all presentation-level UI structures. Sub-components are grouped by operational domains (checkout, maps) to facilitate maintainability.
* **frontend/src/context:** Implements lightweight global state engines. This handles system-wide concerns like authentication status and user shopping cart state without introducing complex third-party tools.
* **frontend/src/pages:** Represents individual screen layouts. These handle URL parameters, data fetching triggers, and compose layout containers.
* **backend/config:** Initializers for external API platforms. Instantiates the Prisma database wrapper, Cloudinary SDK, and SMTP mail transports.
* **backend/middlewares:** Request interceptors validating authorization states, evaluating role access levels, and sanitizing payloads.
* **backend/src/controllers:** Request handlers that extract payload inputs, query the database, process transactions, and formulate HTTP responses.
* **backend/src/routes:** Defines path routing and binds controllers to standard REST paths.

---

## 🔄 Backend Request Lifecycle

The backend applies a strict pipeline flow for every request to guarantee security, performance, and uniform error reporting.

```mermaid
graph LR
    %% Styles
    classDef client fill:#e0f7fa,stroke:#006064,stroke-width:2px;
    classDef mw fill:#fff9c4,stroke:#fbc02d,stroke-width:2px;
    classDef ctrl fill:#e1f5fe,stroke:#0288d1,stroke-width:2px;
    classDef db fill:#fbe9e7,stroke:#d84315,stroke-width:2px;

    %% Nodes
    Req([HTTP Request]):::client
    Router[Express Router]:::mw
    RateLimit[Rate Limiter]:::mw
    AuthGuard[Auth Middleware]:::mw
    AdminGuard[Admin Check]:::mw
    Controller[Controller Handler]:::ctrl
    Prisma[Prisma Client]:::db
    Postgres[(PostgreSQL Database)]:::db
    Res([HTTP JSON Response]):::client

    %% Links
    Req --> Router
    Router --> RateLimit
    RateLimit --> AuthGuard
    AuthGuard --> AdminGuard
    AdminGuard --> Controller
    Controller --> Prisma
    Prisma --> Postgres
    Postgres --> Prisma
    Prisma --> Controller
    Controller --> Res
```

### Request Lifecycle Details
1. **Network Intake:** The client transmits a request containing credentials, target endpoint paths, and parameters.
2. **Global Middlewares:**
   * [server.ts](file:///c:/Programming/Grocery-Delivery-App/backend/src/server.ts) applies safety configurations via `helmet()`.
   * Requests are checked against `cors()` origins and sent through the rate limit middleware.
3. **Route Resolution:** The Router maps request paths and HTTP methods (e.g., `POST /api/v1/products`).
4. **Authentication Check:** The auth interceptor parses and validates JWT tokens in authorization headers, matching client details to request context.
5. **Authorization Middleware:** Role checks are executed. For administrative paths, [admin.middlewares.ts](file:///c:/Programming/Grocery-Delivery-App/backend/middlewares/admin.middlewares.ts) validates user email mappings against environment lists.
6. **Controller Dispatch:** The designated controller executes, parses query strings, and validates data payloads.
7. **ORM Execution:** The controller queries the PostgreSQL instance using the Prisma Client.
8. **JSON Serialization:** Results are mapped back to response payloads and returned with matching HTTP status codes.

---

## 🗄️ Database Design

The relational database architecture is designed to enforce data integrity and enable fast query resolution through indexes.

```mermaid
erDiagram
    USER {
        string id PK
        string name
        string email UK
        string password
        string phone
        string avatar
        datetime createdAt
        datetime updatedAt
    }

    ADDRESS {
        string id PK
        string userId FK
        string label
        string address
        string city
        string state
        string zip
        boolean isDefault
        float lat
        float lng
        datetime createdAt
        datetime updatedAt
    }

    PRODUCT {
        string id PK
        string name
        string description
        float price
        float originalPrice
        string image
        string category
        string unit
        int stock
        boolean isOrganic
        float rating
        int reviewCount
        datetime createdAt
        datetime updatedAt
    }

    ORDER {
        string id PK
        string userId FK
        json items
        json shippingAddress
        string paymentMethod
        float subtotal
        float deliveryFee
        float tax
        float total
        string status
        json statusHistory
        string deliveryPartnerId FK
        string deliveryOtp
        json liveLocation
        boolean isPaid
        datetime createdAt
        datetime updatedAt
    }

    DELIVERY_PARTNER {
        string id PK
        string name
        string email UK
        string password
        string phone
        string avatar
        string vehicleType
        boolean isActive
        datetime createdAt
        datetime updatedAt
    }

    USER ||--o{ ADDRESS : "has many"
    USER ||--o{ ORDER : "places"
    DELIVERY_PARTNER ||--o{ ORDER : "delivers"
```

### Relationship Design & Rationale
* **User $\rightarrow$ Address (One-to-Many):** A customer can store multiple addresses (e.g., Home, Office), but each address belongs to a single user. To prevent cascading leaks, deleting a User cascadingly deletes their linked Addresses (`onDelete: Cascade`).
* **User $\rightarrow$ Order (One-to-Many):** Customers can place multiple orders over time. Relational constraints prevent order logs from being deleted if a user profile changes.
* **DeliveryPartner $\rightarrow$ Order (One-to-Many):** An order can only have one assigned delivery courier at any time, while a driver can deliver multiple orders. Deleting a driver resets the order fields to null (`onDelete: SetNull`) to retain revenue history.
* **Products and Order Items:** Order items are captured using a static JSON snapshot in the `items` field. This decouples the order history from future catalog changes (like price changes or product deletions).

---

## 🔐 Authentication Flow

FreshCart uses token-based authentication and role-based access control.

```mermaid
graph TD
    Client[Client App] -->|1. Credentials| LoginAPI[Login API /auth/login]
    LoginAPI -->|2. Verify & Hash Check| DB[(PostgreSQL)]
    DB -->|3. Match Found| LoginAPI
    LoginAPI -->|4. Signs Token| JWT[JWT Signed with HMAC-SHA256]
    LoginAPI -->|5. Returns Token| Client
    Client -->|6. Saves Token| LocalStorage[(Local Storage)]
    
    subgraph Protected Request
        Client2[Client App] -->|7. Reads Token| Header[Headers: Authorization Bearer token]
        Header -->|8. Request API| Express[Express Server]
        Express -->|9. Auth Middleware| AuthMW[Verify Token Signature]
        AuthMW -->|Valid| Controller[Execute Controller]
        AuthMW -->|Expired/Invalid| Err[Return 401 Unauthorized]
    end
```

* **JWT Issuance:** Upon authentication, the server generates a token containing the user's ID and email, signed with a secret key using the HMAC-SHA256 algorithm.
* **Client Request Injection:** The React application intercepts outgoing requests and injects the stored JWT into the `Authorization` header.
* **Role Verification:** For admin endpoints, the server checks if the authenticated user's email is listed in the `ADMIN_EMAIL` environment variable. For delivery endpoints, it verifies driver credentials against the `DeliveryPartner` database table.

---

## 🌐 API Design

The API endpoints conform to REST standards, utilizing version prefix parameters, JSON payloads, and standard HTTP response status codes.

### Base Endpoint Configuration
All resource requests are directed to the base versioned route:
`http://localhost:8000/api/v1`

### HTTP Status Code Conventions
* `200 OK`: Successful lookup, edit, or delete requests.
* `201 Created`: Successful creation of a resource (e.g., registration, product upload).
* `400 Bad Request`: Validation failures or incorrect input formats.
* `401 Unauthorized`: Missing or invalid JWT credentials.
* `403 Forbidden`: Authenticated request lacking required role permissions.
* `404 Not Found`: Target resource or route does not exist.
* `500 Internal Error`: Unexpected server exceptions.

### Error Payload Format
All error responses return a standardized JSON structure to simplify client integration:
```json
{
  "success": false,
  "message": "Detailed description of the error cause"
}
```

---

## 🔑 Environment Variables

### Backend Configuration (`backend/.env`)

| Variable | Type | Description | Example |
| :--- | :--- | :--- | :--- |
| `PORT` | Number | Local port for Express API | `8000` |
| `DATABASE_URL` | String | Connection URI for Neon PostgreSQL | `postgres://user:pass@neon.db/dbname` |
| `JWT_SECRET` | String | Secret key for signing tokens | `super-secret-key-phrase` |
| `ADMIN_EMAIL` | String | Comma-separated list of admin emails | `admin@freshcart.com,ops@freshcart.com` |
| `CLIENT_URL` | String | Allowed CORS origins for the frontend | `http://localhost:5173` |
| `CLOUDINARY_CLOUD_NAME`| String | Cloud name for Cloudinary storage | `freshcartcloud` |
| `CLOUDINARY_API_KEY` | String | API credential key | `123456789012345` |
| `CLOUDINARY_API_SECRET`| String | API credential secret | `aBcdEfGhIjKlMnOpQrStUvWxYz` |
| `STRIPE_SECRET_KEY` | String | Private API key for Stripe gateway | `sk_test_...` |
| `STRIPE_WEBHOOK_SECRET`| String | Webhook endpoint verification secret | `whsec_...` |
| `SMTP_HOST` | String | Outbound email SMTP host | `smtp.resend.com` |
| `SMTP_PORT` | Number | Connection port for SMTP | `587` |
| `SMTP_USER` | String | Username for SMTP authentication | `resend` |
| `SMTP_PASS` | String | Password for SMTP authentication | `re_123456` |
| `EMAIL_FROM` | String | Outbound sender email address | `orders@freshcart.com` |

### Frontend Configuration (`frontend/.env`)

| Variable | Type | Description | Example |
| :--- | :--- | :--- | :--- |
| `VITE_API_BASE_URL` | String | Target backend entry path | `http://localhost:8000/api/v1` |
| `VITE_CURRENCY_SYMBOL` | String | UI display prefix for currency symbols | `$` |

---

## 🚀 Local Development Setup

To run FreshCart locally, complete the following setup steps in your terminal.

### Prerequisites
* [Bun](https://bun.sh) (v1.3.9 or higher) installed on your system.
* A running PostgreSQL instance (or a serverless Neon database).
* Cloudinary and Stripe test account credentials.

### Step-by-Step Installation

1. **Clone the Repository:**
   ```bash
   git clone https://github.com/your-username/Grocery-Delivery-App.git
   cd Grocery-Delivery-App
   ```

2. **Backend Setup:**
   ```bash
   cd backend
   # Install dependencies
   bun install
   ```
   Create a [backend/.env](file:///c:/Programming/Grocery-Delivery-App/backend/.env) file using the variables defined in the environment section.

3. **Prisma Setup & Database Seeding:**
   ```bash
   # Generate Prisma Client models
   bunx prisma generate
   
   # Run migrations to build tables
   bunx prisma db push
   
   # Populate the database with initial categories and products
   bun run seed
   ```

4. **Start the Backend:**
   ```bash
   # Run the backend with Nodemailer and file upload configurations
   bun run server
   ```
   The backend API will start on `http://localhost:8000`.

5. **Frontend Setup:**
   ```bash
   # Open a new terminal and navigate to the frontend directory
   cd ../frontend
   
   # Install dependencies
   npm install
   ```
   Create a [frontend/.env](file:///c:/Programming/Grocery-Delivery-App/frontend/.env) file and define:
   ```env
   VITE_API_BASE_URL="http://localhost:8000/api/v1"
   VITE_CURRENCY_SYMBOL="$"
   ```

6. **Start the Frontend:**
   ```bash
   npm run dev
   ```
   The frontend application will start on `http://localhost:5173`.

---

## 🔒 Security Considerations

FreshCart implements security best practices to protect user data and APIs:

* **Cryptographic Password Hashing:** User passwords are encrypted before database insertion using the `bcryptjs` library with a strength factor of 10 rounds. Cleartext credentials are never saved.
* **Token Authentication:** Secure routes are protected by Express middleware that decodes and validates JWT signatures, rejecting invalid or expired requests with a `401 Unauthorized` status.
* **Role-Based Authorization:** Access control is enforced using specific route middleware. Administrative endpoints check if the user is listed in `ADMIN_EMAIL`, while delivery functions require a driver scope.
* **Security Headers & CORS:** Express uses `helmet` middleware to set standard HTTP security headers. CORS configurations restrict cross-origin requests to trusted client origins defined in the env variables.
* **Rate Limiting:** IP-based request limits prevent denial-of-service (DoS) attempts on authentication endpoints (`/api/v1/auth/*`) and API routes.

---

## ⚡ Performance Optimizations

* **Database Indexes:** Schema definitions feature multi-column database indexes on search-intensive fields (such as `Product.category`, `Product.price`, `User.email`, and `Order.status`) to speed up database queries.
* **Asset CDN Delivery:** Product photos are processed and served via Cloudinary's content delivery network, using optimized image dimensions and formatting.
* **Gzip Compression:** Express utilizes `compression` middleware to compress response payloads before transit, reducing network latency for customers.
* **API Pagination:** Large lists of products are returned in paginated chunks to limit data payload sizes and database query overhead.

---

## 🔮 Future Improvements

While FreshCart is a fully functional MVP, the following upgrades are planned:

* **Redis Caching:** Cache product catalog lookups to reduce PostgreSQL query load.
* **WebSockets Integration:** Transition order tracking from REST polling to a WebSocket-based event stream for real-time driver coordinates.
* **Push Notifications:** Send order status updates using Firebase Cloud Messaging.
* **Native Payments:** Embed Stripe Elements directly on the checkout screen instead of redirecting users to hosted checkout pages.
* **Docker Deployment:** Dockerize the frontend and backend applications to simplify cloud deployments.

---

## 📸 Screenshots

To illustrate the user interface and platform layouts:

### Customer Landing Screen
```
+-------------------------------------------------------------+
|  FreshCart [Search products...]             [Cart (3)] [Profile] |
+-------------------------------------------------------------+
|  🔥 FLASH DEALS | Up to 50% Off Fresh organic vegetables     |
+-------------------------------------------------------------+
|  Categories: [Vegetables] [Dairy] [Pantry] [Frozen] [Meat] |
+-------------------------------------------------------------+
|  +--------------+  +--------------+  +--------------+       |
|  | Organic Apple|  | Fresh Milk   |  | Wheat Bread  |       |
|  | $2.99 / lb   |  | $1.99 / unit |  | $3.49 / unit |       |
|  | [Add to Cart]|  | [Add to Cart]|  | [Add to Cart]|       |
|  +--------------+  +--------------+  +--------------+       |
+-------------------------------------------------------------+
```

### Live Route Courier Tracking Map
```
+-------------------------------------------------------------+
|  Order Tracking: ID #20412-A                     [Delivering] |
+-------------------------------------------------------------+
|  [=== Placed === Prepared === Out for Delivery === Delivered] |
+-------------------------------------------------------------+
|  +-------------------------------------------------------+  |
|  | Map View (Leaflet Interface)                         |  |
|  |                                                       |  |
|  |      [Store Location]                                 |  |
|  |             \                                         |  |
|  |              \   o (Driver Icon moving...)            |  |
|  |               \                                       |  |
|  |             [Customer Home]                           |  |
|  +-------------------------------------------------------+  |
|  Your Secure Delivery OTP: 489210                           |
+-------------------------------------------------------------+
```

### Administrative Operations Dashboard
```
+-------------------------------------------------------------+
|  Admin Dashboard | Overview    [Products] [Orders] [Drivers]  |
+-------------------------------------------------------------+
|  +------------------+  +------------------+  +------------+ |
|  | Total Revenue    |  | Active Orders    |  | Active Cabs| |
|  | $12,481.50       |  | 42 Pending       |  | 8 Online   | |
|  +------------------+  +------------------+  +------------+ |
|  Recent Orders:                                             |
|  - #4912 Customer: Alice | Total: $48.20   | [Assign Driver]|
|  - #4911 Customer: Bob   | Total: $102.15  | Driver: John  |
+-------------------------------------------------------------+
```

---

## 📦 Deployment Guide

FreshCart is designed for quick deployment to serverless hosting platforms.

```mermaid
graph TD
    ClientApp[React Frontend Source] -->|Git Commit| Vercel[Vercel Serverless Hosting]
    Vercel -->|Serves Web Application| EndUser((User Browser))

    ServerApp[Express Backend Source] -->|Git Commit| Render[Railway / Render Services]
    Render -->|Executes API Server| EndUser

    PrismaConfig[Prisma Schema Configuration] -->|DB Push| Neon[Neon Serverless Postgres]
    Render -->|Reads / Writes Data| Neon

    AdminClient[Product Image Files] -->|Direct API Stream| Cloudinary[Cloudinary CDN]
    Render -->|Saves Reference URLs| Neon
```

### Deployment Locations
* **Frontend:** Hosted on Vercel using the Vite React static build preset. Configure `VITE_API_BASE_URL` in Vercel environment variables to point to your backend.
* **Backend:** Deployed to Railway, Render, or Fly.io. Configure your environment variables in the service dashboard.
* **Database:** Managed via Neon's serverless PostgreSQL service.
* **Images:** Uploaded to Cloudinary storage.

---

## 🤝 Contribution Guide

We welcome contributions to FreshCart! To submit code changes, follow these guidelines:

### Branch Naming Conventions
* Features: `feat/feature-name`
* Bug Fixes: `fix/bug-description`
* Documentation: `docs/readme-updates`
* Refactoring: `refactor/optimization-targets`

### Commit Message Format
We follow the **Conventional Commits** standard:
* `feat: add Stripe Checkout redirect integration`
* `fix: prevent duplicate card addition errors during checkout`
* `docs: update setup steps for local development`
* `chore: update Prisma schema constraints`

### Pull Request Workflow
1. Fork the repository and create your feature branch from `development`.
2. Install dependencies and verify your changes.
3. Commit your changes with clear, descriptive commit messages.
4. Push your branch to GitHub and open a Pull Request against the `development` branch.
5. Code reviews are required before merging branch commits.

---

## 📏 Coding Standards

To maintain clean and readable code, follow these conventions:

* **File and Folder Names:** Use PascalCase for React components (e.g., [ProductCard.tsx](file:///c:/Programming/Grocery-Delivery-App/frontend/src/components/ProductCard.tsx)) and camelCase for logic files, controllers, and routes (e.g., [auth.routes.ts](file:///c:/Programming/Grocery-Delivery-App/backend/src/routes/auth.routes.ts)).
* **Clean API Responses:** Route controllers must return structured JSON payloads including a `success` boolean indicator and a descriptive `message` key.
* **Strict TypeScript Types:** Avoid using `any`. Instead, define interfaces and types in `types/` directories.

---

## 📝 Developer Notes & Architectural Tradeoffs

### Why Bun?
Bun was selected over Node.js for the backend runtime due to its fast execution, built-in support for TypeScript, and rapid package installation times. This simplifies the development environment by removing the need for transpilers like `ts-node` or compilation steps during local development.

### Why Prisma?
Prisma provides a type-safe database client that auto-generates TypeScript types matching our database schema. While query builders like Knex or raw SQL provide slightly more performance optimization control, Prisma's developer experience, migrations manager, and schema design workflow reduce development time.

### Why PostgreSQL?
Hyperlocal grocery orders require transactions to handle payment processing, inventory updates, and courier assignments. PostgreSQL provides robust ACID compliance to guarantee that financial checkout processes and inventory limits remain consistent.

### Why Cloudinary?
Storing images directly on backend application servers uses significant disk space, slows down page load times, and complicates application scaling. Offloading media storage to Cloudinary's content delivery network (CDN) ensures fast image delivery and optimal compression.

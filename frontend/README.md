# 🖥️ FreshCart Frontend - React Single Page Application (SPA)

[![React](https://img.shields.io/badge/React-20232A?style=flat&logo=react&logoColor=61DAFB)](https://react.dev)
[![Vite](https://img.shields.io/badge/Vite-646CFF?style=flat&logo=vite&logoColor=white)](https://vite.dev)
[![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=flat&logo=typescript&logoColor=white)](https://www.typescriptlang.org)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-38B2AC?style=flat&logo=tailwind-css&logoColor=white)](https://tailwindcss.com)
[![Leaflet](https://img.shields.io/badge/Leaflet-199900?style=flat&logo=leaflet&logoColor=white)](https://leafletjs.com)

This subdirectory contains the frontend application for FreshCart. It is a single-page application (SPA) built using React (v19), TypeScript, and Tailwind CSS (v4), compiled using Vite. The application supports user authentication, catalog browsing, cart management, stripe checkout redirects, and live Leaflet-based delivery tracking.

---

## 📁 Project Structure

The client application code is organized within the `src/` directory:

```
frontend/
├── public/                 # Static assets (favicons, manifest metadata)
├── src/
│   ├── assets/             # Default catalog images and SVG icons
│   ├── components/         # Reusable UI component modules
│   │   ├── Checkout/       # Delivery address forms & shipping selection cards
│   │   ├── Delivery/       # Driver dashboard lists & maps
│   │   ├── Home/           # Hero promotions & dynamic banners
│   │   │   └── Banner.tsx  # Dynamic campaign discount visualizer
│   │   └── OrderTracking/  # Live courier routing maps and progress indicators
│   ├── config/             # Connection settings and interceptors
│   │   └── api.ts          # Axios client instance with headers injection
│   ├── context/            # React Context API global state managers
│   │   ├── AuthContext.tsx # User session, login, and registration states
│   │   ├── CartContext.tsx # Shopping cart items array, actions & totals
│   │   ├── useAuth.ts      # Custom hook interface for authentication
│   │   └── useCart.ts      # Custom hook interface for shopping carts
│   ├── pages/              # Screen containers bound to Router routes
│   │   ├── admin/          # Admin CRUD catalog and order dispatch panels
│   │   ├── delivery/       # Courier portals and delivery checklists
│   │   ├── AppLayout.tsx   # Shell template housing global Navbar and Footer
│   │   ├── Home.tsx        # Customer catalog homepage
│   │   ├── Login.tsx       # Auth portal with register forms
│   │   ├── OrderTracking.tsx# Interactive tracking viewport
│   │   └── ProductPage.tsx # Single product detail view
│   ├── types/              # Unified TypeScript interface declarations
│   │   └── index.ts        # App type definitions (User, Product, Order)
│   ├── App.tsx             # Page layout paths and client-side routing definitions
│   ├── index.css           # Styling configuration and custom animations
│   └── main.tsx            # DOM initialization entrypoint
```

---

## ⚙️ Core Technical Features

### State Management via Context API
Rather than introducing heavy state management tools, the application uses React's native Context API:
* **Authentication State ([AuthContext.tsx](file:///c:/Programming/Grocery-Delivery-App/frontend/src/context/AuthContext.tsx)):** Manages authenticated states for Customers, Admins, and Delivery Partners. It handles profile lookup, local storage token management, and validation.
* **Shopping Cart State ([CartContext.tsx](file:///c:/Programming/Grocery-Delivery-App/frontend/src/context/CartContext.tsx)):** Handles cart mutations (adding products, updating item quantities, calculating subtotals, taxes, and shipping fees) and persists items across page refreshes using local storage.

### API Client Integration ([api.ts](file:///c:/Programming/Grocery-Delivery-App/frontend/src/config/api.ts))
API requests are made using Axios. The API client includes interceptors to automate communication details:
* **Token Injection:** Automatically retrieves the `auth_token` JWT from local storage and appends it to the `Authorization: Bearer <token>` header of every outgoing request.
* **Auth Error Handling:** Intercepts response errors. If a response returns a `401 Unauthorized` status code, the client clears local session storage and redirects the browser to the login screen.

### Routing Layout Matrix ([App.tsx](file:///c:/Programming/Grocery-Delivery-App/frontend/src/App.tsx))
The application uses React Router DOM v7 to map path layouts:
* **Public Layout:** The default frame ([AppLayout.tsx](file:///c:/Programming/Grocery-Delivery-App/frontend/src/pages/AppLayout.tsx)) renders a header Navbar and Footer around page screens like [Home.tsx](file:///c:/Programming/Grocery-Delivery-App/frontend/src/pages/Home.tsx) and [ProductPage.tsx](file:///c:/Programming/Grocery-Delivery-App/frontend/src/pages/ProductPage.tsx).
* **Protected Customer Routes:** Enclosed by a route guard component ([ProtectedRoute.tsx](file:///c:/Programming/Grocery-Delivery-App/frontend/src/components/ProtectedRoute.tsx)) to restrict access to checkout pages and order tracking to authenticated users.
* **Admin Controls Layout:** The administrative layout features a distinct navigation bar to control catalog item editing and delivery partner monitoring.
* **Delivery Partner Workspace:** Dedicated views styled for mobile interfaces to help couriers manage order drop-offs.

---

## 📌 Interface Routing Summary

| Route Path | Layout Guard | Purpose |
| :--- | :--- | :--- |
| `/login` | Public | Credentials portal containing login and registration cards |
| `/` | App Layout | Product catalogs categorizing items |
| `/products/:id` | App Layout | Details, organic identifiers, unit metrics, and stock states |
| `/search` | App Layout | Client query input filtering matching name or price thresholds |
| `/checkout` | Customer Guard | Delivery address form selectors and checkout buttons |
| `/orders` | Customer Guard | Historical order summaries |
| `/orders/:id` | Customer Guard | Leaflet-driven order status tracking map |
| `/admin` | Admin Guard | Operations dashboard highlighting metrics |
| `/admin/products` | Admin Guard | Catalog grid listing items with CRUD controls |
| `/admin/orders` | Admin Guard | Manual courier dispatcher listing pending orders |
| `/delivery/login` | Public | Authentication portal for delivery partners |
| `/delivery` | Driver Guard | Mobile-friendly delivery checklist and completion portal |

---

## 🗺️ Interactive Maps & Location Markers
The platform integrates Leaflet to handle address coordinates:
* **Address Setup ([AddressForm.tsx](file:///c:/Programming/Grocery-Delivery-App/frontend/src/components/AddressForm.tsx)):** Customers drop a marker on an interactive map to define delivery coordinates (`lat`, `lng`), resolving issues with manual address entry formatting.
* **Live Route Tracking ([OrderTracking.tsx](file:///c:/Programming/Grocery-Delivery-App/frontend/src/pages/OrderTracking.tsx)):** Visualizes delivery paths by rendering marker coordinates for the store and customer address pin locations, updating coordinates in real time.

---

## 🔑 Environment Variables
Configure the frontend environment using a [frontend/.env](file:///c:/Programming/Grocery-Delivery-App/frontend/.env) file:

```env
# URL pointer matching the backend Express API gateway
VITE_API_BASE_URL="http://localhost:8000/api/v1"

# Standard currency indicator displayed in catalog layouts
VITE_CURRENCY_SYMBOL="$"
```

---

## 🚀 Execution & Command Reference

Manage the client application using these commands from the `frontend/` directory:

### Dependency Installation
```bash
npm install
```

### Start Development Server
```bash
# Starts Vite local server with fast hot-module-replacement (HMR)
npm run dev
```
The client application will start on `http://localhost:5173`.

### Production Build
```bash
# Performs TypeScript validation checks and compiles static bundles
npm run build
```
Compiled static assets are saved in the `dist/` directory.

### Local Preview
```bash
# Hosts the local build locally to inspect final production assets
npm run preview
```
This is useful for verifying asset behavior and page load times before hosting.

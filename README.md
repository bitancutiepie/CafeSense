# CaféSense ☕

A full-stack café management and Point of Sale (POS) application built using a unified, standard **3-Layered Architecture**.

---

## 🏛️ Architecture Overview

The codebase is organized directly under `src/` following the standard 3-tier model:

```text
CafeSense/
├── server.js                          # Root application runner
├── package.json                       # Dependencies and run scripts
├── .gitignore
├── README.md
└── src/
    ├── presentation/                  # Layer 1: UI, HTTP requests/responses, routing, controllers
    │   ├── controllers/               # Express req/res handlers
    │   │   └── productController.js
    │   ├── routes/                    # API route definitions
    │   │   ├── index.js
    │   │   └── productRoutes.js
    │   └── views/                     # Static UI presentation (HTML, CSS, JS)
    │       ├── index.html             # Auto-redirects to login.html
    │       ├── pages/                 # HTML views (login, dashboard, products, etc.)
    │       └── assets/                # Styles, client API wrappers, images
    │
    ├── business/                      # Layer 2: Core domain rules, validations, workflows, services
    │   ├── services/                  # Pure application logic (productService.js)
    │   ├── validators/                # Input validation schemas (productValidator.js)
    │   └── models/                    # Domain entities / data models (Product.js)
    │
    ├── data/                          # Layer 3: Database queries, repositories, ORM models
    │   ├── repositories/              # Persistence abstraction (productRepository.js)
    │   └── migrations/                # Database migrations placeholder
    │
    └── config/                        # App configuration, environment setup, shared utilities
        ├── index.js                   # Environment configuration
        ├── app.js                     # Express app setup and static file binding
        ├── middlewares/               # Error handling, 404 handler
        └── utils/                     # ApiResponse and AppError helpers
```

---

## 🚀 Running the Application

### 1. Install Dependencies
```bash
npm install
```

### 2. Start the Server
```bash
# Production start
npm start

# Development mode (auto-restart with nodemon)
npm run dev
```

### 3. Open in Browser
- **Web Application**: [`http://localhost:5000`](http://localhost:5000) (auto-routes to `pages/login.html`)
- **API Health Check**: [`http://localhost:5000/api/v1/health`](http://localhost:5000/api/v1/health)
- **Products API**: [`http://localhost:5000/api/v1/products`](http://localhost:5000/api/v1/products)

---

## 🔑 Demo Credentials
- **Owner**: `owner` / `Owner123`
- **Manager**: `manager` / `Manager123`
- **Staff**: `staff` / `Staff123`

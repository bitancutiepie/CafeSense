
# CaféSense ☕

**CaféSense – Café Sales and Customer Behavior Analytics System**

A full-stack café management and Point of Sale (POS) application designed to record café transactions, manage products and inventory, and transform sales data into meaningful business insights.

Built using HTML, CSS, Vanilla JavaScript, Node.js, Express.js, MySQL, and Chart.js, following a standard **3-Layer Architecture**.

---

## 📌 Project Overview

CaféSense aims to help café owners monitor daily business operations through a centralized web-based system.

Instead of relying on manual records, the system allows users to process transactions, monitor inventory, and generate visual reports based on recorded sales data.

The system provides insights into product performance, sales trends, customer purchasing patterns, and business activity to support better decision-making.

---

## ✨ Key Features

### 1. Dashboard
- Displays key business performance indicators.
- Shows total revenue and transaction counts.
- Highlights best-selling products and peak business hours.
- Provides sales and customer analytics through charts.
- Displays recent transactions.
- Includes date and customer-type filters.

### 2. Point of Sale (POS) / Transactions
- Records customer purchases.
- Supports multiple products in one transaction.
- Supports multiple customer types within one transaction.
- Automatically calculates subtotals, discounts, and totals.
- Supports cash and other configured payment methods.
- Generates transaction receipts.
- Automatically deducts product stock after successful checkout.

### 3. Product and Inventory Management
- Displays and manages café products.
- Records product prices and stock quantities.
- Supports inventory stock adjustments.
- Tracks inventory movement history.
- Records stock changes resulting from sales and adjustments.

### 4. Sales Reports
- Generates sales summaries and performance reports.
- Provides daily sales, product sales, and customer sales breakdowns.
- Supports date filtering.
- Exports report data into CSV files.
- Supports printing reports.

---

## 🛠️ Technology Stack

| Component | Technology |
|---|---|
| Frontend | HTML5, CSS3, Vanilla JavaScript |
| Backend | Node.js, Express.js |
| Database | MySQL |
| Database Driver | mysql2 |
| Data Visualization | Chart.js |
| API Communication | REST API |
| Development Tool | Nodemon |

---

## 🏛️ Architecture Overview

CaféSense follows a standard **3-Layer Architecture**, separating presentation, business logic, and data access responsibilities.

### Layer 1: Presentation Layer
Handles the user interface and communication between the frontend and backend.

Responsibilities:
- HTML, CSS, and JavaScript views
- Express controllers
- API route definitions
- HTTP request and response handling

### Layer 2: Business Logic Layer
Handles application rules, validations, calculations, and business processes.

Responsibilities:
- Product management logic
- Transaction processing
- Discount calculations
- Stock validation
- Inventory-related business rules

### Layer 3: Data Access Layer
Handles communication with the MySQL database.

Responsibilities:
- Database queries
- Data retrieval and storage
- Product repository
- Transaction repository
- Inventory data access

### Architecture Structure

```text
CafeSense/
│
├── server.js
├── package.json
├── package-lock.json
├── .env
├── .gitignore
├── README.md
│
└── src/
    │
    ├── presentation/
    │   ├── controllers/
    │   │   ├── productController.js
    │   │   └── transactionController.js
    │   │
    │   ├── routes/
    │   │   ├── index.js
    │   │   ├── productRoutes.js
    │   │   └── transactionRoutes.js
    │   │
    │   └── views/
    │       ├── index.html
    │       ├── pages/
    │       │   ├── dashboard.html
    │       │   ├── transactions.html
    │       │   ├── products.html
    │       │   ├── reports.html
    │       │   └── login.html
    │       │
    │       └── assets/
    │           ├── css/
    │           └── js/
    │               ├── api/
    │               └── pages/
    │
    ├── business/
    │   └── services/
    │       ├── productService.js
    │       └── transactionService.js
    │
    ├── data/
    │   └── repositories/
    │       ├── productRepository.js
    │       ├── transactionRepository.js
    │       └── transactionReferenceRepository.js
    │
    └── config/
        ├── database.js
        └── utils/
```

*Note: The structure above highlights the main application files and folders.*

---

## 🗄️ Database

CaféSense uses **MySQL** as its relational database management system.

Database name:

```sql
CafeSenseDB
```

The database contains the following main tables:

- `users`
- `roles`
- `products`
- `product_categories`
- `customer_types`
- `payment_methods`
- `transactions`
- `transaction_items`
- `inventory_movements`

The database stores transaction records, product information, customer types, payment methods, and inventory movement history.

---

## ⚙️ Installation and Setup

### Prerequisites

Make sure the following are installed:

- Node.js
- npm
- MySQL Server
- MySQL Workbench (recommended)
- Visual Studio Code (recommended)

### 1. Clone the Repository

```bash
git clone https://github.com/kyeverse/CafeSense.git
```

Navigate to the project directory:

```bash
cd CafeSense
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Configure Environment Variables

Create a `.env` file in the project root directory.

Add your local MySQL configuration:

```env
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=your_mysql_password
DB_NAME=CafeSenseDB
DB_PORT=3306
```

Replace `your_mysql_password` with your actual MySQL password.

**Important:** Never commit or upload your `.env` file to GitHub.

### 4. Prepare the Database

Create the `CafeSenseDB` database in MySQL and execute the project's database schema and required initial data.

Make sure the database tables and reference records are available before starting the application.

---

## 🚀 Running the Application

### 1. Start the Backend Server

For normal execution:

```bash
npm start
```

For development mode with automatic server restarting:

```bash
npm run dev
```

The backend server runs at:

```text
http://localhost:5000
```

### 2. Open the Web Application

If using the Express static file server, open:

```text
http://localhost:5000
```

The root page redirects to the application's login page.

Alternatively, if using VS Code Live Server, open the frontend through Live Server. The backend must still be running on port 5000.

---

## 🔗 API Endpoints

Base URL:

```text
http://localhost:5000/api/v1
```

### Health Check

| Method | Endpoint | Description |
|---|---|---|
| GET | `/health` | Checks API availability |

### Products

| Method | Endpoint | Description |
|---|---|---|
| GET | `/products` | Retrieves all products |
| GET | `/products/:id` | Retrieves a specific product |
| POST | `/products` | Creates a product |
| PUT | `/products/:id` | Updates a product |
| PATCH | `/products/:id/stock` | Adjusts product stock |
| GET | `/products/inventory-movements` | Retrieves inventory movement history |

### Transactions

| Method | Endpoint | Description |
|---|---|---|
| GET | `/transactions` | Retrieves transaction records |
| POST | `/transactions` | Creates a POS transaction |

---

## 📊 Transaction and Discount Rules

CaféSense supports the following customer types and discount rates:

| Customer Type | Discount |
|---|---:|
| General Customer | 0% |
| Student | 10% |
| Senior/PWD | 20% |

Discount calculations are applied based on the customer type assigned to each transaction item.

Transaction codes follow this format:

```text
CS-YYYYMM-NNN
```

Example:

```text
CS-202611-062
```

---

## 📌 Development Status

### Implemented
- [x] MySQL database integration
- [x] 3-Layer Architecture backend
- [x] Product management API
- [x] Inventory movement tracking
- [x] POS transaction processing
- [x] Transaction history API
- [x] Dashboard integration
- [x] Sales Reports integration
- [x] CSV report exports
- [x] Receipt generation
- [x] Standardized transaction codes

### Upcoming
- [ ] Backend login and authentication
- [ ] Role-based access control
- [ ] User Management integration
- [ ] Additional system testing and security improvements
- [ ] Final documentation and deployment preparation

---

## 👥 Project Information

**Project:** CaféSense – Café Sales and Customer Behavior Analytics System

**Course:** IT 314 – Web Systems and Technologies

**Architecture:** 3-Layer Architecture

**Repository:** https://github.com/kyeverse/CafeSense

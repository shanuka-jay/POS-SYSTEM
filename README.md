# QuickPOS — Mobile Point of Sale System

A full-stack POS system built with React, Node.js, Express, and MongoDB.

---

## Features

- **Authentication** — JWT login with role-based access (Admin, Manager, Cashier)
- **Billing / Sales** — Product search, cart, discounts, tax, cash/card/QR payment, receipts
- **Products** — Add, edit, delete with SKU, category, price, stock
- **Customers** — Manage customers, view purchase history
- **Inventory** — Stock tracking, low-stock alerts, manual adjustments
- **Reports** — Daily & monthly sales, charts (Chart.js), top products
- **Settings** — Store info, tax rate, currency, receipt footer
- **Offline Mode** — Cart saved to localStorage when offline, synced on reconnect

---

## Tech Stack

| Layer      | Technology                        |
|------------|-----------------------------------|
| Frontend   | React 18, React Router v6         |
| Styling    | Custom CSS + Font Awesome 6 CDN   |
| Charts     | Chart.js + react-chartjs-2        |
| Backend    | Node.js + Express                 |
| Database   | MongoDB + Mongoose                |
| Auth       | JWT + bcryptjs                    |

---

## Project Structure

```
pos-system/
├── server/                  # Backend
│   ├── models/
│   │   ├── User.js
│   │   ├── Product.js
│   │   ├── Customer.js
│   │   ├── Sale.js
│   │   └── Settings.js
│   ├── controllers/
│   │   ├── authController.js
│   │   ├── productController.js
│   │   ├── customerController.js
│   │   ├── salesController.js
│   │   ├── reportsController.js
│   │   └── settingsController.js
│   ├── routes/
│   │   ├── auth.js
│   │   ├── products.js
│   │   ├── customers.js
│   │   ├── sales.js
│   │   ├── reports.js
│   │   └── settings.js
│   ├── middleware/
│   │   └── auth.js
│   ├── server.js
│   ├── seed.js
│   ├── .env
│   └── package.json
│
└── client/                  # Frontend
    ├── public/
    │   └── index.html
    └── src/
        ├── context/
        │   └── AuthContext.js
        ├── services/
        │   └── api.js
        ├── components/
        │   └── Layout.js
        ├── pages/
        │   ├── Login.js
        │   ├── Dashboard.js
        │   ├── Billing.js
        │   ├── Products.js
        │   ├── Customers.js
        │   ├── Inventory.js
        │   ├── Reports.js
        │   └── Settings.js
        ├── styles/
        │   └── global.css
        ├── App.js
        └── index.js
```

---

## Prerequisites

- **Node.js** v16 or higher
- **MongoDB** running locally (or a MongoDB Atlas connection string)
- **npm** v8 or higher

---

## Setup & Installation

### Step 1 — Clone or extract the project

```bash
cd pos-system
```

### Step 2 — Configure the backend environment

```bash
cd server
cp .env.example .env
```

Edit `.env` and set your values:

```env
PORT=5000
MONGODB_URI=mongodb://localhost:27017/pos_system
JWT_SECRET=your_super_secret_key_here
NODE_ENV=development
```

### Step 3 — Install backend dependencies

```bash
cd server
npm install
```

### Step 4 — Seed the database with sample data

```bash
node seed.js
```

This creates:
- 3 demo users (admin, manager, cashier)
- 16 sample products across 5 categories
- 5 sample customers
- Default store settings

### Step 5 — Start the backend server

```bash
npm run dev       # development (with nodemon)
# or
npm start         # production
```

Backend runs at: **http://localhost:5000**

### Step 6 — Install frontend dependencies

Open a **new terminal**:

```bash
cd client
npm install
```

### Step 7 — Start the frontend

```bash
npm start
```

Frontend runs at: **http://localhost:3000**

---

## Demo Login Credentials

| Role    | Email               | Password    | Access                          |
|---------|---------------------|-------------|----------------------------------|
| Admin   | admin@pos.com       | admin123    | Full access to all features      |
| Manager | manager@pos.com     | manager123  | Products, inventory, reports     |
| Cashier | cashier@pos.com     | cashier123  | Billing and customers only       |

---

## API Endpoints

### Authentication
| Method | Endpoint             | Description           | Auth   |
|--------|---------------------|-----------------------|--------|
| POST   | /api/auth/register  | Register new user     | None   |
| POST   | /api/auth/login     | Login                 | None   |
| GET    | /api/auth/me        | Get current user      | JWT    |
| GET    | /api/auth/users     | List all users        | Admin  |

### Products
| Method | Endpoint                  | Description           | Auth           |
|--------|--------------------------|----------------------|----------------|
| GET    | /api/products             | List all products     | Any            |
| GET    | /api/products/categories  | List categories       | Any            |
| GET    | /api/products/:id         | Get one product       | Any            |
| POST   | /api/products             | Create product        | Admin/Manager  |
| PUT    | /api/products/:id         | Update product        | Admin/Manager  |
| DELETE | /api/products/:id         | Delete product        | Admin          |

### Customers
| Method | Endpoint                   | Description           | Auth   |
|--------|---------------------------|----------------------|--------|
| GET    | /api/customers             | List customers        | Any    |
| GET    | /api/customers/:id         | Get one customer      | Any    |
| GET    | /api/customers/:id/history | Purchase history      | Any    |
| POST   | /api/customers             | Create customer       | Any    |
| PUT    | /api/customers/:id         | Update customer       | Admin/Manager |
| DELETE | /api/customers/:id         | Delete customer       | Admin  |

### Sales
| Method | Endpoint          | Description        | Auth   |
|--------|------------------|--------------------|--------|
| POST   | /api/sales        | Create sale        | Any    |
| GET    | /api/sales        | List sales         | Any    |
| GET    | /api/sales/recent | Recent 10 sales    | Any    |
| GET    | /api/sales/:id    | Get one sale       | Any    |

### Reports
| Method | Endpoint              | Description         | Auth           |
|--------|-----------------------|---------------------|----------------|
| GET    | /api/reports/dashboard | Dashboard stats    | Admin/Manager  |
| GET    | /api/reports/daily    | Daily report        | Admin/Manager  |
| GET    | /api/reports/monthly  | Monthly report      | Admin/Manager  |

### Settings
| Method | Endpoint       | Description      | Auth   |
|--------|----------------|-----------------|--------|
| GET    | /api/settings  | Get settings    | Any    |
| PUT    | /api/settings  | Update settings | Admin  |

---

## Offline Mode

The billing page automatically detects when you go offline. The cart is saved to `localStorage` under the key `pos_offline_cart`. When you come back online, the saved cart is restored automatically so no data is lost.

---

## Role Permissions Summary

| Feature        | Admin | Manager | Cashier |
|----------------|-------|---------|---------|
| Dashboard      | Yes   | Yes     | Yes     |
| Billing        | Yes   | Yes     | Yes     |
| Products       | Yes   | Yes     | No      |
| Customers      | Yes   | Yes     | Yes     |
| Inventory      | Yes   | Yes     | No      |
| Reports        | Yes   | Yes     | No      |
| Settings       | Yes   | No      | No      |

---

## Troubleshooting

**MongoDB not connecting**
- Make sure MongoDB is running: `mongod` or check your Atlas connection string
- Verify `MONGODB_URI` in `.env`

**Port already in use**
- Change `PORT` in `.env` to another value like `5001`
- Update the `"proxy"` field in `client/package.json` to match

**npm install errors**
- Try deleting `node_modules` and `package-lock.json`, then run `npm install` again

**Frontend can't reach backend**
- Make sure backend is running on port 5000
- The `"proxy": "http://localhost:5000"` in `client/package.json` handles routing

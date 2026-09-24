# Car Wash POS

A fast, modern Point of Sale (POS) web application built for express and walk-in car washes. Designed for touchscreens, tablets, and desktop terminals.

## Features

- **New Wash (POS Terminal)**:
  - Quick package selection (Basic Wash, Deluxe Wash, Premium Wash, Full Service).
  - Vehicle classification with instant oversize surcharges (Car, SUV/Truck, etc.).
  - Optional multi-select add-ons (Hot Wax, Interior Vacuum, Tire Shine).
  - Live calculations for Subtotal, Sales Tax, and Total with tabular figures.
  - One-tap payments: **CASH** (with quick bill tender shortcuts & change calculation), **CARD**, and **OTHER**.
  - Instant thermal-formatted printable receipts (`@media print` receipt layout).

- **Transactions Ledger**:
  - Live **Today's Summary**: Completed transactions, gross sales, cash vs. card vs. other breakdown, and total vehicles washed.
  - Multi-criteria filtering: Search (receipt #, service, vehicle, payment), Date range (Today, Yesterday, This Week, Custom Date), Payment method, and Status.
  - Transaction detail inspector with receipt re-printing.
  - Void transaction capability (with audit protection and automated sales deduction).

- **Settings & Administration (Admin Role)**:
  - Role-based permissions (**Admin** vs. **Cashier** toggle).
  - Business details management (Name, Address, Phone, Email, custom Receipt Footer).
  - Wash packages & Add-ons management (Edit pricing, names, descriptions, active/inactive toggling, deletion protection for historical transactions).
  - Vehicle surcharges configurator.
  - Sales tax percentage configuration with live currency previews.

- **Data Persistence**:
  - Automatically stores sales history, custom business settings, and pricing in browser `localStorage`.

## Tech Stack

- **React 19**
- **TypeScript**
- **Tailwind CSS v4**
- **Vite**
- **Lucide Icons**

## Getting Started

### 1. Clone the repository
```bash
git clone https://github.com/<your-username>/car-wash-pos.git
cd car-wash-pos
```

### 2. Install dependencies
```bash
npm install
```

### 3. Run the development server
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### 4. Build for production
```bash
npm run build
```

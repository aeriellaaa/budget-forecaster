```markdown
# Budget Forecaster

See your financial future before it happens.

Track income, log expenses, and let the forecasting engine project your account balance weeks and months ahead — so you spot the low points before they hit your wallet, not after.

![Node.js](https://img.shields.io/badge/Node.js-Express-green) ![JSON](https://img.shields.io/badge/Storage-JSON-lightgrey) ![Status](https://img.shields.io/badge/status-active-brightgreen) ![License](https://img.shields.io/badge/license-MIT-blue)

---

## Overview

Budget Forecaster is a full-stack personal finance tool that doesn't just track what you've spent — it predicts what's coming. By modeling recurring income and expenses forward in time, it turns a flat transaction list into a live financial timeline, surfacing the exact date your balance dips lowest before it actually happens.

Most budgeting apps show you the past. This one shows you what's next.

## Problem Statement

Knowing whether you'll have enough money on a future date usually means manually tallying every upcoming bill, paycheck, and subscription in your head — and getting it wrong is easy. Budget Forecaster automates the projection, expanding every recurring transaction into its real future occurrences and walking your balance forward day by day, so upcoming shortfalls or surpluses are visible weeks in advance.

## Features

### Forecasting Engine
Projects your account balance forward across a custom time window (3/6/12+ months), expanding recurring transactions into every individual future occurrence and calculating a full daily balance series.

### Risk Point Detection
Automatically identifies and highlights the single lowest projected balance point in your selected window — the exact day you're most at risk of running dry.

### Recurring Transaction Intelligence
Define income or expenses as weekly, monthly, or yearly recurring rules with optional end dates — the engine expands them into real dated occurrences on the fly, no manual re-entry required.

### Visual Balance Timeline
A live line chart renders your projected balance trend over time, paired with a summary panel: net income/month, total upcoming income vs. expenses, and projected end balance.

### Categorized Transaction Management
Full CRUD on transactions — add, edit, delete, and filter by date range or category, with a curated category set (Salary, Freelance, Rent, Groceries, Subscriptions, Utilities, Transport, Entertainment, Other).

### Zero-Dependency Persistence
All data lives in a local JSON file — no external database, no cloud account, no setup friction. Your data survives server restarts, self-heals if the file goes missing, and stays entirely under your control.

## Technology Stack

**Backend**
- Node.js
- Express
- Local JSON file storage

**Frontend**
- HTML5
- CSS3
- Vanilla JavaScript

## System Architecture

```
                    +----------------------+
                    |     Client (UI)      |
                    |  Forms / List / Chart |
                    +----------+-----------+
                               |
                               v
                    +----------------------+
                    |    Express Server     |
                    +----------+-----------+
                               |
          +--------------------+--------------------+
          |                                         |
          v                                         v
+-------------------+                    +----------------------+
| Transactions Route |                    |   Forecast Route      |
| CRUD + Validation   |                    |   /api/forecast?months|
+---------+----------+                    +-----------+----------+
          |                                            |
          v                                            v
+-------------------+                    +----------------------+
| Transaction Model   |                    | Forecasting Engine    |
| Validation Rules     |                    | Daily Balance Walk    |
+---------+----------+                    +-----------+----------+
          |                                            |
          |                     +----------------------+
          |                     v
          |          Recurrence Expansion Engine
          |          (weekly / monthly / yearly)
          v                     |
+-----------------------------------------+
|         JSON Storage (data.json)         |
+-------------------------------------------+
```

## Project Structure

```
budget-forecaster/
│
├── routes/
│   ├── transactions.js      # CRUD endpoints
│   └── forecast.js          # Forecast endpoint
│
├── models/
│   ├── storage.js           # Read/write data.json
│   ├── transaction.js       # Validation + transaction builder
│   ├── recurrence.js        # Recurring transaction expansion
│   └── forecast.js          # Forecasting engine
│
├── data/
│   └── data.json            # Local persistent storage
│
├── public/                  # Frontend (HTML/CSS/JS)
│
├── server.js
├── package.json
├── API_CONTRACT.md
└── README.md
```

## Core Workflow

```
                  Log a Transaction
                          |
              +-----------+-----------+
              |                       |
              v                       v
        One-time Entry        Recurring Rule
              |                       |
              |                       v
              |            Frequency + End Date
              |                       |
              +-----------+-----------+
                          |
                          v
                Stored in data.json
                          |
                          v
              Request Forecast (N months)
                          |
                          v
             Recurring Rules Expanded into
                Real Future Occurrences
                          |
                          v
              Daily Balance Walk-Forward
                          |
                          v
         Lowest Point + Summary Calculated
                          |
                          v
              Rendered as Chart + Panel
```

## Installation and Setup

### Prerequisites
- Node.js (v18+)

### Steps
```bash
# Clone the repository
git clone https://github.com/<your-username>/budget-forecaster.git
cd budget-forecaster

# Install dependencies
npm install

# Start the development server
npm run dev
```
The application will be available at http://localhost:3000.

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | /api/transactions | List all transactions (filters: from, to, category) |
| POST | /api/transactions | Create a new transaction |
| PUT | /api/transactions/:id | Edit an existing transaction |
| DELETE | /api/transactions/:id | Delete a transaction |
| GET | /api/forecast?months=N | Return projected balance series for N months |

Full request/response shapes are documented in API_CONTRACT.md.

## Data Model

```
Transaction {
  id: string
  type: "income" | "expense"
  amount: number
  category: string
  date: string (ISO date)
  description: string
  recurring: boolean
  recurrence: {
    frequency: "weekly" | "monthly" | "yearly"
    endDate: string | null
  } | null
}
```

## Security and Validation

- All transaction input is validated server-side before being persisted (type, amount, category, date, recurrence shape).
- Forecast requests are bounded (months capped at 60) to prevent runaway computation.
- Storage layer self-heals on missing data.json and surfaces clear errors on corrupted data instead of crashing.

## Future Enhancements

- Historical average-based forecasting for irregular/variable expenses
- Interest and savings growth modeling
- Budgeting goals and threshold alerts
- Multi-account support
- Export forecast data (CSV/PDF)

## Notes

This is a single-user, self-hosted personal tool — not a multi-tenant product. No bank syncing, no authentication, no external services. Just your data, your forecast.
```

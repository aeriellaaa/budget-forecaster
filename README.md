# Personal Budget Forecaster

A personal web app to track income/expenses and forecast future account balance based on recurring transactions.

## Stack
- Backend: Node.js + Express
- Storage: local JSON file (`data/data.json`)
- Frontend: HTML/CSS/JS (in `public/`)

## Setup

1. Clone the repo
2. Install dependencies:
npm install

3. Start the dev server:

npm run dev

4. Server runs at `http://localhost:3000`

## Project Structure

server.js entry point
routes/ API route handlers
transactions.js CRUD for transactions
forecast.js forecast endpoint
models/
storage.js read/write data.json
transaction.js validation + transaction builder
recurrence.js expands recurring transactions into occurrences
forecast.js forecasting engine (balance projection)
data/
data.json local JSON storage (balance + transactions)
public/ frontend files


## API

See `API_CONTRACT.md` for full endpoint documentation.

Quick reference:
- `GET /api/transactions` — list transactions (filters: `from`, `to`, `category`)
- `POST /api/transactions` — create a transaction
- `PUT /api/transactions/:id` — edit a transaction
- `DELETE /api/transactions/:id` — delete a transaction
- `GET /api/forecast?months=N` — projected balance for the next N months (max 60)

## Data Model

See `API_CONTRACT.md` for the full Transaction object shape.

## Notes

- `data.json` is auto-created with a default empty structure if missing.
- Recurring transactions expand automatically within the forecast window; the raw stored transaction only shows once in `GET /api/transactions`.
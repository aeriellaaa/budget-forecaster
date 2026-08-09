# API Contract — Budget Forecaster

Base URL: http://localhost:3000/api

## Transaction Object
{
  "id": "string",
  "type": "income" | "expense",
  "amount": number (positive),
  "category": "Salary" | "Freelance" | "Rent" | "Groceries" | "Subscriptions" | "Utilities" | "Transport" | "Entertainment" | "Other",
  "date": "YYYY-MM-DD",
  "description": "string",
  "recurring": boolean,
  "recurrence": {
    "frequency": "weekly" | "monthly" | "yearly",
    "endDate": "YYYY-MM-DD" | null
  } | null
}

## GET /api/transactions
Query params (all optional): from, to, category
Returns: 200, array of Transaction objects

## POST /api/transactions
Body: Transaction fields WITHOUT id (id is generated)
Returns: 201 + created Transaction, or 400 + { "errors": ["msg", ...] }

## PUT /api/transactions/:id
Body: same as POST
Returns: 200 + updated Transaction, or 400 + errors, or 404 if not found

## DELETE /api/transactions/:id
Returns: 204 no body, or 404 if not found
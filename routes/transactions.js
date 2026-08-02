const express = require('express');
const router = express.Router();
const { readData, writeData } = require('../models/storage');
const { validateTransaction, buildTransaction } = require('../models/transaction');

// GET /api/transactions — list all, with optional filters
router.get('/', (req, res) => {
  const data = readData();
  let transactions = data.transactions;

  const { from, to, category } = req.query;

  if (from) {
    transactions = transactions.filter(t => t.date >= from);
  }
  if (to) {
    transactions = transactions.filter(t => t.date <= to);
  }
  if (category) {
    transactions = transactions.filter(t => t.category === category);
  }

  res.json(transactions);
});

// POST /api/transactions — create
router.post('/', (req, res) => {
  const errors = validateTransaction(req.body);
  if (errors.length > 0) {
    return res.status(400).json({ errors });
  }

  const data = readData();
  const newTransaction = buildTransaction(req.body);
  data.transactions.push(newTransaction);
  writeData(data);

  res.status(201).json(newTransaction);
});

// PUT /api/transactions/:id — edit
router.put('/:id', (req, res) => {
  const errors = validateTransaction(req.body);
  if (errors.length > 0) {
    return res.status(400).json({ errors });
  }

  const data = readData();
  const index = data.transactions.findIndex(t => t.id === req.params.id);

  if (index === -1) {
    return res.status(404).json({ error: 'Transaction not found' });
  }

  const updated = buildTransaction(req.body);
  updated.id = req.params.id; // keep the original id
  data.transactions[index] = updated;
  writeData(data);

  res.json(updated);
});

// DELETE /api/transactions/:id — delete
router.delete('/:id', (req, res) => {
  const data = readData();
  const index = data.transactions.findIndex(t => t.id === req.params.id);

  if (index === -1) {
    return res.status(404).json({ error: 'Transaction not found' });
  }

  data.transactions.splice(index, 1);
  writeData(data);

  res.status(204).send();
});

module.exports = router;
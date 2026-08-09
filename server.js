const express = require('express');
const path = require('path');
const transactionsRouter = require('./routes/transactions');
const forecastRouter = require('./routes/forecast');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));
app.use('/api/transactions', transactionsRouter);
app.use('/api/forecast', forecastRouter);

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok' });
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});

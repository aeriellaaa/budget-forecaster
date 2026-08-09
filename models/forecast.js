const { expandAllTransactions } = require('./recurrence');

function addMonths(date, months) {
  const d = new Date(date);
  d.setMonth(d.getMonth() + months);
  return d;
}

function generateForecast(currentBalance, transactions, months) {
  const rangeStart = new Date().toISOString().slice(0, 10);
  const rangeEndDate = addMonths(rangeStart, months);
  const rangeEnd = rangeEndDate.toISOString().slice(0, 10);

  // Get every concrete transaction occurrence in the window, sorted by date
  const occurrences = expandAllTransactions(transactions, rangeStart, rangeEnd)
    .sort((a, b) => new Date(a.date) - new Date(b.date));

  // Walk through day by day, applying transactions as they occur
  let balance = currentBalance;
  const series = [];
  let totalIncome = 0;
  let totalExpense = 0;

  const occurrencesByDate = {};
  for (const t of occurrences) {
    if (!occurrencesByDate[t.date]) occurrencesByDate[t.date] = [];
    occurrencesByDate[t.date].push(t);
  }

  let current = new Date(rangeStart);
  const end = new Date(rangeEnd);

  while (current <= end) {
    const dateStr = current.toISOString().slice(0, 10);
    const todaysTransactions = occurrencesByDate[dateStr] || [];

    for (const t of todaysTransactions) {
      if (t.type === 'income') {
        balance += t.amount;
        totalIncome += t.amount;
      } else {
        balance -= t.amount;
        totalExpense += t.amount;
      }
    }

    series.push({ date: dateStr, balance: Math.round(balance * 100) / 100 });
    current.setDate(current.getDate() + 1);
  }

  const lowestPoint = series.reduce((min, point) =>
    point.balance < min.balance ? point : min, series[0]);

  const netPerMonth = months > 0
    ? Math.round(((totalIncome - totalExpense) / months) * 100) / 100
    : 0;

  return {
    series,
    lowestPoint,
    summary: {
      netIncomePerMonth: netPerMonth,
      totalIncome: Math.round(totalIncome * 100) / 100,
      totalExpense: Math.round(totalExpense * 100) / 100,
      projectedEndBalance: series.length > 0
        ? series[series.length - 1].balance
        : currentBalance
    }
  };
}

module.exports = { generateForecast };
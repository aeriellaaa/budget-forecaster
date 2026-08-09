function addInterval(date, frequency) {
  const d = new Date(date);
  if (frequency === 'weekly') {
    d.setDate(d.getDate() + 7);
  } else if (frequency === 'monthly') {
    d.setMonth(d.getMonth() + 1);
  } else if (frequency === 'yearly') {
    d.setFullYear(d.getFullYear() + 1);
  }
  return d;
}

// Expands a single recurring transaction into all its occurrences
// between rangeStart and rangeEnd (inclusive), as date-stamped copies.
function expandRecurring(transaction, rangeStart, rangeEnd) {
  if (!transaction.recurring || !transaction.recurrence) {
    return [transaction];
  }

  const occurrences = [];
  const { frequency, endDate } = transaction.recurrence;

  let current = new Date(transaction.date);
  const rangeStartDate = new Date(rangeStart);
  const rangeEndDate = new Date(rangeEnd);
  const recurrenceEnd = endDate ? new Date(endDate) : null;

  // Safety cap so a bad date never creates an infinite loop
  let iterations = 0;
  const MAX_ITERATIONS = 5000;

  while (current <= rangeEndDate && iterations < MAX_ITERATIONS) {
    iterations++;

    if (recurrenceEnd && current > recurrenceEnd) break;

    if (current >= rangeStartDate) {
      occurrences.push({
        ...transaction,
        id: `${transaction.id}_${current.toISOString().slice(0, 10)}`,
        date: current.toISOString().slice(0, 10)
      });
    }

    current = addInterval(current, frequency);
  }

  return occurrences;
}

// Expands a full list of transactions (mix of recurring and one-time)
// into their concrete occurrences within a date range.
function expandAllTransactions(transactions, rangeStart, rangeEnd) {
  let result = [];
  for (const t of transactions) {
    if (t.recurring) {
      result = result.concat(expandRecurring(t, rangeStart, rangeEnd));
    } else {
      const d = new Date(t.date);
      if (d >= new Date(rangeStart) && d <= new Date(rangeEnd)) {
        result.push(t);
      }
    }
  }
  return result;
}

module.exports = { expandRecurring, expandAllTransactions };
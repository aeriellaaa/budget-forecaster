const VALID_TYPES = ['income', 'expense'];
const VALID_CATEGORIES = [
  'Salary', 'Freelance', 'Rent', 'Groceries', 'Subscriptions',
  'Utilities', 'Transport', 'Entertainment', 'Other'
];
const VALID_FREQUENCIES = ['weekly', 'monthly', 'yearly'];

function validateTransaction(input) {
  const errors = [];

  if (!input.type || !VALID_TYPES.includes(input.type)) {
    errors.push(`type must be one of: ${VALID_TYPES.join(', ')}`);
  }

  if (typeof input.amount !== 'number' || input.amount <= 0) {
    errors.push('amount must be a positive number');
  }

  if (!input.category || !VALID_CATEGORIES.includes(input.category)) {
    errors.push(`category must be one of: ${VALID_CATEGORIES.join(', ')}`);
  }

  if (!input.date || isNaN(Date.parse(input.date))) {
    errors.push('date must be a valid ISO date string');
  }

  if (input.description !== undefined && typeof input.description !== 'string') {
    errors.push('description must be a string');
  }

  if (input.recurring) {
    if (!input.recurrence || typeof input.recurrence !== 'object') {
      errors.push('recurrence details are required when recurring is true');
    } else {
      if (!VALID_FREQUENCIES.includes(input.recurrence.frequency)) {
        errors.push(`recurrence.frequency must be one of: ${VALID_FREQUENCIES.join(', ')}`);
      }
      if (input.recurrence.endDate && isNaN(Date.parse(input.recurrence.endDate))) {
        errors.push('recurrence.endDate must be a valid ISO date string if provided');
      }
    }
  }

  return errors;
}

function buildTransaction(input) {
  return {
    id: Date.now().toString(),
    type: input.type,
    amount: input.amount,
    category: input.category,
    date: input.date,
    description: input.description || '',
    recurring: !!input.recurring,
    recurrence: input.recurring
      ? {
          frequency: input.recurrence.frequency,
          endDate: input.recurrence.endDate || null
        }
      : null
  };
}

module.exports = { validateTransaction, buildTransaction, VALID_CATEGORIES, VALID_TYPES };
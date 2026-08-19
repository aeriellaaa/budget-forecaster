/**
 * transactions.js — transaction list + add/edit form logic.
 */

const CATEGORIES = [
  'Salary', 'Freelance', 'Rent', 'Groceries', 'Subscriptions',
  'Utilities', 'Transport', 'Entertainment', 'Other',
];

let state = {
  transactions: [],
  filters: { from: '', to: '', category: '' },
  editingId: null,
};

function formatAmount(amount, type) {
  const sign = type === 'income' ? '+' : '\u2212';
  return `${sign}$${Number(amount).toFixed(2)}`;
}

function formatDate(isoDate) {
  const d = new Date(isoDate + 'T00:00:00');
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

function renderLedger() {
  const body = document.getElementById('ledger-body');
  const empty = document.getElementById('ledger-empty');
  const visible = [...state.transactions].sort((a, b) => (a.date < b.date ? 1 : -1));

  body.innerHTML = '';

  if (visible.length === 0) {
    empty.hidden = false;
    empty.textContent = 'No entries yet — add your first one on the left.';
    return;
  }
  empty.hidden = true;

  for (const t of visible) {
    const isPayday = t.type === 'income' && t.recurring;
    const row = document.createElement('div');
    row.className = `ledger__row${isPayday ? ' ledger__row--payday' : ''}`;
    row.dataset.id = t.id;

    row.innerHTML = `
      <span class="ledger__date">${formatDate(t.date)}</span>
      <span class="ledger__desc ${t.recurring ? 'ledger__desc-recurring' : ''}">${t.description || '\u2014'}</span>
      <span class="ledger__category ledger__category--${t.type}">${t.category}</span>
      <span class="ledger__amount ledger__amount--${t.type}">${formatAmount(t.amount, t.type)}</span>
      <span class="ledger__actions">
        <button class="btn--icon" data-action="edit" title="Edit">\u270E</button>
        <button class="btn--icon" data-action="delete" title="Delete">\u2715</button>
      </span>
    `;
    body.appendChild(row);
  }
}

function showListError(message) {
  const empty = document.getElementById('ledger-empty');
  document.getElementById('ledger-body').innerHTML = '';
  empty.hidden = false;
  empty.textContent = message;
}

function populateCategoryFilter() {
  const select = document.getElementById('filter-category');
  for (const cat of CATEGORIES) {
    const opt = document.createElement('option');
    opt.value = cat;
    opt.textContent = cat;
    select.appendChild(opt);
  }
}

function showFormErrors(messages) {
  const el = document.getElementById('form-errors');
  if (!messages || !messages.length) {
    el.hidden = true;
    el.textContent = '';
    return;
  }
  el.hidden = false;
  el.textContent = messages.join(' ');
}

function validateForm(data) {
  const errors = [];
  if (!data.amount || Number(data.amount) <= 0) errors.push('Amount must be greater than 0.');
  if (!data.category) errors.push('Choose a category.');
  if (!data.date) errors.push('Choose a date.');
  if (data.recurring) {
    if (!data.recurrence || !data.recurrence.frequency) {
      errors.push('Choose a frequency for recurring entries.');
    }
    if (data.recurrence?.endDate && data.recurrence.endDate < data.date) {
      errors.push('Recurring end date must be after the start date.');
    }
  }
  return errors;
}

function resetForm() {
  const form = document.getElementById('transaction-form');
  form.reset();
  document.getElementById('transaction-id').value = '';
  document.getElementById('recurring-detail').hidden = true;
  document.getElementById('form-submit').textContent = 'Add entry';
  document.getElementById('form-cancel').hidden = true;
  showFormErrors([]);
  state.editingId = null;
}

function loadTransactionIntoForm(t) {
  document.getElementById('transaction-id').value = t.id;
  document.getElementById('type').value = t.type;
  document.getElementById('amount').value = t.amount;
  document.getElementById('category').value = t.category;
  document.getElementById('date').value = t.date;
  document.getElementById('description').value = t.description || '';
  document.getElementById('recurring').checked = !!t.recurring;
  document.getElementById('recurring-detail').hidden = !t.recurring;
  if (t.recurring && t.recurrence) {
    document.getElementById('frequency').value = t.recurrence.frequency || 'monthly';
    document.getElementById('end-date').value = t.recurrence.endDate || '';
  }
  document.getElementById('form-submit').textContent = 'Save changes';
  document.getElementById('form-cancel').hidden = false;
  state.editingId = t.id;
}

async function refreshTransactions() {
  try {
    state.transactions = await getTransactions(state.filters);
    renderLedger();
    if (typeof renderActivityPanel === 'function') {
      renderActivityPanel(state.transactions);
    }
  } catch (err) {
    showListError(err.messages ? err.messages.join(' ') : 'Could not load transactions.');
  }
}

function initTransactionForm() {
  const form = document.getElementById('transaction-form');
  const recurringToggle = document.getElementById('recurring');
  const recurringDetail = document.getElementById('recurring-detail');
  const cancelBtn = document.getElementById('form-cancel');

  recurringToggle.addEventListener('change', () => {
    recurringDetail.hidden = !recurringToggle.checked;
  });

  cancelBtn.addEventListener('click', resetForm);

  form.addEventListener('submit', async (e) => {
    e.preventDefault();

    const recurring = recurringToggle.checked;
    const data = {
      type: document.getElementById('type').value,
      amount: parseFloat(document.getElementById('amount').value),
      category: document.getElementById('category').value,
      date: document.getElementById('date').value,
      description: document.getElementById('description').value.trim(),
      recurring,
      recurrence: recurring
        ? {
            frequency: document.getElementById('frequency').value,
            endDate: document.getElementById('end-date').value || null,
          }
        : null,
    };

    const clientErrors = validateForm(data);
    if (clientErrors.length) {
      showFormErrors(clientErrors);
      return;
    }
    showFormErrors([]);

    const submitBtn = document.getElementById('form-submit');
    const originalLabel = submitBtn.textContent;
    submitBtn.disabled = true;
    submitBtn.textContent = 'Saving…';

    try {
      if (state.editingId) {
        await updateTransaction(state.editingId, data);
      } else {
        await createTransaction(data);
      }
      await refreshTransactions();
      resetForm();
    } catch (err) {
      showFormErrors(err.messages || ['Something went wrong saving this entry.']);
    } finally {
      submitBtn.disabled = false;
      submitBtn.textContent = originalLabel;
    }
  });
}

function initLedgerActions() {
  document.getElementById('ledger-body').addEventListener('click', async (e) => {
    const btn = e.target.closest('button[data-action]');
    if (!btn) return;
    const row = btn.closest('.ledger__row');
    const id = row.dataset.id;
    const transaction = state.transactions.find((t) => t.id === id);

    if (btn.dataset.action === 'edit') {
      loadTransactionIntoForm(transaction);
      document.getElementById('transaction-form-section').scrollIntoView({ behavior: 'smooth', block: 'start' });
    }

    if (btn.dataset.action === 'delete') {
      try {
        await deleteTransaction(id);
        await refreshTransactions();
      } catch (err) {
        showListError(err.messages ? err.messages.join(' ') : 'Could not delete that entry.');
      }
    }
  });
}

function initFilters() {
  const from = document.getElementById('filter-start');
  const to = document.getElementById('filter-end');
  const category = document.getElementById('filter-category');

  [from, to, category].forEach((el) => {
    el.addEventListener('change', () => {
      state.filters = { from: from.value, to: to.value, category: category.value };
      refreshTransactions();
    });
  });
}

async function initTransactions() {
  populateCategoryFilter();
  initTransactionForm();
  initLedgerActions();
  initFilters();
  await refreshTransactions();
}
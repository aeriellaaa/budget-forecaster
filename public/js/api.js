/**
 * api.js — fetch wrapper functions for the Budget Forecaster API.
 *
 * Contract finalized with backend — see API_CONTRACT.md.
 * Filters use `from`/`to`. Errors come back as { errors: ["msg", ...] }.
 */

const API_BASE = '/api';

async function handleResponse(res) {
  let body = null;
  try {
    body = await res.json();
  } catch (_) {
    // no JSON body (e.g. 204 No Content on delete)
  }

  if (!res.ok) {
    const messages = Array.isArray(body?.errors) && body.errors.length
      ? body.errors
      : [`Request failed with status ${res.status}`];
    throw new ApiError(messages, res.status);
  }

  return body;
}

class ApiError extends Error {
  constructor(messages, status) {
    super(messages.join(' '));
    this.name = 'ApiError';
    this.messages = messages;
    this.status = status;
  }
}

async function getTransactions(filters = {}) {
  const params = new URLSearchParams();
  if (filters.from) params.set('from', filters.from);
  if (filters.to) params.set('to', filters.to);
  if (filters.category) params.set('category', filters.category);

  const query = params.toString();
  const res = await fetch(`${API_BASE}/transactions${query ? `?${query}` : ''}`);
  return handleResponse(res);
}

async function createTransaction(data) {
  const res = await fetch(`${API_BASE}/transactions`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  return handleResponse(res);
}

async function updateTransaction(id, data) {
  const res = await fetch(`${API_BASE}/transactions/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  return handleResponse(res);
}

async function deleteTransaction(id) {
  const res = await fetch(`${API_BASE}/transactions/${id}`, {
    method: 'DELETE',
  });
  return handleResponse(res);
}

async function getForecast(months = 6) {
  const res = await fetch(`${API_BASE}/forecast?months=${months}`);
  return handleResponse(res);
}
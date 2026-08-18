/**
 * forecast.js — forecast panel logic.
 *
 * Month view (3/6/12mo): pulled from the real GET /api/forecast endpoint.
 * Week view (Wk1-4): computed locally from the transactions already
 * loaded on the page — breaks the current month into four chunks and
 * shows the real running balance across each one.
 */

let selectedMonths = 6;
let currentMode = 'months'; // 'months' | 'week'
let currentWeek = 1;

function formatCurrency(amount) {
  return `$${Number(amount).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function animateNumber(el, targetValue, duration = 600) {
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (reduceMotion) {
    el.textContent = formatCurrency(targetValue);
    return;
  }
  const startTime = performance.now();
  function step(now) {
    const progress = Math.min((now - startTime) / duration, 1);
    const eased = 1 - Math.pow(1 - progress, 3);
    el.textContent = formatCurrency(targetValue * eased);
    if (progress < 1) requestAnimationFrame(step);
    else el.textContent = formatCurrency(targetValue);
  }
  requestAnimationFrame(step);
}

function setNetLabel(text) {
  const statNet = document.getElementById('stat-net');
  const label = statNet?.previousElementSibling;
  if (label) label.textContent = text;
}

function showForecastError(message) {
  const chartContainer = document.getElementById('forecast-body');
  chartContainer.innerHTML = `<p class="forecast-placeholder">${message}</p>`;
  document.getElementById('statement-summary').hidden = true;
}

function renderForecast(forecast, netLabel) {
  const chartContainer = document.getElementById('forecast-body');
  renderBalanceChart(chartContainer, forecast.balanceSeries);

  setNetLabel(netLabel);
  animateNumber(document.getElementById('stat-net'), forecast.summary.netIncomePerMonth);
  animateNumber(document.getElementById('stat-income'), forecast.summary.totalUpcomingIncome);
  animateNumber(document.getElementById('stat-expense'), forecast.summary.totalUpcomingExpenses);
  animateNumber(document.getElementById('stat-end-balance'), forecast.summary.projectedEndBalance);

  document.getElementById('statement-summary').hidden = false;
}

/* ===== Week view — computed from real transactions already on the page ===== */

function getWeekRange(week) {
  const today = new Date();
  const year = today.getFullYear();
  const month = today.getMonth();
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const starts = [1, 8, 15, 22];
  const start = starts[week - 1];
  const end = week === 4 ? daysInMonth : starts[week] - 1;

  return {
    start: new Date(year, month, start),
    end: new Date(year, month, end),
  };
}

function loadWeekView(week) {
  const transactions = (typeof state !== 'undefined' && state.transactions) ? state.transactions : [];
  const { start, end } = getWeekRange(week);
  const startIso = start.toISOString().slice(0, 10);
  const endIso = end.toISOString().slice(0, 10);

  // Running balance going into this week = net of everything before it.
  let runningBalance = 0;
  for (const t of transactions) {
    if (t.date < startIso) {
      runningBalance += t.type === 'income' ? Number(t.amount) : -Number(t.amount);
    }
  }

  const balanceSeries = [];
  let weekIncome = 0;
  let weekExpense = 0;
  const cursor = new Date(start);
  while (cursor <= end) {
    const iso = cursor.toISOString().slice(0, 10);
    const dayTx = transactions.filter((t) => t.date === iso);
    for (const t of dayTx) {
      const amt = Number(t.amount);
      if (t.type === 'income') { runningBalance += amt; weekIncome += amt; }
      else { runningBalance -= amt; weekExpense += amt; }
    }
    balanceSeries.push({ date: iso, balance: runningBalance });
    cursor.setDate(cursor.getDate() + 1);
  }

  const forecast = {
    balanceSeries,
    summary: {
      netIncomePerMonth: weekIncome - weekExpense,
      totalUpcomingIncome: weekIncome,
      totalUpcomingExpenses: weekExpense,
      projectedEndBalance: runningBalance,
    },
  };

  renderForecast(forecast, 'Net this week');
}

/* ===== Month view — real API ===== */

async function loadMonthView() {
  const chartContainer = document.getElementById('forecast-body');
  chartContainer.innerHTML = '<p class="forecast-placeholder">Loading forecast…</p>';

  try {
    const forecast = await getForecast(selectedMonths);
    if (!forecast.balanceSeries || forecast.balanceSeries.length === 0) {
      showForecastError('No forecast data yet — add some transactions to see a projection.');
      return;
    }
    renderForecast(forecast, 'Net income / month');
  } catch (err) {
    showForecastError(err.messages ? err.messages.join(' ') : 'Could not load the forecast.');
  }
}

function initMonthSelector() {
  const container = document.getElementById('month-selector');
  container.addEventListener('click', (e) => {
    const btn = e.target.closest('button');
    if (!btn) return;

    container.querySelectorAll('button').forEach((b) => b.classList.remove('is-active'));
    btn.classList.add('is-active');

    if (btn.dataset.months) {
      currentMode = 'months';
      selectedMonths = Number(btn.dataset.months);
      loadMonthView();
    } else if (btn.dataset.week) {
      currentMode = 'week';
      currentWeek = Number(btn.dataset.week);
      loadWeekView(currentWeek);
    }
  });
}

function initForecast() {
  initMonthSelector();
  loadMonthView();
}
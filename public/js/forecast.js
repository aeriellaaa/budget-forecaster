/**
 * forecast.js — forecast panel logic.
 *
 * Day 6: wired to the real GET /api/forecast?months=N endpoint.
 */

let selectedMonths = 6;

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

function showForecastError(message) {
  const chartContainer = document.getElementById('forecast-body');
  chartContainer.innerHTML = `<p class="forecast-placeholder">${message}</p>`;
  document.getElementById('statement-summary').hidden = true;
}

function renderForecast(forecast) {
  const chartContainer = document.getElementById('forecast-body');
  renderBalanceChart(chartContainer, forecast.balanceSeries);

  animateNumber(document.getElementById('stat-net'), forecast.summary.netIncomePerMonth);
  animateNumber(document.getElementById('stat-income'), forecast.summary.totalUpcomingIncome);
  animateNumber(document.getElementById('stat-expense'), forecast.summary.totalUpcomingExpenses);
  animateNumber(document.getElementById('stat-end-balance'), forecast.summary.projectedEndBalance);

  document.getElementById('statement-summary').hidden = false;
}

async function loadForecast() {
  const chartContainer = document.getElementById('forecast-body');
  chartContainer.innerHTML = '<p class="forecast-placeholder">Loading forecast…</p>';

  try {
    const forecast = await getForecast(selectedMonths);
    if (!forecast.balanceSeries || forecast.balanceSeries.length === 0) {
      showForecastError('No forecast data yet — add some transactions to see a projection.');
      return;
    }
    renderForecast(forecast);
  } catch (err) {
    showForecastError(err.messages ? err.messages.join(' ') : 'Could not load the forecast.');
  }
}

function initMonthSelector() {
  const container = document.getElementById('month-selector');
  container.addEventListener('click', (e) => {
    const btn = e.target.closest('button[data-months]');
    if (!btn) return;

    container.querySelectorAll('button').forEach((b) => b.classList.remove('is-active'));
    btn.classList.add('is-active');
    selectedMonths = Number(btn.dataset.months);

    loadForecast();
  });
}

function initForecast() {
  initMonthSelector();
  loadForecast();
}
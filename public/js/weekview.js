/**
 * weekview.js — day-by-day expense grid, grouped into calendar weeks (Mon–Sun)
 * of the current month. Mirrors a physical daily-tracker notebook page.
 */

const WEEKVIEW_DAY_NAMES = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

let weekViewState = {
  weeks: [],
  activeWeek: 0,
  byDate: {},
  _initializedToToday: false,
};

function toISODate(d) {
  return d.toISOString().slice(0, 10);
}

// Builds Mon–Sun weeks covering the given month, padding the first/last
// week with lead-in/lead-out days so every week has 7 columns.
function buildWeekviewCalendarWeeks(year, monthIndex) {
  const firstOfMonth = new Date(year, monthIndex, 1);
  const lastOfMonth = new Date(year, monthIndex + 1, 0);

  const leadInDays = (firstOfMonth.getDay() + 6) % 7;
  const start = new Date(firstOfMonth);
  start.setDate(start.getDate() - leadInDays);

  const trailOutDays = (7 - ((lastOfMonth.getDay() + 6) % 7) - 1 + 7) % 7;
  const end = new Date(lastOfMonth);
  end.setDate(end.getDate() + trailOutDays);

  const weeks = [];
  let cursor = new Date(start);
  let weekNum = 1;
  while (cursor <= end) {
    const days = [];
    for (let i = 0; i < 7; i++) {
      const d = new Date(cursor);
      days.push({
        date: toISODate(d),
        dayName: WEEKVIEW_DAY_NAMES[i],
        inMonth: d.getMonth() === monthIndex,
      });
      cursor.setDate(cursor.getDate() + 1);
    }
    weeks.push({ label: `Week ${weekNum}`, days });
    weekNum++;
  }
  return weeks;
}

function groupTransactionsByDate(transactions) {
  const byDate = {};
  for (const t of transactions) {
    if (!byDate[t.date]) byDate[t.date] = [];
    byDate[t.date].push(t);
  }
  return byDate;
}

function dayTotal(dayTx) {
  return dayTx.reduce((sum, t) => sum + (t.type === 'income' ? t.amount : -t.amount), 0);
}

function renderWeekTabs() {
  const tabs = document.getElementById('weekview-tabs');
  if (!tabs) return;
  tabs.innerHTML = '';
  weekViewState.weeks.forEach((week, i) => {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = `weekview__tab${i === weekViewState.activeWeek ? ' weekview__tab--active' : ''}`;
    btn.textContent = week.label;
    btn.addEventListener('click', () => {
      weekViewState.activeWeek = i;
      renderWeekTabs();
      renderWeekGrid();
      renderWeekSummary();
    });
    tabs.appendChild(btn);
  });
}

function renderWeekGrid() {
  const grid = document.getElementById('weekview-grid');
  if (!grid) return;
  const week = weekViewState.weeks[weekViewState.activeWeek];
  if (!week) { grid.innerHTML = ''; return; }

  grid.innerHTML = '';
  for (const day of week.days) {
    const dayTx = weekViewState.byDate[day.date] || [];
    const col = document.createElement('div');
    col.className = `weekview__day${day.inMonth ? '' : ' weekview__day--outside'}`;

    const dateLabel = new Date(day.date + 'T00:00:00').toLocaleDateString('en-US', { day: 'numeric', month: 'short' });

    const entriesHtml = dayTx.length === 0
      ? '<div class="weekview__entry weekview__entry--empty">\u2014</div>'
      : dayTx.map((t) => `
          <div class="weekview__entry weekview__entry--${t.type}">
            <span class="weekview__entry-cat">${t.category}</span>
            <span class="weekview__entry-amt">${formatAmount(t.amount, t.type)}</span>
          </div>
        `).join('');

    const total = dayTotal(dayTx);
    const totalClass = total > 0 ? 'weekview__total--pos' : total < 0 ? 'weekview__total--neg' : '';
    const totalLabel = dayTx.length ? formatAmount(Math.abs(total), total >= 0 ? 'income' : 'expense') : '';

    col.innerHTML = `
      <div class="weekview__day-header">
        <span class="weekview__day-name">${day.dayName}</span>
        <span class="weekview__day-date">${dateLabel}</span>
      </div>
      <div class="weekview__entries">${entriesHtml}</div>
      <div class="weekview__day-total ${totalClass}">${totalLabel}</div>
    `;
    grid.appendChild(col);
  }
}

function renderWeekSummary() {
  const summaryEl = document.getElementById('weekview-summary');
  if (!summaryEl) return;
  const week = weekViewState.weeks[weekViewState.activeWeek];
  if (!week) { summaryEl.innerHTML = ''; return; }

  let income = 0, expense = 0;
  const categoryTotals = {};
  for (const day of week.days) {
    const dayTx = weekViewState.byDate[day.date] || [];
    for (const t of dayTx) {
      if (t.type === 'income') {
        income += t.amount;
      } else {
        expense += t.amount;
        categoryTotals[t.category] = (categoryTotals[t.category] || 0) + t.amount;
      }
    }
  }
  const topCategory = Object.entries(categoryTotals).sort((a, b) => b[1] - a[1])[0];
  const net = income - expense;

   summaryEl.innerHTML = `
    <div class="weekview__summary-item">
      <span class="weekview__summary-label">Income</span>
      <span class="weekview__summary-value weekview__summary-value--income">+\u20B9${income.toFixed(2)}</span>
    </div>
    <div class="weekview__summary-item">
      <span class="weekview__summary-label">Spent</span>
      <span class="weekview__summary-value weekview__summary-value--expense">\u2212\u20B9${expense.toFixed(2)}</span>
    </div>
    <div class="weekview__summary-item">
      <span class="weekview__summary-label">Net</span>
      <span class="weekview__summary-value">${net >= 0 ? '+' : '\u2212'}\u20B9${Math.abs(net).toFixed(2)}</span>
    </div>
    <div class="weekview__summary-item">
      <span class="weekview__summary-label">Top category</span>
      <span class="weekview__summary-value">${topCategory ? `${topCategory[0]} (\u20B9${topCategory[1].toFixed(2)})` : '\u2014'}</span>
    </div>
  `;
}

function renderWeekView(transactions) {
  const now = new Date();
  weekViewState.weeks = buildWeekviewCalendarWeeks(now.getFullYear(), now.getMonth());
  weekViewState.byDate = groupTransactionsByDate(transactions);

  if (!weekViewState._initializedToToday) {
    const todayISO = toISODate(now);
    const idx = weekViewState.weeks.findIndex((w) => w.days.some((d) => d.date === todayISO));
    weekViewState.activeWeek = idx === -1 ? 0 : idx;
    weekViewState._initializedToToday = true;
  }

  renderWeekTabs();
  renderWeekGrid();
  renderWeekSummary();
}
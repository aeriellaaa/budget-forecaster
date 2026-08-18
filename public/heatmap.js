function computeDailyExpenseTotals(transactions) {
  const totals = {};
  for (const t of transactions) {
    if (t.type !== 'expense') continue;
    totals[t.date] = (totals[t.date] || 0) + Number(t.amount);
  }
  return totals;
}

function levelForAmount(amount) {
  if (!amount || amount <= 0) return 'none';
  if (amount > 1000) return 'blue';
  if (amount < 50) return 'green';
  if (amount < 150) return 'orange';
  if (amount < 250) return 'pink';
  return 'red'; // covers 250–1000
}

function buildCalendarWeeks(year) {
  const jan1 = new Date(year, 0, 1);
  const dec31 = new Date(year, 11, 31);
  const start = new Date(jan1);
  start.setDate(start.getDate() - start.getDay());
  const end = new Date(dec31);
  end.setDate(end.getDate() + (6 - end.getDay()));

  const weeks = [];
  const cursor = new Date(start);
  while (cursor <= end) {
    const week = [];
    for (let d = 0; d < 7; d++) {
      week.push(new Date(cursor));
      cursor.setDate(cursor.getDate() + 1);
    }
    weeks.push(week);
  }
  return weeks;
}

function getMonthLabels(weeks) {
  const labels = [];
  let lastMonth = -1;
  weeks.forEach((week, i) => {
    const firstOfMonth = week.find((d) => d.getDate() === 1);
    if (firstOfMonth && firstOfMonth.getMonth() !== lastMonth) {
      labels.push({ index: i, label: firstOfMonth.toLocaleDateString('en-US', { month: 'short' }) });
      lastMonth = firstOfMonth.getMonth();
    }
  });
  return labels;
}

function renderHeatmap(container, transactions) {
  const totals = computeDailyExpenseTotals(transactions);
  const year = new Date().getFullYear();
  const weeks = buildCalendarWeeks(year);
  const monthLabels = getMonthLabels(weeks);

  const monthsHtml = monthLabels
    .map((m) => `<span style="grid-column: ${m.index + 1};">${m.label}</span>`)
    .join('');

  const gridHtml = weeks
    .map((week) => (
      '<div class="heatmap-col">' +
      week.map((date) => {
        const iso = date.toISOString().slice(0, 10);
        const amount = totals[iso] || 0;
        const inYear = date.getFullYear() === year;
        const level = inYear ? levelForAmount(amount) : 'none';
        const title = inYear
          ? (amount > 0 ? `${iso}: $${amount.toFixed(2)} spent` : `${iso}: no spending`)
          : '';
        return `<div class="heatmap-cell heatmap-cell--${level}" title="${title}"></div>`;
      }).join('') +
      '</div>'
    ))
    .join('');

  container.innerHTML = `
    <div class="heatmap-inner">
      <div class="heatmap-months">${monthsHtml}</div>
      <div class="heatmap-body">
        <div class="heatmap-weekdays">
          <span></span><span>Mon</span><span></span><span>Wed</span><span></span><span>Fri</span><span></span>
        </div>
        <div class="heatmap-grid">${gridHtml}</div>
      </div>
    </div>
  `;
}

function renderActivityRing(container, valueEl, transactions) {
  const spent = transactions.filter((t) => t.type === 'expense').reduce((s, t) => s + Number(t.amount), 0);
  const income = transactions.filter((t) => t.type === 'income').reduce((s, t) => s + Number(t.amount), 0);
  const total = income > 0 ? income : spent;
  const isOver = total > 0 && spent > total;
  const ratio = total > 0 ? Math.min(spent / total, 1) : 0;

  const size = 120;
  const stroke = 10;
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference * (1 - ratio);
  const progressColor = isOver ? 'var(--expense)' : 'var(--accent)';

  container.innerHTML = `
    <svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
      <circle cx="${size / 2}" cy="${size / 2}" r="${radius}" fill="none" stroke="var(--line)" stroke-width="${stroke}" />
      <circle class="activity-ring-progress" cx="${size / 2}" cy="${size / 2}" r="${radius}" fill="none"
        stroke="${progressColor}" stroke-width="${stroke}" stroke-linecap="round"
        stroke-dasharray="${circumference}" stroke-dashoffset="${circumference}"
        transform="rotate(-90 ${size / 2} ${size / 2})" />
    </svg>
  `;

  const progressCircle = container.querySelector('.activity-ring-progress');
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (reduceMotion) {
    progressCircle.style.strokeDashoffset = offset;
  } else {
    progressCircle.style.transition = 'stroke-dashoffset 0.8s ease-out';
    requestAnimationFrame(() => { progressCircle.style.strokeDashoffset = offset; });
  }

  valueEl.innerHTML = `
    <strong>$${spent.toLocaleString(undefined, { maximumFractionDigits: 0 })}</strong>
    <span>of $${total.toLocaleString(undefined, { maximumFractionDigits: 0 })}</span>
    ${isOver ? '<em>over budget 😬</em>' : ''}
  `;
}

function renderActivityPanel(transactions) {
  const heatmapEl = document.getElementById('heatmap');
  const ringEl = document.getElementById('activity-ring');
  const ringValueEl = document.getElementById('activity-ring-value');
  if (!heatmapEl || !ringEl || !ringValueEl) return;
  renderHeatmap(heatmapEl, transactions);
  renderActivityRing(ringEl, ringValueEl, transactions);
}
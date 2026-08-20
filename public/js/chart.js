/**
 * chart.js — lightweight SVG line chart, no external library.
 * Draws the line in with a stroke animation when it renders.
 */

function renderBalanceChart(container, series) {
  container.innerHTML = '';

  if (!series || series.length === 0) {
    container.innerHTML = '<p class="forecast-placeholder">No forecast data available.</p>';
    return;
  }

  const width = container.clientWidth || 600;
  const height = 220;
  const padding = { top: 20, right: 20, bottom: 30, left: 60 };
  const plotWidth = width - padding.left - padding.right;
  const plotHeight = height - padding.top - padding.bottom;

  const balances = series.map((p) => p.balance);
  const minBalance = Math.min(...balances);
  const maxBalance = Math.max(...balances);
  const range = maxBalance - minBalance || 1;

  const yPad = range * 0.1;
  const yMin = minBalance - yPad;
  const yMax = maxBalance + yPad;
  const yRange = yMax - yMin;

  function xForIndex(i) {
    if (series.length === 1) return padding.left + plotWidth / 2;
    return padding.left + (i / (series.length - 1)) * plotWidth;
  }

  function yForBalance(balance) {
    return padding.top + plotHeight - ((balance - yMin) / yRange) * plotHeight;
  }

  const lowestIndex = balances.indexOf(minBalance);

  const points = series.map((p, i) => `${xForIndex(i)},${yForBalance(p.balance)}`);
  const linePath = `M ${points.join(' L ')}`;
  const areaPath = `${linePath} L ${xForIndex(series.length - 1)},${padding.top + plotHeight} L ${xForIndex(0)},${padding.top + plotHeight} Z`;

  const gridValues = [yMin + yRange, yMin + yRange / 2, yMin];
  const gridLines = gridValues
    .map((val) => {
      const y = yForBalance(val);
      return `
        <line x1="${padding.left}" y1="${y}" x2="${width - padding.right}" y2="${y}"
          stroke="var(--line)" stroke-width="1" stroke-dasharray="2,3" />
               <text x="${padding.left - 8}" y="${y + 4}" text-anchor="end"
          font-family="var(--font-mono)" font-size="11" fill="var(--ink-faint)">
          \u20B9${Math.round(val).toLocaleString()}
        </text>
      `;
    })
    .join('');

  const labelIndices = series.length > 2
    ? [0, Math.floor((series.length - 1) / 2), series.length - 1]
    : series.map((_, i) => i);

  const xLabels = labelIndices
    .map((i) => {
      const d = new Date(series[i].date + 'T00:00:00');
      const label = d.toLocaleDateString('en-US', { month: 'short', year: '2-digit' });
      return `
        <text x="${xForIndex(i)}" y="${height - 8}" text-anchor="middle"
          font-family="var(--font-mono)" font-size="11" fill="var(--ink-faint)">
          ${label}
        </text>
      `;
    })
    .join('');

  const lowestX = xForIndex(lowestIndex);
  const lowestY = yForBalance(minBalance);

  const svg = `
    <svg viewBox="0 0 ${width} ${height}" width="100%" height="${height}" xmlns="http://www.w3.org/2000/svg">
      ${gridLines}

      <path class="chart-area-path" d="${areaPath}" fill="var(--accent-bg)" />
      <path class="chart-line-path" d="${linePath}" fill="none" stroke="var(--accent)" stroke-width="2" stroke-linejoin="round" stroke-linecap="round" />

      <circle class="chart-lowest-dot" cx="${lowestX}" cy="${lowestY}" r="5" fill="var(--expense)" stroke="var(--card-bg)" stroke-width="2" />
      <text x="${lowestX}" y="${lowestY - 12}" text-anchor="middle"
        font-family="var(--font-mono)" font-size="11" font-weight="600" fill="var(--expense)">
        \u20B9${Math.round(minBalance).toLocaleString()}
      </text>

      ${xLabels}
    </svg>
  `;

  container.innerHTML = svg;
  animateChartIn(container, lowestX, lowestY);
}

function animateChartIn(container, lowestX, lowestY) {
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  const linePathEl = container.querySelector('.chart-line-path');
  const areaEl = container.querySelector('.chart-area-path');
  const dotEl = container.querySelector('.chart-lowest-dot');

  if (reduceMotion) {
    if (areaEl) areaEl.style.opacity = '0.5';
    return;
  }

  if (linePathEl) {
    const length = linePathEl.getTotalLength();
    linePathEl.style.strokeDasharray = length;
    linePathEl.style.strokeDashoffset = length;
    linePathEl.getBoundingClientRect(); // force reflow before animating
    linePathEl.style.transition = 'stroke-dashoffset 0.9s ease-out';
    requestAnimationFrame(() => {
      linePathEl.style.strokeDashoffset = '0';
    });
  }

  if (areaEl) {
    areaEl.style.opacity = '0';
    areaEl.style.transition = 'opacity 0.6s ease 0.5s';
    requestAnimationFrame(() => {
      areaEl.style.opacity = '0.5';
    });
  }

  if (dotEl) {
    dotEl.style.transformOrigin = `${lowestX}px ${lowestY}px`;
    dotEl.style.transform = 'scale(0)';
    dotEl.style.transition = 'transform 0.3s ease 0.9s';
    requestAnimationFrame(() => {
      dotEl.style.transform = 'scale(1)';
    });
  }
}
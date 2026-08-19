/**
 * main.js — app init. Keep this thin: just wire up the modules.
 */

function initThemeToggle() {
  const toggle = document.getElementById('theme-toggle');

  function updateIcon() {
    const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
    toggle.textContent = isDark ? '☀️' : '🌙';
    toggle.setAttribute('aria-label', isDark ? 'Switch to light mode' : 'Switch to dark mode');
  }

  toggle.addEventListener('click', () => {
    const current = document.documentElement.getAttribute('data-theme');
    const next = current === 'dark' ? 'light' : 'dark';
    document.documentElement.setAttribute('data-theme', next);
    localStorage.setItem('theme', next);
    updateIcon();
  });

  updateIcon();
}

document.addEventListener('DOMContentLoaded', () => {
  initThemeToggle();
  initTransactions();
  initForecast();
});

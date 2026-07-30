/* =====================================================
   EXPENSE MANAGER - Utility Functions
   ===================================================== */

const Utils = {

  // ==================== Currency Formatting ====================

  /**
   * Format amount as Vietnamese Dong currency
   * @param {number} amount
   * @returns {string} e.g. "1,000,000đ"
   */
  formatCurrency(amount) {
    if (amount === undefined || amount === null || isNaN(amount)) return '0đ';
    const absAmount = Math.abs(amount);
    const formatted = new Intl.NumberFormat('vi-VN').format(absAmount);
    return (amount < 0 ? '-' : '') + formatted + 'đ';
  },

  /**
   * Format amount in short form
   * @param {number} amount
   * @returns {string} e.g. "1.5 tr", "500k"
   */
  formatCurrencyShort(amount) {
    if (!amount) return '0đ';
    const abs = Math.abs(amount);
    const sign = amount < 0 ? '-' : '';
    if (abs >= 1000000000) {
      return sign + (abs / 1000000000).toFixed(1).replace('.0', '') + ' tỷ';
    }
    if (abs >= 1000000) {
      return sign + (abs / 1000000).toFixed(1).replace('.0', '') + ' tr';
    }
    if (abs >= 1000) {
      return sign + (abs / 1000).toFixed(0) + 'k';
    }
    return this.formatCurrency(amount);
  },

  /**
   * Parse currency string back to number
   * @param {string} str
   * @returns {number}
   */
  parseCurrency(str) {
    if (!str) return 0;
    const cleaned = str.replace(/[^\d-]/g, '');
    return parseInt(cleaned, 10) || 0;
  },

  // ==================== Date Formatting ====================

  /**
   * Format date string to Vietnamese format
   * @param {string} dateStr - ISO date string (YYYY-MM-DD)
   * @returns {string} e.g. "29/07/2026"
   */
  formatDate(dateStr) {
    if (!dateStr) return '';
    const date = new Date(dateStr + 'T00:00:00');
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    return `${day}/${month}/${year}`;
  },

  /**
   * Format date short (without year)
   * @param {string} dateStr
   * @returns {string} e.g. "29/07"
   */
  formatDateShort(dateStr) {
    if (!dateStr) return '';
    const date = new Date(dateStr + 'T00:00:00');
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    return `${day}/${month}`;
  },

  /**
   * Get relative date label
   * @param {string} dateStr
   * @returns {string} e.g. "Hôm nay", "Hôm qua", "29/07/2026"
   */
  getRelativeDate(dateStr) {
    if (!dateStr) return '';
    const date = new Date(dateStr + 'T00:00:00');
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    const dayBefore = new Date(today);
    dayBefore.setDate(dayBefore.getDate() - 2);

    if (date.getTime() === today.getTime()) return 'Hôm nay';
    if (date.getTime() === yesterday.getTime()) return 'Hôm qua';
    if (date.getTime() === dayBefore.getTime()) return 'Hôm kia';

    const diffDays = Math.floor((today - date) / (1000 * 60 * 60 * 24));
    if (diffDays > 0 && diffDays < 7) return `${diffDays} ngày trước`;
    if (diffDays < 0) {
      const futureDays = Math.abs(diffDays);
      if (futureDays === 1) return 'Ngày mai';
      if (futureDays < 7) return `${futureDays} ngày nữa`;
    }

    return this.formatDate(dateStr);
  },

  /**
   * Get today's date as ISO string (YYYY-MM-DD)
   * @returns {string}
   */
  getTodayStr() {
    const today = new Date();
    return this.dateToStr(today);
  },

  /**
   * Convert Date object to ISO date string
   * @param {Date} date
   * @returns {string} YYYY-MM-DD
   */
  dateToStr(date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  },

  /**
   * Get current month string
   * @param {Date} [date]
   * @returns {string} e.g. "2026-07"
   */
  getMonthStr(date) {
    const d = date || new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
  },

  /**
   * Get month display name
   * @param {string} monthStr - e.g. "2026-07"
   * @returns {string} e.g. "Tháng 7, 2026"
   */
  getMonthName(monthStr) {
    if (!monthStr) return '';
    const [year, month] = monthStr.split('-');
    return `Tháng ${parseInt(month)}, ${year}`;
  },

  /**
   * Get short month name
   * @param {string} monthStr - e.g. "2026-07"
   * @returns {string} e.g. "T7"
   */
  getMonthNameShort(monthStr) {
    if (!monthStr) return '';
    const month = monthStr.split('-')[1];
    return `T${parseInt(month)}`;
  },

  /**
   * Get previous N months as strings
   * @param {number} n
   * @returns {string[]}
   */
  getPreviousMonths(n) {
    const months = [];
    const now = new Date();
    for (let i = n - 1; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      months.push(this.getMonthStr(d));
    }
    return months;
  },

  /**
   * Get days in a month
   * @param {string} monthStr
   * @returns {number}
   */
  getDaysInMonth(monthStr) {
    const [year, month] = monthStr.split('-').map(Number);
    return new Date(year, month, 0).getDate();
  },

  // ==================== ID Generation ====================

  /**
   * Generate a unique ID
   * @returns {string}
   */
  generateId() {
    return Date.now().toString(36) + Math.random().toString(36).substring(2, 11);
  },

  // ==================== Array Helpers ====================

  /**
   * Group array items by a key or function
   * @param {Array} arr
   * @param {string|Function} keyOrFn
   * @returns {Object}
   */
  groupBy(arr, keyOrFn) {
    return arr.reduce((groups, item) => {
      const key = typeof keyOrFn === 'function' ? keyOrFn(item) : item[keyOrFn];
      if (!groups[key]) groups[key] = [];
      groups[key].push(item);
      return groups;
    }, {});
  },

  /**
   * Sum array of numbers or objects by key
   * @param {Array} arr
   * @param {string} [key]
   * @returns {number}
   */
  sum(arr, key) {
    if (!arr || !arr.length) return 0;
    return arr.reduce((total, item) => {
      return total + (key ? (item[key] || 0) : item);
    }, 0);
  },

  /**
   * Sort array by key
   * @param {Array} arr
   * @param {string} key
   * @param {string} [order='desc']
   * @returns {Array}
   */
  sortBy(arr, key, order = 'desc') {
    return [...arr].sort((a, b) => {
      if (order === 'desc') return b[key] - a[key];
      return a[key] - b[key];
    });
  },

  // ==================== Animation Helpers ====================

  /**
   * Animate a number counting up/down
   * @param {HTMLElement} element
   * @param {number} start
   * @param {number} end
   * @param {number} [duration=800]
   */
  animateValue(element, start, end, duration = 800) {
    if (!element) return;
    const startTime = performance.now();

    const update = (currentTime) => {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const easedProgress = this.easeOutCubic(progress);
      const currentValue = Math.floor(start + (end - start) * easedProgress);

      element.textContent = this.formatCurrency(currentValue);

      if (progress < 1) {
        requestAnimationFrame(update);
      }
    };

    requestAnimationFrame(update);
  },

  /**
   * Easing function - ease out cubic
   * @param {number} t - Progress (0-1)
   * @returns {number}
   */
  easeOutCubic(t) {
    return 1 - Math.pow(1 - t, 3);
  },

  /**
   * Easing function - ease in out cubic
   * @param {number} t
   * @returns {number}
   */
  easeInOutCubic(t) {
    return t < 0.5
      ? 4 * t * t * t
      : 1 - Math.pow(-2 * t + 2, 3) / 2;
  },

  // ==================== DOM Helpers ====================

  /**
   * Query selector shorthand
   * @param {string} selector
   * @param {HTMLElement} [parent=document]
   * @returns {HTMLElement}
   */
  $(selector, parent = document) {
    return parent.querySelector(selector);
  },

  /**
   * Query selector all shorthand
   * @param {string} selector
   * @param {HTMLElement} [parent=document]
   * @returns {NodeList}
   */
  $$(selector, parent = document) {
    return parent.querySelectorAll(selector);
  },

  /**
   * Create element with attributes and children
   * @param {string} tag
   * @param {Object} attrs
   * @param {Array|string} children
   * @returns {HTMLElement}
   */
  createElement(tag, attrs = {}, children = []) {
    const el = document.createElement(tag);
    Object.entries(attrs).forEach(([key, value]) => {
      if (key === 'className') el.className = value;
      else if (key === 'innerHTML') el.innerHTML = value;
      else if (key.startsWith('on')) el.addEventListener(key.slice(2).toLowerCase(), value);
      else el.setAttribute(key, value);
    });
    if (typeof children === 'string') {
      el.textContent = children;
    } else if (Array.isArray(children)) {
      children.forEach(child => {
        if (typeof child === 'string') el.appendChild(document.createTextNode(child));
        else if (child instanceof HTMLElement) el.appendChild(child);
      });
    }
    return el;
  },

  // ==================== Misc Helpers ====================

  /**
   * Debounce function
   * @param {Function} fn
   * @param {number} delay
   * @returns {Function}
   */
  debounce(fn, delay) {
    let timeoutId;
    return function (...args) {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => fn.apply(this, args), delay);
    };
  },

  /**
   * Clamp a value between min and max
   * @param {number} value
   * @param {number} min
   * @param {number} max
   * @returns {number}
   */
  clamp(value, min, max) {
    return Math.max(min, Math.min(max, value));
  },

  /**
   * Calculate percentage
   * @param {number} value
   * @param {number} total
   * @returns {number}
   */
  percentage(value, total) {
    if (!total) return 0;
    return Math.round((value / total) * 1000) / 10;
  },

  /**
   * Calculate percentage change between two values
   * @param {number} current
   * @param {number} previous
   * @returns {number}
   */
  percentageChange(current, previous) {
    if (!previous) return current > 0 ? 100 : 0;
    return Math.round(((current - previous) / previous) * 1000) / 10;
  },

  /**
   * Show a toast notification
   * @param {string} message
   * @param {string} [type='success'] - 'success' | 'error' | 'info' | 'warning'
   * @param {number} [duration=2500]
   */
  showToast(message, type = 'success', duration = 2500) {
    // Remove existing toasts
    const existing = document.querySelectorAll('.toast');
    existing.forEach(t => t.remove());

    const iconMap = {
      success: `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>`,
      error: `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>`,
      info: `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>`,
      warning: `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>`
    };

    const colorMap = {
      success: 'var(--color-success)',
      error: 'var(--color-danger)',
      info: 'var(--color-info)',
      warning: 'var(--color-warning)'
    };

    const toast = document.createElement('div');
    toast.className = 'toast';
    toast.innerHTML = `
      <div class="toast-icon" style="color: ${colorMap[type]}">${iconMap[type]}</div>
      <span class="toast-message">${message}</span>
    `;

    const app = document.querySelector('.app') || document.body;
    app.appendChild(toast);

    setTimeout(() => {
      toast.classList.add('exiting');
      setTimeout(() => toast.remove(), 300);
    }, duration);
  }
};

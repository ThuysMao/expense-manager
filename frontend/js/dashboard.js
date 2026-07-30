/* =====================================================
   EXPENSE MANAGER - Dashboard Module
   ===================================================== */

const Dashboard = {

  currentWalletIndex: 0,
  walletBalanceVisible: true,

  async render() {
    const container = Utils.$('#screenDashboard');
    if (!container) return;

    const wallets = await Store.getWallets();
    const activeWalletId = await Store.getActiveWalletId();
    this.currentWalletIndex = Math.max(0, wallets.findIndex(w => w.id === activeWalletId));

    const todaySummary = await Store.getTodaySummary();
    const goals = await Store.getGoals();
    const recentTransactions = await Store.getTransactions({ limit: 5 });

    // Pre-fetch categories for recent transactions
    const categories = await Store.getCategories();
    const categoryMap = {};
    categories.forEach(c => categoryMap[c.id] = c);

    // Pre-fetch month summaries for wallet card
    const currentMonth = Utils.getMonthStr();
    const prevDate = new Date();
    prevDate.setMonth(prevDate.getMonth() - 1);
    const prevMonth = Utils.getMonthStr(prevDate);
    const wallet = wallets[this.currentWalletIndex] || wallets[0];

    let currentSummary = { income: 0, expense: 0 };
    let prevSummary = { income: 0, expense: 0 };
    if (wallet) {
      currentSummary = await Store.getMonthSummary(currentMonth, wallet.id);
      prevSummary = await Store.getMonthSummary(prevMonth, wallet.id);
    }

    container.innerHTML = `
      ${this.renderWalletCard(wallets, currentSummary, prevSummary)}
      ${this.renderQuickActions()}
      ${this.renderTodaySummary(todaySummary)}
      ${this.renderGoalsPreview(goals)}
      ${this.renderRecentTransactions(recentTransactions, categoryMap)}
    `;

    this.bindEvents(container);
    this.animateEntrance();
  },



  renderWalletCard(wallets, currentSummary, prevSummary) {
    if (!wallets.length) return '';
    const wallet = wallets[this.currentWalletIndex] || wallets[0];
    const displayAmount = this.walletBalanceVisible ? Utils.formatCurrency(wallet.balance) : '••••••••';

    const change = Utils.percentageChange(currentSummary.income || 1, prevSummary.income || 1);
    const isPositive = change >= 0;

    // Wallet dots
    const dots = wallets.map((w, i) => `
      <button class="wallet-dot ${i === this.currentWalletIndex ? 'active' : ''}" data-index="${i}" aria-label="${w.name}"></button>
    `).join('');

    return `
      <div class="wallet-card-wrapper">
        <div class="wallet-card wallet-shine animate-card-reveal" id="walletCard">
          <div class="wallet-card-top">
            <div class="wallet-card-name">
              <span class="wallet-card-name-icon">${wallet.icon}</span>
              ${wallet.name}
            </div>
            <button class="wallet-card-eye" id="toggleWalletBalance" aria-label="Toggle wallet balance">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                ${this.walletBalanceVisible
                  ? '<path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/>'
                  : '<path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/>'
                }
              </svg>
            </button>
          </div>
          <div class="wallet-card-amount" id="walletBalance">${displayAmount}</div>
          <div class="wallet-card-bottom">
            <span class="wallet-card-change ${isPositive ? '' : 'negative'}">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                ${isPositive ? '<polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/><polyline points="17 6 23 6 23 12"/>' : '<polyline points="23 18 13.5 8.5 8.5 13.5 1 6"/><polyline points="17 18 23 18 23 12"/>'}
              </svg>
              ${isPositive ? '+' : ''}${change}%
            </span>
            <span class="wallet-card-change-label">so với tháng trước</span>
          </div>
        </div>
        ${wallets.length > 1 ? `<div class="wallet-dots" id="walletDots">${dots}</div>` : ''}
      </div>
    `;
  },

  renderQuickActions() {
    return `
      <div class="quick-actions stagger-children">
        <button class="quick-action" data-action="add-income">
          <div class="quick-action-icon income">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <rect x="2" y="4" width="20" height="16" rx="2"/><path d="M12 8v8"/><path d="M8 12h8"/>
            </svg>
          </div>
          <span class="quick-action-label">Nhập Thu nhập</span>
        </button>
        <button class="quick-action" data-action="add-expense">
          <div class="quick-action-icon expense">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"/><line x1="3" y1="6" x2="21" y2="6"/><path d="M16 10a4 4 0 0 1-8 0"/>
            </svg>
          </div>
          <span class="quick-action-label">Nhập Chi tiêu</span>
        </button>
        <button class="quick-action" data-action="add-goal">
          <div class="quick-action-icon goal">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="2"/>
            </svg>
          </div>
          <span class="quick-action-label">Thiết lập Mục tiêu</span>
        </button>
      </div>
    `;
  },

  renderTodaySummary(summary) {
    return `
      <div class="today-summary">
        <div class="summary-card animate-fade-in-up" style="animation-delay: 0.1s">
          <div class="summary-card-top">
            <div class="summary-card-icon income-icon">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                <polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/>
                <polyline points="17 6 23 6 23 12"/>
              </svg>
            </div>
            <div class="summary-card-info">
              <div class="summary-card-label">Thu nhập</div>
              <div class="summary-card-period">Hôm nay</div>
            </div>
          </div>
          <div class="summary-card-amount income-amount">${Utils.formatCurrency(summary.income)}</div>
        </div>
        <div class="summary-card animate-fade-in-up" style="animation-delay: 0.15s">
          <div class="summary-card-top">
            <div class="summary-card-icon expense-icon">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                <polyline points="23 18 13.5 8.5 8.5 13.5 1 6"/>
                <polyline points="17 18 23 18 23 12"/>
              </svg>
            </div>
            <div class="summary-card-info">
              <div class="summary-card-label">Chi phí</div>
              <div class="summary-card-period">Hôm nay</div>
            </div>
          </div>
          <div class="summary-card-amount expense-amount">${Utils.formatCurrency(summary.expense)}</div>
        </div>
      </div>
    `;
  },

  renderGoalsPreview(goals) {
    const topGoals = goals.slice(0, 3);
    if (!topGoals.length) return '';

    const goalItems = topGoals.map(goal => {
      const progress = Utils.percentage(goal.currentAmount, goal.targetAmount);
      return `
        <div class="goal-item" data-id="${goal.id}">
          <div class="goal-item-icon">${goal.icon}</div>
          <div class="goal-item-content">
            <div class="goal-item-name">${goal.name}</div>
            <div class="goal-item-date">Bắt đầu từ: ${Utils.formatDate(goal.startDate)}</div>
            <div class="goal-item-progress">
              <div class="progress-bar progress-bar-sm">
                <div class="progress-bar-fill" style="width: ${Math.min(progress, 100)}%"></div>
              </div>
              <div class="progress-label">
                <span class="text-muted text-sm">${Utils.formatCurrencyShort(goal.currentAmount)}</span>
                <span class="text-muted text-sm">${progress}%</span>
              </div>
            </div>
          </div>
          <div class="goal-item-actions">
            <button class="edit-goal-btn" data-id="${goal.id}" aria-label="Chỉnh sửa">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
              </svg>
            </button>
            <button class="delete-goal-btn delete-btn" data-id="${goal.id}" aria-label="Xóa">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
              </svg>
            </button>
          </div>
        </div>
      `;
    }).join('');

    return `
      <div class="goals-preview">
        <div class="card">
          <div class="card-header" style="padding: 0 var(--space-5);">
            <span class="card-title">Mục tiêu</span>
            <button class="card-link" id="viewAllGoals">
              Xem tất cả
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <polyline points="9 18 15 12 9 6"/>
              </svg>
            </button>
          </div>
          ${goalItems}
        </div>
      </div>
    `;
  },

  renderRecentTransactions(transactions, categoryMap) {
    if (!transactions.length) return '';

    const items = transactions.map(tx => {
      const category = categoryMap[tx.categoryId];
      const isExpense = tx.type === 'expense';
      return `
        <div class="transaction-item" data-id="${tx.id}">
          <div class="transaction-item-icon" style="background: ${category ? category.color + '15' : '#f3f4f6'}">
            ${category ? category.icon : '💰'}
          </div>
          <div class="transaction-item-content">
            <div class="transaction-item-category">${category ? category.name : 'Khác'}</div>
            <div class="transaction-item-note">${tx.note || Utils.getRelativeDate(tx.date)}</div>
          </div>
          <div class="transaction-item-right">
            <div class="transaction-item-amount ${tx.type}">
              ${isExpense ? '-' : '+'}${Utils.formatCurrency(tx.amount)}
            </div>
            <div class="transaction-item-time">${Utils.getRelativeDate(tx.date)}</div>
          </div>
        </div>
      `;
    }).join('');

    return `
      <div class="recent-transactions">
        <div class="card">
          <div class="card-header" style="padding: 0 var(--space-5);">
            <span class="card-title">Giao dịch gần đây</span>
            <button class="card-link" id="viewAllTransactions">
              Xem tất cả
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <polyline points="9 18 15 12 9 6"/>
              </svg>
            </button>
          </div>
          ${items}
        </div>
      </div>
    `;
  },

  bindEvents(container) {

    // Toggle wallet balance visibility
    const toggleWalletBtn = Utils.$('#toggleWalletBalance', container);
    if (toggleWalletBtn) {
      toggleWalletBtn.addEventListener('click', () => {
        this.walletBalanceVisible = !this.walletBalanceVisible;
        this.render();
      });
    }



    // Wallet dots
    const dots = Utils.$$('.wallet-dot', container);
    dots.forEach(dot => {
      dot.addEventListener('click', async () => {
        const index = parseInt(dot.dataset.index);
        this.currentWalletIndex = index;
        const wallets = await Store.getWallets();
        if (wallets[index]) {
          await Store.setActiveWalletId(wallets[index].id);
        }
        this.render();
      });
    });

    // Quick actions
    const quickActions = Utils.$$('.quick-action', container);
    quickActions.forEach(btn => {
      btn.addEventListener('click', () => {
        const action = btn.dataset.action;
        switch (action) {
          case 'add-expense':
            App.showAddTransaction('expense');
            break;
          case 'add-income':
            App.showAddTransaction('income');
            break;
          case 'add-goal':
            GoalsPage.showAddForm();
            break;
        }
      });
    });

    // View all goals
    const viewGoals = Utils.$('#viewAllGoals', container);
    if (viewGoals) {
      viewGoals.addEventListener('click', () => App.navigate('goals'));
    }

    // View all transactions
    const viewTransactions = Utils.$('#viewAllTransactions', container);
    if (viewTransactions) {
      viewTransactions.addEventListener('click', () => App.navigate('transactions'));
    }

    // Edit goal buttons
    const editBtns = Utils.$$('.edit-goal-btn', container);
    editBtns.forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        GoalsPage.showEditForm(btn.dataset.id);
      });
    });

    // Delete goal buttons
    const deleteBtns = Utils.$$('.delete-goal-btn', container);
    deleteBtns.forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        App.showConfirm('Xóa mục tiêu', 'Bạn có chắc muốn xóa mục tiêu này?', async () => {
          await Store.deleteGoal(btn.dataset.id);
          await this.render();
          Utils.showToast('Đã xóa mục tiêu', 'success');
        });
      });
    });

    // Transaction items - click to edit
    const txItems = Utils.$$('.transaction-item', container);
    txItems.forEach(item => {
      item.addEventListener('click', () => {
        TransactionsPage.showEditForm(item.dataset.id);
      });
    });
  },

  animateEntrance() {
    // Animate wallet card
    const card = Utils.$('#walletCard');
    if (card) {
      card.style.opacity = '0';
      card.style.transform = 'translateY(20px) scale(0.98)';
      requestAnimationFrame(() => {
        card.style.transition = 'all 0.5s cubic-bezier(0.16, 1, 0.3, 1)';
        card.style.opacity = '1';
        card.style.transform = 'translateY(0) scale(1)';
      });
    }
  }
};

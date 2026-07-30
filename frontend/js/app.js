/* =====================================================
   EXPENSE MANAGER - Main App (Router & Core)
   ===================================================== */

const App = {

  currentScreen: 'dashboard',
  screens: ['dashboard', 'transactions', 'stats', 'settings', 'goals'],

  deferredInstallPrompt: null,

  // ==================== Initialization ====================

  async init() {
    await Store.init();
    this.setupRouter();
    this.setupPWA();
    this.navigate('dashboard');
    this.checkCompletedGoals();
  },

  setupPWA() {
    window.addEventListener('beforeinstallprompt', (e) => {
      e.preventDefault();
      this.deferredInstallPrompt = e;
      const installBtn = Utils.$('#installAppBtn');
      if (installBtn) {
        installBtn.style.display = 'flex';
      }
    });
    
    window.addEventListener('appinstalled', () => {
      this.deferredInstallPrompt = null;
      const installBtn = Utils.$('#installAppBtn');
      if (installBtn) {
        installBtn.style.display = 'none';
      }
      console.log('PWA installed');
    });
  },

  // ==================== Router ====================

  setupRouter() {
    // Bottom nav clicks
    const navItems = Utils.$$('.nav-item[data-screen]');
    navItems.forEach(item => {
      item.addEventListener('click', () => {
        const screen = item.dataset.screen;
        if (screen === 'add') {
          this.showAddTransaction('expense');
        } else {
          this.navigate(screen);
        }
      });
    });

    // Hash-based routing
    window.addEventListener('hashchange', () => {
      const hash = window.location.hash.slice(1) || 'dashboard';
      if (this.screens.includes(hash)) {
        this.navigate(hash, false);
      }
    });

    // Initial hash
    const initialHash = window.location.hash.slice(1);
    if (initialHash && this.screens.includes(initialHash)) {
      this.navigate(initialHash, false);
    }
  },

  navigate(screen, updateHash = true) {
    this.currentScreen = screen;

    // Update hash
    if (updateHash) {
      window.location.hash = screen;
    }

    // Hide all screens
    Utils.$$('.screen').forEach(s => {
      s.classList.remove('active');
    });

    // Show target screen
    const targetScreen = Utils.$(`#screen${this.capitalizeFirst(screen)}`);
    if (targetScreen) {
      targetScreen.classList.add('active');
    }

    // Update bottom nav
    Utils.$$('.nav-item').forEach(item => {
      item.classList.remove('active');
    });
    const activeNav = Utils.$(`.nav-item[data-screen="${screen}"]`);
    if (activeNav) activeNav.classList.add('active');

    // Show/hide bottom nav for sub-pages
    const bottomNav = Utils.$('.bottom-nav');
    if (bottomNav) {
      bottomNav.style.display = screen === 'goals' ? 'none' : '';
    }

    // Adjust padding for goals page
    const appContent = Utils.$('.app-content');
    if (appContent) {
      appContent.style.paddingBottom = screen === 'goals' ? '20px' : '';
    }

    // Render screen content
    this.renderScreen(screen);

    // Scroll to top
    const content = Utils.$('.app-content');
    if (content) content.scrollTop = 0;
  },

  async renderScreen(screen) {
    switch (screen) {
      case 'dashboard':
        await Dashboard.render();
        break;
      case 'transactions':
        await TransactionsPage.render();
        break;
      case 'stats':
        await StatsPage.render();
        break;
      case 'settings':
        await WalletsPage.render();
        break;
      case 'goals':
        await GoalsPage.render();
        break;
    }
  },

  async refreshCurrentScreen() {
    await this.renderScreen(this.currentScreen);
    this.checkCompletedGoals();
  },

  async checkCompletedGoals() {
    const goals = await Store.getGoals();
    if (!goals || goals.length === 0) return;

    let notifiedGoals = JSON.parse(localStorage.getItem('notifiedGoals') || '[]');
    let newlyCompleted = [];

    goals.forEach(goal => {
      if (goal.currentAmount >= goal.targetAmount && !notifiedGoals.includes(goal.id)) {
        newlyCompleted.push(goal);
        notifiedGoals.push(goal.id);
      } else if (goal.currentAmount < goal.targetAmount && notifiedGoals.includes(goal.id)) {
        // Remove from notified if it dropped below 100%
        notifiedGoals = notifiedGoals.filter(id => id !== goal.id);
      }
    });

    localStorage.setItem('notifiedGoals', JSON.stringify(notifiedGoals));

    if (newlyCompleted.length > 0) {
      newlyCompleted.forEach((goal, i) => {
        setTimeout(() => {
          this.showGoalCompletedNotification(goal);
        }, i * 3000); // Stagger notifications
      });
    }
  },

  showGoalCompletedNotification(goal) {
    // iOS-style notification content
    const content = `
      <div style="display: flex; flex-direction: column; gap: 4px;">
        <div style="font-weight: 600; font-size: 15px;">Mục tiêu hoàn thành! 🎉</div>
        <div style="opacity: 0.9;">Tuyệt vời! Bạn đã đạt đủ ${Utils.formatCurrencyShort(goal.targetAmount)} cho <b>${goal.name}</b>.</div>
      </div>
    `;
    Utils.showToast(content, 'success', 5000);
  },

  capitalizeFirst(str) {
    return str.charAt(0).toUpperCase() + str.slice(1);
  },

  // ==================== Add Transaction ====================

  async showAddTransaction(type = 'expense') {
    const categories = await Store.getCategories(type);
    const wallets = await Store.getWallets();
    const activeWalletId = await Store.getActiveWalletId();

    const categoryOptions = categories.map((c, i) =>
      `<button class="category-item" data-id="${c.id}">
        <div class="category-item-icon" style="background: ${c.color}15">${c.icon}</div>
        <span class="category-item-name">${c.name}</span>
      </button>`
    ).join('');

    const walletOptions = wallets.map(w =>
      `<button class="wallet-selector-item ${w.id === activeWalletId ? 'selected' : ''}" data-id="${w.id}">
        <span class="wallet-selector-item-icon">${w.icon}</span>
        ${w.name}
      </button>`
    ).join('');

    const isExpense = type === 'expense';

    const content = `
      <div class="modal-handle"></div>
      <div class="modal-header">
        <h2 class="modal-title">Thêm giao dịch</h2>
        <button class="modal-close" id="closeModal">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
            <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
          </svg>
        </button>
      </div>
      <div class="modal-body">
        <div class="type-selector" id="typeSelector">
          <button class="type-selector-btn income-type ${!isExpense ? 'active' : ''}" data-type="income">💰 Thu nhập</button>
          <button class="type-selector-btn expense-type ${isExpense ? 'active' : ''}" data-type="expense">💸 Chi tiêu</button>
        </div>

        <div class="amount-input-wrapper">
          <div class="amount-input-label" id="amountLabel">${isExpense ? 'Số tiền chi' : 'Số tiền thu'}</div>
          <input type="number" class="amount-input ${isExpense ? 'expense-color' : 'income-color'}" id="addAmount" placeholder="0" inputmode="numeric">
          <div class="amount-input-currency">VND</div>
        </div>

        <div class="form-group">
          <label class="form-label">Danh mục</label>
          <div class="category-grid" id="categoryGrid">
            ${categoryOptions}
          </div>
        </div>

        <div class="form-group">
          <label class="form-label">Ví</label>
          <div class="wallet-selector" id="walletSelector">
            ${walletOptions}
          </div>
        </div>

        <div class="form-group">
          <label class="form-label">Ngày</label>
          <div class="date-input-wrapper">
            <input type="date" class="form-input" id="addDate" value="${Utils.getTodayStr()}">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>
            </svg>
          </div>
        </div>

        <div class="form-group">
          <label class="form-label">Ghi chú</label>
          <input type="text" class="form-input" id="addNote" placeholder="Thêm ghi chú...">
        </div>
      </div>
      <div class="modal-footer">
        <button class="btn btn-primary btn-lg btn-block" id="saveTransactionBtn">
          ${isExpense ? 'Thêm chi tiêu' : 'Thêm thu nhập'}
        </button>
      </div>
    `;

    this.showModal(content);

    let currentType = type;
    let selectedCategoryId = null;
    let selectedWalletId = activeWalletId;

    // Type selector
    Utils.$$('#typeSelector .type-selector-btn').forEach(btn => {
      btn.addEventListener('click', async () => {
        currentType = btn.dataset.type;
        Utils.$$('#typeSelector .type-selector-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');

        // Update categories
        const newCategories = await Store.getCategories(currentType);
        const grid = Utils.$('#categoryGrid');
        grid.innerHTML = newCategories.map(c =>
          `<button class="category-item" data-id="${c.id}">
            <div class="category-item-icon" style="background: ${c.color}15">${c.icon}</div>
            <span class="category-item-name">${c.name}</span>
          </button>`
        ).join('');
        selectedCategoryId = null;
        this.bindCategorySelection();

        // Update styling
        const amountInput = Utils.$('#addAmount');
        amountInput.className = `amount-input ${currentType === 'expense' ? 'expense-color' : 'income-color'}`;
        Utils.$('#amountLabel').textContent = currentType === 'expense' ? 'Số tiền chi' : 'Số tiền thu';
        Utils.$('#saveTransactionBtn').textContent = currentType === 'expense' ? 'Thêm chi tiêu' : 'Thêm thu nhập';
      });
    });

    // Category selection
    this.bindCategorySelection = () => {
      Utils.$$('#categoryGrid .category-item').forEach(item => {
        item.addEventListener('click', () => {
          Utils.$$('#categoryGrid .category-item').forEach(i => i.classList.remove('selected'));
          item.classList.add('selected');
          selectedCategoryId = item.dataset.id;
        });
      });
    };
    this.bindCategorySelection();

    // Wallet selection
    Utils.$$('#walletSelector .wallet-selector-item').forEach(item => {
      item.addEventListener('click', () => {
        Utils.$$('#walletSelector .wallet-selector-item').forEach(i => i.classList.remove('selected'));
        item.classList.add('selected');
        selectedWalletId = item.dataset.id;
      });
    });

    // Save transaction
    Utils.$('#saveTransactionBtn').addEventListener('click', async () => {
      const amount = parseInt(Utils.$('#addAmount').value);
      const date = Utils.$('#addDate').value;
      const note = Utils.$('#addNote').value.trim();

      if (!amount || amount <= 0) {
        Utils.showToast('Vui lòng nhập số tiền', 'error');
        Utils.$('#addAmount').focus();
        return;
      }

      if (!selectedCategoryId) {
        Utils.showToast('Vui lòng chọn danh mục', 'error');
        return;
      }

      if (!selectedWalletId) {
        Utils.showToast('Vui lòng chọn ví', 'error');
        return;
      }

      await Store.addTransaction({
        type: currentType,
        amount,
        categoryId: selectedCategoryId,
        walletId: selectedWalletId,
        date,
        note
      });

      this.hideModal();
      await this.refreshCurrentScreen();

      Utils.showToast(
        `Đã thêm ${currentType === 'expense' ? 'chi tiêu' : 'thu nhập'}: ${Utils.formatCurrencyShort(amount)}`,
        'success'
      );
    });

    // Focus amount input
    setTimeout(() => {
      Utils.$('#addAmount')?.focus();
    }, 400);
  },

  // ==================== Wallet Switcher ====================

  async showWalletSwitcher() {
    const wallets = await Store.getWallets();
    const activeId = await Store.getActiveWalletId();

    const items = wallets.map(w => `
      <div class="list-item wallet-switch-item press-effect" data-id="${w.id}" style="cursor: pointer;">
        <div class="list-item-icon" style="background: ${w.color}15">
          ${w.icon}
        </div>
        <div class="list-item-content">
          <div class="list-item-title">${w.name}</div>
          <div class="list-item-subtitle">${Utils.formatCurrency(w.balance)}</div>
        </div>
        ${w.id === activeId ? `
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--color-primary)" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
            <polyline points="20 6 9 17 4 12"/>
          </svg>
        ` : ''}
      </div>
    `).join('');

    const content = `
      <div class="modal-handle"></div>
      <div class="modal-header">
        <h2 class="modal-title">Chọn ví</h2>
        <button class="modal-close" id="closeModal">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
            <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
          </svg>
        </button>
      </div>
      <div class="modal-body" style="padding: 8px 0;">
        ${items}
      </div>
    `;

    this.showModal(content);

    Utils.$$('.wallet-switch-item').forEach(item => {
      item.addEventListener('click', async () => {
        await Store.setActiveWalletId(item.dataset.id);
        const allWallets = await Store.getWallets();
        Dashboard.currentWalletIndex = allWallets.findIndex(w => w.id === item.dataset.id);
        this.hideModal();
        await this.refreshCurrentScreen();
        Utils.showToast('Đã chuyển ví', 'info');
      });
    });
  },

  // ==================== Modal Management ====================

  showModal(content) {
    const overlay = Utils.$('#modalOverlay');
    const container = Utils.$('#modalContainer');

    container.innerHTML = content;
    overlay.classList.add('active');
    document.body.style.overflow = 'hidden';

    // Close button
    const closeBtn = Utils.$('#closeModal', container);
    if (closeBtn) {
      closeBtn.addEventListener('click', () => this.hideModal());
    }

    // Close on backdrop click
    overlay.addEventListener('click', (e) => {
      if (e.target === overlay) {
        this.hideModal();
      }
    });

    // Escape key
    const escHandler = (e) => {
      if (e.key === 'Escape') {
        this.hideModal();
        document.removeEventListener('keydown', escHandler);
      }
    };
    document.addEventListener('keydown', escHandler);
  },

  hideModal() {
    const overlay = Utils.$('#modalOverlay');
    const container = Utils.$('#modalContainer');

    container.style.transform = 'translateY(100%)';
    overlay.style.opacity = '0';

    setTimeout(() => {
      overlay.classList.remove('active');
      overlay.style.opacity = '';
      container.style.transform = '';
      container.innerHTML = '';
      document.body.style.overflow = '';
    }, 350);
  },

  // ==================== Confirm Dialog ====================

  showConfirm(title, message, onConfirm) {
    const dialog = Utils.$('#confirmDialog');
    Utils.$('#confirmTitle', dialog).textContent = title;
    Utils.$('#confirmText', dialog).textContent = message;
    dialog.classList.add('active');

    const confirmBtn = Utils.$('#confirmYes', dialog);
    const cancelBtn = Utils.$('#confirmNo', dialog);

    const cleanup = () => {
      dialog.classList.remove('active');
      confirmBtn.replaceWith(confirmBtn.cloneNode(true));
      cancelBtn.replaceWith(cancelBtn.cloneNode(true));
      // Re-bind cancel after clone
      Utils.$('#confirmNo', dialog).addEventListener('click', () => {
        dialog.classList.remove('active');
      });
    };

    confirmBtn.addEventListener('click', () => {
      cleanup();
      onConfirm();
    }, { once: true });

    cancelBtn.addEventListener('click', () => {
      cleanup();
    }, { once: true });
  }
};

// ==================== Bootstrap ====================
document.addEventListener('DOMContentLoaded', () => {
  App.init();
});

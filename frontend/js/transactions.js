/* =====================================================
   EXPENSE MANAGER - Transactions Module
   ===================================================== */

const TransactionsPage = {

  currentFilter: 'all',
  searchQuery: '',

  async render() {
    const container = Utils.$('#screenTransactions');
    if (!container) return;

    container.innerHTML = `
      <div class="page-header">
        <h1 class="page-header-title">Giao dịch</h1>
        <button class="btn btn-sm btn-secondary" id="addTransactionBtn">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
            <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
          </svg>
          Thêm
        </button>
      </div>

      <div class="transactions-header">
        <div class="search-bar" id="searchBar">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
          </svg>
          <input type="text" placeholder="Tìm kiếm giao dịch..." id="searchInput" value="${this.searchQuery}">
        </div>
      </div>

      <div class="transactions-filters">
        <div class="filter-chips" id="filterChips">
          <button class="chip ${this.currentFilter === 'all' ? 'active' : ''}" data-filter="all">📋 Tất cả</button>
          <button class="chip ${this.currentFilter === 'income' ? 'active' : ''}" data-filter="income">💰 Thu nhập</button>
          <button class="chip ${this.currentFilter === 'expense' ? 'active' : ''}" data-filter="expense">💸 Chi tiêu</button>
        </div>
      </div>

      <div class="transactions-list" id="transactionsList">
        ${await this.renderTransactionsList()}
      </div>
    `;

    this.bindEvents(container);
  },

  async renderTransactionsList() {
    const filters = {
      type: this.currentFilter,
      search: this.searchQuery
    };
    const transactions = await Store.getTransactions(filters);
    const categories = await Store.getCategories();
    const categoryMap = {};
    categories.forEach(c => categoryMap[c.id] = c);

    if (!transactions.length) {
      return `
        <div class="empty-state">
          <div class="empty-state-icon">📭</div>
          <div class="empty-state-title">Chưa có giao dịch</div>
          <div class="empty-state-text">Bắt đầu thêm giao dịch để theo dõi chi tiêu của bạn</div>
        </div>
      `;
    }

    // Group by date
    const grouped = Utils.groupBy(transactions, 'date');
    const sortedDates = Object.keys(grouped).sort((a, b) => b.localeCompare(a));

    return sortedDates.map(date => {
      const dayTransactions = grouped[date];
      const dayExpense = Utils.sum(dayTransactions.filter(t => t.type === 'expense'), 'amount');
      const dayIncome = Utils.sum(dayTransactions.filter(t => t.type === 'income'), 'amount');

      let totalDisplay = '';
      if (dayExpense > 0 && dayIncome > 0) {
        totalDisplay = `<span class="text-success">+${Utils.formatCurrencyShort(dayIncome)}</span> / <span class="text-danger">-${Utils.formatCurrencyShort(dayExpense)}</span>`;
      } else if (dayIncome > 0) {
        totalDisplay = `<span class="text-success">+${Utils.formatCurrencyShort(dayIncome)}</span>`;
      } else {
        totalDisplay = `<span class="text-danger">-${Utils.formatCurrencyShort(dayExpense)}</span>`;
      }

      const items = dayTransactions.map(tx => {
        const category = categoryMap[tx.categoryId];
        const isExpense = tx.type === 'expense';
        return `
          <div class="transaction-item" data-id="${tx.id}">
            <div class="transaction-item-icon" style="background: ${category ? category.color + '15' : '#f3f4f6'}">
              ${category ? category.icon : '💰'}
            </div>
            <div class="transaction-item-content">
              <div class="transaction-item-category">${category ? category.name : 'Khác'}</div>
              <div class="transaction-item-note">${tx.note || 'Không có ghi chú'}</div>
            </div>
            <div class="transaction-item-right">
              <div class="transaction-item-amount ${tx.type}">
                ${isExpense ? '-' : '+'}${Utils.formatCurrency(tx.amount)}
              </div>
            </div>
          </div>
        `;
      }).join('');

      return `
        <div class="transactions-date-group">
          <div class="transactions-date-header">
            <span class="transactions-date-label">${Utils.getRelativeDate(date)}</span>
            <span class="transactions-date-total text-sm">${totalDisplay}</span>
          </div>
          <div class="card card-sm" style="padding: 4px 0;">
            ${items}
          </div>
        </div>
      `;
    }).join('');
  },

  bindEvents(container) {
    // Add transaction button
    const addBtn = Utils.$('#addTransactionBtn', container);
    if (addBtn) {
      addBtn.addEventListener('click', () => App.showAddTransaction('expense'));
    }

    // Filter chips
    const chips = Utils.$$('.chip', container);
    chips.forEach(chip => {
      chip.addEventListener('click', async () => {
        this.currentFilter = chip.dataset.filter;
        chips.forEach(c => c.classList.remove('active'));
        chip.classList.add('active');
        Utils.$('#transactionsList', container).innerHTML = await this.renderTransactionsList();
        this.bindTransactionEvents(container);
      });
    });

    // Search
    const searchInput = Utils.$('#searchInput', container);
    if (searchInput) {
      searchInput.addEventListener('input', Utils.debounce(async () => {
        this.searchQuery = searchInput.value;
        Utils.$('#transactionsList', container).innerHTML = await this.renderTransactionsList();
        this.bindTransactionEvents(container);
      }, 300));
    }

    this.bindTransactionEvents(container);
  },

  bindTransactionEvents(container) {
    // Click on transaction
    const items = Utils.$$('.transaction-item', container);
    items.forEach(item => {
      item.addEventListener('click', () => {
        this.showEditForm(item.dataset.id);
      });
    });
  },

  async showEditForm(id) {
    const transactions = await Store.getTransactions();
    const tx = transactions.find(t => t.id === id);
    if (!tx) return;

    const categories = await Store.getCategories(tx.type);
    const wallets = await Store.getWallets();
    const isExpense = tx.type === 'expense';

    const categoryOptions = categories.map(c =>
      `<button class="category-item ${c.id === tx.categoryId ? 'selected' : ''}" data-id="${c.id}">
        <div class="category-item-icon" style="background: ${c.color}15">${c.icon}</div>
        <span class="category-item-name">${c.name}</span>
      </button>`
    ).join('');

    const walletOptions = wallets.map(w =>
      `<button class="wallet-selector-item ${w.id === tx.walletId ? 'selected' : ''}" data-id="${w.id}">
        <span class="wallet-selector-item-icon">${w.icon}</span>
        ${w.name}
      </button>`
    ).join('');

    const content = `
      <div class="modal-handle"></div>
      <div class="modal-header">
        <h2 class="modal-title">Sửa giao dịch</h2>
        <button class="modal-close" id="closeModal">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
            <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
          </svg>
        </button>
      </div>
      <div class="modal-body">
        <div class="amount-input-wrapper">
          <div class="amount-input-label">${isExpense ? 'Số tiền chi' : 'Số tiền thu'}</div>
          <input type="number" class="amount-input ${isExpense ? 'expense-color' : 'income-color'}" id="editAmount" value="${tx.amount}" placeholder="0">
          <div class="amount-input-currency">VND</div>
        </div>

        <div class="form-group">
          <label class="form-label">Danh mục</label>
          <div class="category-grid" id="editCategoryGrid">
            ${categoryOptions}
          </div>
        </div>

        <div class="form-group">
          <label class="form-label">Ví</label>
          <div class="wallet-selector" id="editWalletSelector">
            ${walletOptions}
          </div>
        </div>

        <div class="form-group">
          <label class="form-label">Ngày</label>
          <div class="date-input-wrapper">
            <input type="date" class="form-input" id="editDate" value="${tx.date}">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>
            </svg>
          </div>
        </div>

        <div class="form-group">
          <label class="form-label">Ghi chú</label>
          <input type="text" class="form-input" id="editNote" value="${tx.note || ''}" placeholder="Thêm ghi chú...">
        </div>
      </div>
      <div class="modal-footer">
        <div class="flex gap-3">
          <button class="btn btn-danger btn-lg" id="deleteTransactionBtn" style="flex: 0 0 auto; padding: 12px 16px;">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
            </svg>
          </button>
          <button class="btn btn-primary btn-lg btn-block" id="saveEditBtn">Lưu thay đổi</button>
        </div>
      </div>
    `;

    App.showModal(content);

    // Bind edit form events
    let selectedCategoryId = tx.categoryId;
    let selectedWalletId = tx.walletId;

    // Category selection
    const catItems = Utils.$$('#editCategoryGrid .category-item');
    catItems.forEach(item => {
      item.addEventListener('click', () => {
        catItems.forEach(i => i.classList.remove('selected'));
        item.classList.add('selected');
        selectedCategoryId = item.dataset.id;
      });
    });

    // Wallet selection
    const walletItems = Utils.$$('#editWalletSelector .wallet-selector-item');
    walletItems.forEach(item => {
      item.addEventListener('click', () => {
        walletItems.forEach(i => i.classList.remove('selected'));
        item.classList.add('selected');
        selectedWalletId = item.dataset.id;
      });
    });

    // Save
    Utils.$('#saveEditBtn').addEventListener('click', async () => {
      const amount = parseInt(Utils.$('#editAmount').value);
      if (!amount || amount <= 0) {
        Utils.showToast('Vui lòng nhập số tiền hợp lệ', 'error');
        return;
      }

      await Store.updateTransaction(id, {
        amount,
        categoryId: selectedCategoryId,
        walletId: selectedWalletId,
        date: Utils.$('#editDate').value,
        note: Utils.$('#editNote').value
      });

      App.hideModal();
      await App.refreshCurrentScreen();
      Utils.showToast('Đã cập nhật giao dịch', 'success');
    });

    // Delete
    Utils.$('#deleteTransactionBtn').addEventListener('click', () => {
      App.showConfirm('Xóa giao dịch', 'Bạn có chắc muốn xóa giao dịch này? Số dư ví sẽ được cập nhật.', async () => {
        await Store.deleteTransaction(id);
        App.hideModal();
        await App.refreshCurrentScreen();
        Utils.showToast('Đã xóa giao dịch', 'success');
      });
    });
  }
};

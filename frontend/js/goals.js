/* =====================================================
   EXPENSE MANAGER - Goals Module
   ===================================================== */

const GoalsPage = {

  async render() {
    const container = Utils.$('#screenGoals');
    if (!container) return;

    const goals = await Store.getGoals();

    container.innerHTML = `
      <div class="page-header">
        <button class="btn btn-ghost btn-icon" id="goalsBackBtn">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <polyline points="15 18 9 12 15 6"/>
          </svg>
        </button>
        <h1 class="page-header-title">Mục tiêu</h1>
        <button class="btn btn-sm btn-primary" id="addGoalBtn">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
            <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
          </svg>
          Thêm
        </button>
      </div>

      <div class="goals-full-list" id="goalsList">
        ${goals.length ? this.renderGoalsList(goals) : `
          <div class="empty-state">
            <div class="empty-state-icon">🎯</div>
            <div class="empty-state-title">Chưa có mục tiêu nào</div>
            <div class="empty-state-text">Thiết lập mục tiêu tài chính để theo dõi tiến độ tiết kiệm</div>
          </div>
        `}
      </div>
    `;

    this.bindEvents(container);
  },

  renderGoalsList(goals) {
    return goals.map(goal => {
      const progress = Utils.percentage(goal.currentAmount, goal.targetAmount);
      const remaining = goal.targetAmount - goal.currentAmount;
      return `
        <div class="goal-card" data-id="${goal.id}">
          <div class="goal-card-header">
            <div class="goal-card-icon">${goal.icon}</div>
            <div class="goal-card-info">
              <div class="goal-card-title">${goal.name}</div>
              <div class="goal-card-date">
                Bắt đầu từ: ${Utils.formatDate(goal.startDate)}
              </div>
            </div>
          </div>

          <div class="progress-bar">
            <div class="progress-bar-fill" style="width: ${Math.min(progress, 100)}%"></div>
          </div>

          <div class="goal-card-amounts">
            <span class="goal-card-current">${Utils.formatCurrency(goal.currentAmount)}</span>
            <span class="goal-card-target">/ ${Utils.formatCurrencyShort(goal.targetAmount)}</span>
          </div>

          <div style="display: flex; justify-content: space-between; margin-bottom: 12px;">
            <span class="text-sm text-muted">Tiến độ: ${progress}%</span>
            <span class="text-sm text-muted">Còn thiếu: ${Utils.formatCurrencyShort(Math.max(0, remaining))}</span>
          </div>

          <div class="goal-card-actions">
            <button class="btn btn-outline btn-sm edit-goal-btn" data-id="${goal.id}">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
              </svg>
              Chỉnh sửa
            </button>
            <button class="btn btn-outline btn-sm delete-goal-btn" data-id="${goal.id}" style="color: var(--color-danger); border-color: var(--color-danger-light);">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
              </svg>
            </button>
          </div>
        </div>
      `;
    }).join('');
  },

  bindEvents(container) {
    Utils.$('#goalsBackBtn', container)?.addEventListener('click', () => App.navigate('dashboard'));
    Utils.$('#addGoalBtn', container)?.addEventListener('click', () => this.showAddForm());

    Utils.$$('.edit-goal-btn', container).forEach(btn => {
      btn.addEventListener('click', () => this.showEditForm(btn.dataset.id));
    });

    Utils.$$('.delete-goal-btn', container).forEach(btn => {
      btn.addEventListener('click', () => {
        App.showConfirm('Xóa mục tiêu', 'Bạn có chắc muốn xóa mục tiêu này?', async () => {
          await Store.deleteGoal(btn.dataset.id);
          await App.refreshCurrentScreen();
          Utils.showToast('Đã xóa mục tiêu', 'success');
        });
      });
    });
  },

  async showAddForm() {
    const goalIcons = ['🎯', '🏠', '🚗', '✈️', '💻', '📱', '🎓', '💍', '🏍️', '🏥', '👶', '🎮'];

    const content = `
      <div class="modal-handle"></div>
      <div class="modal-header">
        <h2 class="modal-title">Thêm mục tiêu</h2>
        <button class="modal-close" id="closeModal">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
            <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
          </svg>
        </button>
      </div>
      <div class="modal-body">
        <div class="form-group">
          <label class="form-label">Biểu tượng</label>
          <div class="wallet-icon-selector" id="goalIconSelector">
            ${goalIcons.map((icon, i) => `<button class="wallet-icon-option ${i === 0 ? 'selected' : ''}" data-icon="${icon}">${icon}</button>`).join('')}
          </div>
        </div>
        <div class="form-group">
          <label class="form-label">Tên mục tiêu</label>
          <input type="text" class="form-input" id="goalName" placeholder="VD: Mua nhà, Du lịch...">
        </div>
        <div class="form-group">
          <label class="form-label">Số tiền mục tiêu (VND)</label>
          <input type="number" class="form-input" id="goalTarget" placeholder="0">
        </div>
        <div class="form-group">
          <label class="form-label">Ngày bắt đầu</label>
          <div class="date-input-wrapper">
            <input type="date" class="form-input" id="goalStartDate" value="${Utils.getTodayStr()}">
          </div>
        </div>
      </div>
      <div class="modal-footer">
        <button class="btn btn-primary btn-lg btn-block" id="saveGoalBtn">Tạo mục tiêu</button>
      </div>
    `;

    App.showModal(content);

    let selectedIcon = '🎯';

    Utils.$$('#goalIconSelector .wallet-icon-option').forEach(btn => {
      btn.addEventListener('click', () => {
        Utils.$$('#goalIconSelector .wallet-icon-option').forEach(b => b.classList.remove('selected'));
        btn.classList.add('selected');
        selectedIcon = btn.dataset.icon;
      });
    });

    Utils.$('#saveGoalBtn').addEventListener('click', async () => {
      const name = Utils.$('#goalName').value.trim();
      const targetAmount = parseInt(Utils.$('#goalTarget').value);
      const currentAmount = 0; // Tự động đồng bộ với số dư
      const startDate = Utils.$('#goalStartDate').value;
      const endDate = '';

      if (!name) { Utils.showToast('Vui lòng nhập tên mục tiêu', 'error'); return; }
      if (!targetAmount || targetAmount <= 0) { Utils.showToast('Vui lòng nhập số tiền mục tiêu', 'error'); return; }

      await Store.addGoal({ name, targetAmount, currentAmount, startDate, endDate, icon: selectedIcon });
      App.hideModal();
      await App.refreshCurrentScreen();
      Utils.showToast('Đã tạo mục tiêu mới', 'success');
    });
  },

  async showEditForm(id) {
    const goal = await Store.getGoal(id);
    if (!goal) return;

    const goalIcons = ['🎯', '🏠', '🚗', '✈️', '💻', '📱', '🎓', '💍', '🏍️', '🏥', '👶', '🎮'];

    const content = `
      <div class="modal-handle"></div>
      <div class="modal-header">
        <h2 class="modal-title">Sửa mục tiêu</h2>
        <button class="modal-close" id="closeModal">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
            <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
          </svg>
        </button>
      </div>
      <div class="modal-body">
        <div class="form-group">
          <label class="form-label">Biểu tượng</label>
          <div class="wallet-icon-selector" id="goalIconSelector">
            ${goalIcons.map(icon => `<button class="wallet-icon-option ${icon === goal.icon ? 'selected' : ''}" data-icon="${icon}">${icon}</button>`).join('')}
          </div>
        </div>
        <div class="form-group">
          <label class="form-label">Tên mục tiêu</label>
          <input type="text" class="form-input" id="goalName" value="${goal.name}">
        </div>
        <div class="form-group">
          <label class="form-label">Số tiền mục tiêu (VND)</label>
          <input type="number" class="form-input" id="goalTarget" value="${goal.targetAmount}">
        </div>
        <div class="form-group">
          <label class="form-label">Ngày bắt đầu</label>
          <input type="date" class="form-input" id="goalStartDate" value="${goal.startDate}">
        </div>
      </div>
      <div class="modal-footer">
        <button class="btn btn-primary btn-lg btn-block" id="saveGoalBtn">Lưu thay đổi</button>
      </div>
    `;

    App.showModal(content);

    let selectedIcon = goal.icon;

    Utils.$$('#goalIconSelector .wallet-icon-option').forEach(btn => {
      btn.addEventListener('click', () => {
        Utils.$$('#goalIconSelector .wallet-icon-option').forEach(b => b.classList.remove('selected'));
        btn.classList.add('selected');
        selectedIcon = btn.dataset.icon;
      });
    });

    Utils.$('#saveGoalBtn').addEventListener('click', async () => {
      const name = Utils.$('#goalName').value.trim();
      const targetAmount = parseInt(Utils.$('#goalTarget').value);
      const currentAmount = 0; // Tự động đồng bộ với số dư

      if (!name || !targetAmount) { Utils.showToast('Vui lòng điền đầy đủ thông tin', 'error'); return; }

      await Store.updateGoal(id, {
        name, targetAmount, currentAmount,
        startDate: Utils.$('#goalStartDate').value,
        endDate: '',
        icon: selectedIcon
      });
      App.hideModal();
      await App.refreshCurrentScreen();
      Utils.showToast('Đã cập nhật mục tiêu', 'success');
    });
  }
};

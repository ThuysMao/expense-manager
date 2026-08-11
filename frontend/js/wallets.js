/* =====================================================
   EXPENSE MANAGER - Wallets Module
   ===================================================== */

const WalletsPage = {

  async render() {
    const container = Utils.$('#screenSettings');
    if (!container) return;

    const wallets = await Store.getWallets();

    container.innerHTML = `
      <div class="page-header">
        <h1 class="page-header-title">Cài đặt</h1>
      </div>

      <!-- Wallets Section -->
      <div class="section">
        <div class="section-header">
          <span class="section-title">Ví của bạn</span>
          <button class="section-link" id="addWalletBtn">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
              <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
            </svg>
            Thêm ví
          </button>
        </div>
        <div class="card" style="padding: 4px 0;">
          ${wallets.map(w => `
            <div class="list-item wallet-item" data-id="${w.id}">
              <div class="list-item-icon" style="background: ${w.color}15; color: ${w.color}">
                ${w.icon}
              </div>
              <div class="list-item-content">
                <div class="list-item-title">${w.name}</div>
                <div class="list-item-subtitle">${Utils.formatCurrency(w.balance)}</div>
              </div>
              <div class="list-item-actions">
                <button class="btn btn-ghost btn-icon-sm edit-wallet-btn" data-id="${w.id}">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
                  </svg>
                </button>
              </div>
            </div>
          `).join('')}
        </div>
      </div>

      <!-- Other Settings -->
      <div class="section">
        <div class="section-header">
          <span class="section-title">Tổng quan</span>
        </div>
        <div class="card" style="padding: 0;">
          <div class="settings-list">
            <button class="settings-item" id="manageCategories">
              <div class="settings-item-icon" style="background: var(--color-warning-light);">🏷️</div>
              <div class="settings-item-content">
                <div class="settings-item-label">Quản lý danh mục</div>
                <div class="settings-item-desc">Tùy chỉnh danh mục chi tiêu & thu nhập</div>
              </div>
              <div class="settings-item-arrow">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="9 18 15 12 9 6"/></svg>
              </div>
            </button>
            <button class="settings-item" id="toggleThemeBtn">
              <div class="settings-item-icon" style="background: var(--color-gray-200); color: var(--color-gray-800);" id="themeIcon">${document.documentElement.classList.contains('dark-theme') ? '☀️' : '🌙'}</div>
              <div class="settings-item-content">
                <div class="settings-item-label">Giao diện sáng / tối</div>
                <div class="settings-item-desc">Đổi chế độ hiển thị</div>
              </div>
              <div class="settings-item-arrow">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="9 18 15 12 9 6"/></svg>
              </div>
            </button>
            <button class="settings-item" id="installAppBtn" style="display: ${App.deferredInstallPrompt ? 'flex' : 'none'};">
              <div class="settings-item-icon" style="background: var(--color-primary-light); color: var(--color-primary);">📱</div>
              <div class="settings-item-content">
                <div class="settings-item-label" style="color: var(--color-primary); font-weight: 600;">Cài đặt ứng dụng</div>
                <div class="settings-item-desc">Tải về máy tính hoặc điện thoại</div>
              </div>
              <div class="settings-item-arrow">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="9 18 15 12 9 6"/></svg>
              </div>
            </button>
            <button class="settings-item" id="exportDataBtn">
              <div class="settings-item-icon" style="background: var(--color-info-light);">📤</div>
              <div class="settings-item-content">
                <div class="settings-item-label">Xuất dữ liệu</div>
                <div class="settings-item-desc">Tải xuống dữ liệu dạng JSON</div>
              </div>
              <div class="settings-item-arrow">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="9 18 15 12 9 6"/></svg>
              </div>
            </button>
            <button class="settings-item" id="importDataBtn">
              <div class="settings-item-icon" style="background: var(--color-success-light);">📥</div>
              <div class="settings-item-content">
                <div class="settings-item-label">Nhập dữ liệu</div>
                <div class="settings-item-desc">Khôi phục dữ liệu từ file JSON</div>
              </div>
              <div class="settings-item-arrow">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="9 18 15 12 9 6"/></svg>
              </div>
            </button>
            <button class="settings-item" id="resetDataBtn" style="color: var(--color-danger);">
              <div class="settings-item-icon" style="background: var(--color-danger-light);">🗑️</div>
              <div class="settings-item-content">
                <div class="settings-item-label" style="color: var(--color-danger);">Xóa toàn bộ dữ liệu</div>
                <div class="settings-item-desc">Đặt lại ứng dụng về trạng thái ban đầu</div>
              </div>
              <div class="settings-item-arrow">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="9 18 15 12 9 6"/></svg>
              </div>
            </button>
            <button class="settings-item" id="logoutBtn" style="color: var(--color-danger);">
              <div class="settings-item-icon" style="background: var(--color-danger-light);">🚪</div>
              <div class="settings-item-content">
                <div class="settings-item-label">Đăng xuất</div>
                <div class="settings-item-desc">Thoát khỏi tài khoản hiện tại</div>
              </div>
              <div class="settings-item-arrow">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="9 18 15 12 9 6"/></svg>
              </div>
            </button>
            <button class="settings-item" id="deleteAccountBtn" style="color: var(--color-danger);">
              <div class="settings-item-icon" style="background: var(--color-danger-light);">⚠️</div>
              <div class="settings-item-content">
                <div class="settings-item-label" style="color: var(--color-danger);">Xóa tài khoản</div>
                <div class="settings-item-desc">Xóa vĩnh viễn tài khoản và mọi dữ liệu</div>
              </div>
              <div class="settings-item-arrow">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="9 18 15 12 9 6"/></svg>
              </div>
            </button>
          </div>
        </div>
      </div>

      <!-- App Info -->
      <div class="section" style="text-align: center; padding-bottom: var(--space-8);">
        <div class="text-sm text-muted" style="margin-bottom: 4px; font-weight: 600;">💰 Quản lý Chi tiêu v1.0</div>
        <div class="text-xs text-muted" style="margin-bottom: 4px;">&copy; 2026 Bản quyền thuộc về <b>thuysmao</b></div>
        <div class="text-xs text-light">Backend: Python Flask + SQLite</div>
      </div>
    `;

    this.bindEvents(container);
  },

  bindEvents(container) {
    // Add wallet
    Utils.$('#addWalletBtn', container)?.addEventListener('click', () => this.showAddForm());

    // Edit wallet buttons
    Utils.$$('.edit-wallet-btn', container).forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        this.showEditForm(btn.dataset.id);
      });
    });

    // Manage categories
    Utils.$('#manageCategories', container)?.addEventListener('click', () => this.showCategories());

    // Toggle Theme
    Utils.$('#toggleThemeBtn', container)?.addEventListener('click', () => {
      const isDark = document.documentElement.classList.toggle('dark-theme');
      localStorage.setItem('theme', isDark ? 'dark' : 'light');
      
      // Update icon if needed
      const icon = Utils.$('#themeIcon', container);
      if (icon) {
        icon.textContent = isDark ? '☀️' : '🌙';
      }
    });

    // Logout
    Utils.$('#logoutBtn', container)?.addEventListener('click', async () => {
      App.showConfirm(
        'Đăng xuất',
        'Bạn có chắc chắn muốn đăng xuất khỏi tài khoản?',
        async () => {
          try {
            await fetch('/api/auth/logout', { method: 'POST' });
            window.location.href = 'login.html';
          } catch (error) {
            console.error('Logout error:', error);
          }
        }
      );
    });

    // Delete Account
    Utils.$('#deleteAccountBtn', container)?.addEventListener('click', async () => {
      App.showConfirm(
        'CẢNH BÁO: Xóa tài khoản',
        'Hành động này sẽ XÓA VĨNH VIỄN tài khoản của bạn cùng toàn bộ dữ liệu (ví, giao dịch, mục tiêu). Bạn có chắc chắn muốn tiếp tục?',
        async () => {
          try {
            const res = await fetch('/api/auth/delete', { method: 'DELETE' });
            if (res.ok) {
              window.location.href = 'login.html';
            } else {
              Utils.showToast('Không thể xóa tài khoản', 'error');
            }
          } catch (error) {
            console.error('Delete account error:', error);
            Utils.showToast('Lỗi hệ thống', 'error');
          }
        }
      );
    });

    // Install App
    Utils.$('#installAppBtn', container)?.addEventListener('click', async () => {
      if (App.deferredInstallPrompt) {
        App.deferredInstallPrompt.prompt();
        const { outcome } = await App.deferredInstallPrompt.userChoice;
        if (outcome === 'accepted') {
          App.deferredInstallPrompt = null;
        }
      } else {
        Utils.showToast('Vui lòng cài đặt ứng dụng từ menu trình duyệt của bạn (Add to Home Screen).', 'info');
      }
    });

    // Export data
    Utils.$('#exportDataBtn', container)?.addEventListener('click', async () => {
      const data = await Store.exportData();
      const blob = new Blob([data], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `expense-manager-backup-${Utils.getTodayStr()}.json`;
      a.click();
      URL.revokeObjectURL(url);
      Utils.showToast('Đã xuất dữ liệu thành công', 'success');
    });

    // Import data
    Utils.$('#importDataBtn', container)?.addEventListener('click', () => {
      const input = document.createElement('input');
      input.type = 'file';
      input.accept = '.json';
      input.onchange = (e) => {
        const file = e.target.files[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = async (event) => {
          const success = await Store.importData(event.target.result);
          if (success) {
            Utils.showToast('Đã nhập dữ liệu thành công', 'success');
            await App.refreshCurrentScreen();
          } else {
            Utils.showToast('File không hợp lệ', 'error');
          }
        };
        reader.readAsText(file);
      };
      input.click();
    });

    // Reset data
    Utils.$('#resetDataBtn', container)?.addEventListener('click', () => {
      App.showConfirm(
        'Xóa toàn bộ dữ liệu',
        'Tất cả ví, giao dịch, mục tiêu sẽ bị xóa và khôi phục về dữ liệu mẫu. Bạn có chắc chắn?',
        async () => {
          await Store.resetData();
          await App.refreshCurrentScreen();
          Utils.showToast('Đã đặt lại dữ liệu', 'success');
        }
      );
    });
  },

  async showAddForm() {
    const walletIcons = ['💳', '🏦', '💰', '👛', '🪙', '💵', '💴', '🏧', '💎'];

    const content = `
      <div class="modal-handle"></div>
      <div class="modal-header">
        <h2 class="modal-title">Thêm ví mới</h2>
        <button class="modal-close" id="closeModal">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
            <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
          </svg>
        </button>
      </div>
      <div class="modal-body">
        <div class="form-group">
          <label class="form-label">Biểu tượng</label>
          <div class="wallet-icon-selector" id="walletIconSelector">
            ${walletIcons.map((icon, i) => `<button class="wallet-icon-option ${i === 0 ? 'selected' : ''}" data-icon="${icon}">${icon}</button>`).join('')}
          </div>
        </div>
        <div class="form-group">
          <label class="form-label">Tên ví</label>
          <input type="text" class="form-input" id="walletName" placeholder="VD: Ví tiền mặt">
        </div>
        <div class="form-group">
          <label class="form-label">Số dư ban đầu (VND)</label>
          <input type="number" class="form-input" id="walletBalance" placeholder="0" value="0">
        </div>
        <div class="form-group">
          <label class="form-label">Màu sắc</label>
          <div class="wallet-color-selector" id="walletColorSelector">
            ${['#7C3AED', '#3B82F6', '#10B981', '#F97316', '#EC4899', '#EF4444', '#6366F1', '#06B6D4', '#EAB308'].map((color, i) =>
              `<div class="wallet-color-option ${i === 0 ? 'selected' : ''}" data-color="${color}" style="background: ${color}"></div>`
            ).join('')}
          </div>
        </div>
      </div>
      <div class="modal-footer">
        <button class="btn btn-primary btn-lg btn-block" id="saveWalletBtn">Tạo ví</button>
      </div>
    `;

    App.showModal(content);

    let selectedIcon = '💳';
    let selectedColor = '#7C3AED';

    Utils.$$('#walletIconSelector .wallet-icon-option').forEach(btn => {
      btn.addEventListener('click', () => {
        Utils.$$('#walletIconSelector .wallet-icon-option').forEach(b => b.classList.remove('selected'));
        btn.classList.add('selected');
        selectedIcon = btn.dataset.icon;
      });
    });

    Utils.$$('#walletColorSelector .wallet-color-option').forEach(btn => {
      btn.addEventListener('click', () => {
        Utils.$$('#walletColorSelector .wallet-color-option').forEach(b => b.classList.remove('selected'));
        btn.classList.add('selected');
        selectedColor = btn.dataset.color;
      });
    });

    Utils.$('#saveWalletBtn').addEventListener('click', async () => {
      const name = Utils.$('#walletName').value.trim();
      const balance = parseInt(Utils.$('#walletBalance').value) || 0;

      if (!name) {
        Utils.showToast('Vui lòng nhập tên ví', 'error');
        return;
      }

      await Store.addWallet({ name, balance, icon: selectedIcon, color: selectedColor });
      App.hideModal();
      await App.refreshCurrentScreen();
      Utils.showToast('Đã tạo ví mới', 'success');
    });
  },

  async showEditForm(id) {
    const wallet = await Store.getWallet(id);
    if (!wallet) return;

    const walletIcons = ['💳', '🏦', '💰', '👛', '🪙', '💵', '💴', '🏧', '💎'];
    const allWallets = await Store.getWallets();

    const content = `
      <div class="modal-handle"></div>
      <div class="modal-header">
        <h2 class="modal-title">Sửa ví</h2>
        <button class="modal-close" id="closeModal">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
            <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
          </svg>
        </button>
      </div>
      <div class="modal-body">
        <div class="form-group">
          <label class="form-label">Biểu tượng</label>
          <div class="wallet-icon-selector" id="walletIconSelector">
            ${walletIcons.map(icon => `<button class="wallet-icon-option ${icon === wallet.icon ? 'selected' : ''}" data-icon="${icon}">${icon}</button>`).join('')}
          </div>
        </div>
        <div class="form-group">
          <label class="form-label">Tên ví</label>
          <input type="text" class="form-input" id="walletName" value="${wallet.name}">
        </div>
        <div class="form-group">
          <label class="form-label">Số dư hiện tại (VND)</label>
          <input type="number" class="form-input" id="walletBalance" value="${wallet.balance}">
          <div class="form-hint">Lưu ý: Chỉnh sửa số dư sẽ không tạo giao dịch</div>
        </div>
        <div class="form-group">
          <label class="form-label">Màu sắc</label>
          <div class="wallet-color-selector" id="walletColorSelector">
            ${['#7C3AED', '#3B82F6', '#10B981', '#F97316', '#EC4899', '#EF4444', '#6366F1', '#06B6D4', '#EAB308'].map(color =>
              `<div class="wallet-color-option ${color === wallet.color ? 'selected' : ''}" data-color="${color}" style="background: ${color}"></div>`
            ).join('')}
          </div>
        </div>
      </div>
      <div class="modal-footer">
        <div class="flex gap-3">
          ${allWallets.length > 1 ? `
            <button class="btn btn-danger btn-lg" id="deleteWalletBtn" style="flex: 0 0 auto; padding: 12px 16px;">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
              </svg>
            </button>
          ` : ''}
          <button class="btn btn-primary btn-lg btn-block" id="saveWalletBtn">Lưu thay đổi</button>
        </div>
      </div>
    `;

    App.showModal(content);

    let selectedIcon = wallet.icon;
    let selectedColor = wallet.color;

    Utils.$$('#walletIconSelector .wallet-icon-option').forEach(btn => {
      btn.addEventListener('click', () => {
        Utils.$$('#walletIconSelector .wallet-icon-option').forEach(b => b.classList.remove('selected'));
        btn.classList.add('selected');
        selectedIcon = btn.dataset.icon;
      });
    });

    Utils.$$('#walletColorSelector .wallet-color-option').forEach(btn => {
      btn.addEventListener('click', () => {
        Utils.$$('#walletColorSelector .wallet-color-option').forEach(b => b.classList.remove('selected'));
        btn.classList.add('selected');
        selectedColor = btn.dataset.color;
      });
    });

    Utils.$('#saveWalletBtn').addEventListener('click', async () => {
      const name = Utils.$('#walletName').value.trim();
      const balance = parseInt(Utils.$('#walletBalance').value) || 0;

      if (!name) {
        Utils.showToast('Vui lòng nhập tên ví', 'error');
        return;
      }

      await Store.updateWallet(id, { name, balance, icon: selectedIcon, color: selectedColor });
      App.hideModal();
      await App.refreshCurrentScreen();
      Utils.showToast('Đã cập nhật ví', 'success');
    });

    // Delete wallet
    const deleteBtn = Utils.$('#deleteWalletBtn');
    if (deleteBtn) {
      deleteBtn.addEventListener('click', () => {
        App.showConfirm(
          'Xóa ví',
          'Tất cả giao dịch của ví này cũng sẽ bị xóa. Bạn có chắc chắn?',
          async () => {
            await Store.deleteWallet(id);
            App.hideModal();
            await App.refreshCurrentScreen();
            Utils.showToast('Đã xóa ví', 'success');
          }
        );
      });
    }
  },

  async showCategories() {
    const expenseCategories = await Store.getCategories('expense');
    const incomeCategories = await Store.getCategories('income');

    const renderCategoryList = (categories, type) => {
      return categories.map(c => `
        <div class="list-item" style="padding: 10px 16px;">
          <div class="list-item-icon" style="background: ${c.color}15; width: 36px; height: 36px; font-size: 16px;">
            ${c.icon}
          </div>
          <div class="list-item-content">
            <div class="list-item-title" style="font-size: 13px;">${c.name}</div>
          </div>
        </div>
      `).join('');
    };

    const content = `
      <div class="modal-handle"></div>
      <div class="modal-header">
        <h2 class="modal-title">Danh mục</h2>
        <button class="modal-close" id="closeModal">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
            <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
          </svg>
        </button>
      </div>
      <div class="modal-body">
        <h3 class="text-sm font-semibold text-muted mb-3" style="text-transform: uppercase; letter-spacing: 0.5px;">💸 Chi tiêu</h3>
        <div class="card card-flat mb-4" style="padding: 4px 0;">
          ${renderCategoryList(expenseCategories, 'expense')}
        </div>

        <h3 class="text-sm font-semibold text-muted mb-3" style="text-transform: uppercase; letter-spacing: 0.5px;">💰 Thu nhập</h3>
        <div class="card card-flat" style="padding: 4px 0;">
          ${renderCategoryList(incomeCategories, 'income')}
        </div>
      </div>
    `;

    App.showModal(content);
  }
};

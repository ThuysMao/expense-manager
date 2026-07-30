/* =====================================================
   EXPENSE MANAGER - Data Store (API Client)
   Communicates with Python Flask + SQLite backend
   ===================================================== */

const Store = {

  // ==================== API Helper ====================

  async api(method, path, body = null) {
    const options = {
      method,
      headers: { 'Content-Type': 'application/json' }
    };
    if (body) {
      options.body = JSON.stringify(body);
    }
    try {
      const response = await fetch(`/api${path}`, options);
      if (!response.ok) {
        const err = await response.json().catch(() => ({}));
        throw new Error(err.error || `HTTP ${response.status}`);
      }
      return await response.json();
    } catch (error) {
      console.error(`API Error [${method} ${path}]:`, error);
      throw error;
    }
  },

  // ==================== Initialization ====================

  async init() {
    // Backend handles seed data automatically
    // Just verify connection
    try {
      await this.api('GET', '/wallets');
    } catch {
      console.warn('Backend not available, check if server.py is running');
    }
  },

  // ==================== Wallets ====================

  async getWallets() {
    return await this.api('GET', '/wallets');
  },

  async getWallet(id) {
    try {
      const wallets = await this.getWallets();
      return wallets.find(w => w.id === id) || null;
    } catch {
      return null;
    }
  },

  async addWallet(data) {
    return await this.api('POST', '/wallets', data);
  },

  async updateWallet(id, data) {
    return await this.api('PUT', `/wallets/${id}`, data);
  },

  async deleteWallet(id) {
    return await this.api('DELETE', `/wallets/${id}`);
  },

  async getActiveWalletId() {
    const result = await this.api('GET', '/wallets/active');
    return result.id;
  },

  async setActiveWalletId(id) {
    return await this.api('PUT', '/wallets/active', { id });
  },


  // ==================== Categories ====================

  async getCategories(type) {
    const params = type ? `?type=${type}` : '';
    return await this.api('GET', `/categories${params}`);
  },

  async getCategory(id) {
    try {
      return await this.api('GET', `/categories/${id}`);
    } catch {
      return null;
    }
  },

  async addCategory(data) {
    return await this.api('POST', '/categories', data);
  },

  async deleteCategory(id) {
    return await this.api('DELETE', `/categories/${id}`);
  },

  // ==================== Transactions ====================

  async getTransactions(filters = {}) {
    const params = new URLSearchParams();
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        params.append(key, value);
      }
    });
    const queryStr = params.toString();
    return await this.api('GET', `/transactions${queryStr ? '?' + queryStr : ''}`);
  },

  async addTransaction(data) {
    return await this.api('POST', '/transactions', data);
  },

  async updateTransaction(id, data) {
    return await this.api('PUT', `/transactions/${id}`, data);
  },

  async deleteTransaction(id) {
    return await this.api('DELETE', `/transactions/${id}`);
  },

  // ==================== Transaction Analytics ====================

  async getTodaySummary(walletId) {
    const params = walletId ? `?walletId=${walletId}` : '';
    return await this.api('GET', `/stats/today${params}`);
  },

  async getMonthSummary(monthStr, walletId) {
    let params = `?month=${monthStr}`;
    if (walletId) params += `&walletId=${walletId}`;
    return await this.api('GET', `/stats/month${params}`);
  },

  async getMonthlyTrend(numMonths = 6) {
    return await this.api('GET', `/stats/trend?months=${numMonths}`);
  },

  async getCategoryBreakdown(type = 'expense', monthStr) {
    let params = `?type=${type}`;
    if (monthStr) params += `&month=${monthStr}`;
    return await this.api('GET', `/stats/breakdown${params}`);
  },

  // ==================== Goals ====================

  async getGoals() {
    return await this.api('GET', '/goals');
  },

  async getGoal(id) {
    try {
      return await this.api('GET', `/goals/${id}`);
    } catch {
      return null;
    }
  },

  async addGoal(data) {
    return await this.api('POST', '/goals', data);
  },

  async updateGoal(id, data) {
    return await this.api('PUT', `/goals/${id}`, data);
  },

  async deleteGoal(id) {
    return await this.api('DELETE', `/goals/${id}`);
  },

  async addFundsToGoal(id, amount) {
    return await this.api('POST', `/goals/${id}/add-funds`, { amount });
  },

  // ==================== Export / Import / Reset ====================

  async exportData() {
    const data = await this.api('GET', '/export');
    return JSON.stringify(data, null, 2);
  },

  async importData(jsonStr) {
    try {
      const data = JSON.parse(jsonStr);
      await this.api('POST', '/import', data);
      return true;
    } catch {
      return false;
    }
  },

  async resetData() {
    return await this.api('POST', '/reset');
  }
};

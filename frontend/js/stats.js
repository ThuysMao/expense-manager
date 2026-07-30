/* =====================================================
   EXPENSE MANAGER - Statistics Module
   ===================================================== */

const StatsPage = {

  currentPeriod: 'month',
  currentType: 'income',

  async render() {
    const container = Utils.$('#screenStats');
    if (!container) return;

    const currentMonth = Utils.getMonthStr();
    const monthSummary = await Store.getMonthSummary(currentMonth);
    const balance = monthSummary.income - monthSummary.expense;

    const breakdown = await Store.getCategoryBreakdown(this.currentType, currentMonth);
    const trend = await Store.getMonthlyTrend(6);

    container.innerHTML = `
      <div class="page-header">
        <h1 class="page-header-title">Thống kê</h1>
        <span class="text-sm text-muted">${Utils.getMonthName(currentMonth)}</span>
      </div>

      <div class="stats-overview">
        <div class="stats-card">
          <div class="stats-card-label">Thu nhập</div>
          <div class="stats-card-value income">${Utils.formatCurrencyShort(monthSummary.income)}</div>
        </div>
        <div class="stats-card">
          <div class="stats-card-label">Chi tiêu</div>
          <div class="stats-card-value expense">${Utils.formatCurrencyShort(monthSummary.expense)}</div>
        </div>
      </div>

      <div class="stats-overview stats-overview-full" style="margin-top: 0; padding-top: 0;">
        <div class="stats-card" style="background: ${balance >= 0 ? 'var(--color-success-light)' : 'var(--color-danger-light)'};">
          <div class="stats-card-label">Cân đối tháng này</div>
          <div class="stats-card-value ${balance >= 0 ? 'income' : 'expense'}">${balance >= 0 ? '+' : ''}${Utils.formatCurrency(balance)}</div>
        </div>
      </div>

      <div class="chart-section" style="margin-top: var(--space-4);">
        ${this.renderDonutChart()}
      </div>

      <div class="chart-section">
        ${this.renderBarChart()}
      </div>

      <div class="top-categories">
        ${this.renderTopCategories(breakdown)}
      </div>
    `;

    this.bindEvents(container);

    // Draw charts after DOM is ready
    requestAnimationFrame(() => {
      this.drawDonutChart(breakdown);
      this.drawBarChart(trend);
    });
  },

  renderDonutChart() {
    const typeLabel = this.currentType === 'expense' ? 'Chi tiêu' : 'Thu nhập';
    return `
      <div class="chart-container">
        <div class="flex justify-between items-center mb-4">
          <h3 class="chart-title mb-0">${typeLabel} theo danh mục</h3>
          <div class="tabs" style="width: auto; background: var(--color-gray-100);">
            <button class="tab ${this.currentType === 'income' ? 'active' : ''}" data-chart-type="income" style="padding: 6px 12px; font-size: 12px;">Thu nhập</button>
            <button class="tab ${this.currentType === 'expense' ? 'active' : ''}" data-chart-type="expense" style="padding: 6px 12px; font-size: 12px;">Chi tiêu</button>
          </div>
        </div>
        <div class="donut-chart-wrapper">
          <div class="donut-chart-canvas">
            <canvas id="donutCanvas" width="200" height="200"></canvas>
            <div class="donut-chart-center">
              <div class="donut-chart-center-label">Tổng ${typeLabel.toLowerCase()}</div>
              <div class="donut-chart-center-value" id="donutCenterValue">0đ</div>
            </div>
          </div>
          <div class="chart-legend" id="donutLegend"></div>
        </div>
      </div>
    `;
  },

  renderBarChart() {
    return `
      <div class="chart-container">
        <h3 class="chart-title">Thu chi 6 tháng gần nhất</h3>
        <div class="bar-chart-wrapper">
          <div class="bar-chart-canvas">
            <canvas id="barCanvas" width="380" height="200"></canvas>
          </div>
          <div class="bar-chart-legend">
            <div class="bar-legend-item">
              <div class="bar-legend-dot income"></div>
              Thu nhập
            </div>
            <div class="bar-legend-item">
              <div class="bar-legend-dot expense"></div>
              Chi tiêu
            </div>
          </div>
        </div>
      </div>
    `;
  },

  renderTopCategories(breakdown) {
    if (!breakdown.length) return '';

    const items = breakdown.slice(0, 5).map((item, index) => {
      const bgColor = item.category.color + '15';
      const barColor = item.category.color;

      return `
        <div class="top-category-item">
          <div class="top-category-rank" ${index === 0 ? 'style="background: #FEF3C7; color: #B45309;"' : ''}>${index + 1}</div>
          <div class="top-category-icon" style="background: ${bgColor}">${item.category.icon}</div>
          <div class="top-category-info">
            <div class="top-category-name">${item.category.name}</div>
            <div class="top-category-bar">
              <div class="top-category-bar-fill" style="width: ${item.percentage}%; background: ${barColor};"></div>
            </div>
          </div>
          <div class="top-category-amount">
            <div class="top-category-amount-value">${Utils.formatCurrencyShort(item.amount)}</div>
            <div class="top-category-amount-percent">${item.percentage}%</div>
          </div>
        </div>
      `;
    }).join('');

    return `
      <div class="chart-container">
        <h3 class="chart-title">Top danh mục</h3>
        ${items}
      </div>
    `;
  },

  drawDonutChart(breakdown) {
    const canvas = Utils.$('#donutCanvas');
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    const dpr = window.devicePixelRatio || 1;
    const size = 200;
    canvas.width = size * dpr;
    canvas.height = size * dpr;
    ctx.scale(dpr, dpr);

    const centerX = size / 2;
    const centerY = size / 2;
    const outerRadius = 85;
    const innerRadius = 58;

    // Clear
    ctx.clearRect(0, 0, size, size);

    if (!breakdown.length) {
      // Draw empty circle
      ctx.beginPath();
      ctx.arc(centerX, centerY, outerRadius, 0, Math.PI * 2);
      ctx.arc(centerX, centerY, innerRadius, 0, Math.PI * 2, true);
      ctx.fillStyle = '#F3F4F6';
      ctx.fill();

      Utils.$('#donutCenterValue').textContent = '0đ';
      Utils.$('#donutLegend').innerHTML = '<p class="text-center text-muted text-sm">Chưa có dữ liệu</p>';
      return;
    }

    const total = breakdown.reduce((sum, item) => sum + item.amount, 0);

    // Animate drawing
    const animationDuration = 800;
    const startTime = performance.now();

    const animate = (currentTime) => {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / animationDuration, 1);
      const easedProgress = Utils.easeOutCubic(progress);
      const maxAngle = Math.PI * 2 * easedProgress;

      ctx.clearRect(0, 0, size, size);
      let currentAngle = -Math.PI / 2;

      breakdown.forEach((item, index) => {
        const sliceAngle = (item.amount / total) * Math.PI * 2;
        const drawAngle = Math.min(sliceAngle, maxAngle - (currentAngle + Math.PI / 2));

        if (drawAngle <= 0) return;

        const gap = breakdown.length > 1 ? 0.02 : 0;
        ctx.beginPath();
        ctx.arc(centerX, centerY, outerRadius, currentAngle + gap, currentAngle + drawAngle - gap);
        ctx.arc(centerX, centerY, innerRadius, currentAngle + drawAngle - gap, currentAngle + gap, true);
        ctx.closePath();
        ctx.fillStyle = item.category.color;
        ctx.fill();

        currentAngle += sliceAngle;
      });

      if (progress < 1) {
        requestAnimationFrame(animate);
      }
    };

    requestAnimationFrame(animate);

    // Update center value
    Utils.$('#donutCenterValue').textContent = Utils.formatCurrencyShort(total);

    // Update legend
    const legendHTML = breakdown.map(item => `
      <div class="legend-item">
        <div class="legend-color" style="background: ${item.category.color}"></div>
        <span class="legend-icon">${item.category.icon}</span>
        <div class="legend-info">
          <div class="legend-name">${item.category.name}</div>
        </div>
        <div class="legend-right">
          <div class="legend-amount">${Utils.formatCurrencyShort(item.amount)}</div>
          <div class="legend-percent">${item.percentage}%</div>
        </div>
      </div>
    `).join('');

    Utils.$('#donutLegend').innerHTML = legendHTML;
  },

  drawBarChart(trend) {
    const canvas = Utils.$('#barCanvas');
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    const dpr = window.devicePixelRatio || 1;
    const width = canvas.parentElement.offsetWidth;
    const height = 200;
    canvas.width = width * dpr;
    canvas.height = height * dpr;
    canvas.style.width = width + 'px';
    canvas.style.height = height + 'px';
    ctx.scale(dpr, dpr);

    if (!trend.length) return;

    const maxVal = Math.max(...trend.map(t => Math.max(t.income, t.expense)), 1);
    const padding = { top: 20, right: 16, bottom: 40, left: 16 };
    const chartWidth = width - padding.left - padding.right;
    const chartHeight = height - padding.top - padding.bottom;
    const groupWidth = chartWidth / trend.length;
    const barWidth = Math.min(groupWidth * 0.3, 20);
    const barGap = 4;

    // Clear
    ctx.clearRect(0, 0, width, height);

    // Draw grid lines
    const gridLines = 4;
    for (let i = 0; i <= gridLines; i++) {
      const y = padding.top + (chartHeight / gridLines) * i;
      ctx.beginPath();
      ctx.moveTo(padding.left, y);
      ctx.lineTo(width - padding.right, y);
      ctx.strokeStyle = '#F3F4F6';
      ctx.lineWidth = 1;
      ctx.stroke();
    }

    // Animate bars
    const animationDuration = 800;
    const startTime = performance.now();

    const animate = (currentTime) => {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / animationDuration, 1);
      const easedProgress = Utils.easeOutCubic(progress);

      // Clear bars area
      ctx.clearRect(0, 0, width, height);

      // Redraw grid
      for (let i = 0; i <= gridLines; i++) {
        const y = padding.top + (chartHeight / gridLines) * i;
        ctx.beginPath();
        ctx.moveTo(padding.left, y);
        ctx.lineTo(width - padding.right, y);
        ctx.strokeStyle = '#F3F4F6';
        ctx.lineWidth = 1;
        ctx.stroke();
      }

      trend.forEach((item, index) => {
        const groupX = padding.left + groupWidth * index + groupWidth / 2;

        // Income bar
        const incomeHeight = (item.income / maxVal) * chartHeight * easedProgress;
        const incomeX = groupX - barWidth - barGap / 2;
        const incomeY = padding.top + chartHeight - incomeHeight;

        const incomeGrad = ctx.createLinearGradient(0, incomeY, 0, incomeY + incomeHeight);
        incomeGrad.addColorStop(0, '#34D399');
        incomeGrad.addColorStop(1, '#10B981');

        this.roundedRect(ctx, incomeX, incomeY, barWidth, incomeHeight, 4);
        ctx.fillStyle = incomeGrad;
        ctx.fill();

        // Expense bar
        const expenseHeight = (item.expense / maxVal) * chartHeight * easedProgress;
        const expenseX = groupX + barGap / 2;
        const expenseY = padding.top + chartHeight - expenseHeight;

        const expenseGrad = ctx.createLinearGradient(0, expenseY, 0, expenseY + expenseHeight);
        expenseGrad.addColorStop(0, '#F87171');
        expenseGrad.addColorStop(1, '#EF4444');

        this.roundedRect(ctx, expenseX, expenseY, barWidth, expenseHeight, 4);
        ctx.fillStyle = expenseGrad;
        ctx.fill();

        // Month labels
        ctx.font = '500 11px Inter, sans-serif';
        ctx.fillStyle = '#9CA3AF';
        ctx.textAlign = 'center';
        ctx.fillText(Utils.getMonthNameShort(item.month), groupX, height - 12);
      });

      if (progress < 1) {
        requestAnimationFrame(animate);
      }
    };

    requestAnimationFrame(animate);
  },

  roundedRect(ctx, x, y, width, height, radius) {
    if (height <= 0) return;
    radius = Math.min(radius, height / 2, width / 2);
    ctx.beginPath();
    ctx.moveTo(x + radius, y);
    ctx.lineTo(x + width - radius, y);
    ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
    ctx.lineTo(x + width, y + height);
    ctx.lineTo(x, y + height);
    ctx.lineTo(x, y + radius);
    ctx.quadraticCurveTo(x, y, x + radius, y);
    ctx.closePath();
  },

  bindEvents(container) {
    // Chart type toggle
    Utils.$$('[data-chart-type]', container).forEach(btn => {
      btn.addEventListener('click', () => {
        this.currentType = btn.dataset.chartType;
        this.render();
      });
    });
  }
};

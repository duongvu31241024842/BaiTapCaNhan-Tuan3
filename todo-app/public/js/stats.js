let charts = [];
let chartLibrary;

async function getChart() {
  if (window.Chart) return window.Chart;
  if (!chartLibrary) {
    chartLibrary = new Promise((resolve, reject) => {
      const script = document.createElement('script');
      script.src = 'https://cdn.jsdelivr.net/npm/chart.js@4.4.7/dist/chart.umd.min.js';
      script.onload = () => resolve(window.Chart);
      script.onerror = () => reject(new Error('Không thể tải thư viện biểu đồ. Hãy kiểm tra kết nối mạng.'));
      document.head.append(script);
    });
  }
  return chartLibrary;
}

function animateNumber(element, target) {
  const from = Number(element.textContent) || 0;
  const duration = 480;
  const start = performance.now();
  const step = (now) => {
    const progress = Math.min((now - start) / duration, 1);
    element.textContent = String(Math.round(from + (target - from) * (1 - (1 - progress) ** 3)));
    if (progress < 1) requestAnimationFrame(step);
  };
  requestAnimationFrame(step);
}

function chartDefaults(dark) {
  const color = dark ? '#9a9bb0' : '#9698a9';
  return {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: { backgroundColor: dark ? '#262735' : '#27283a', padding: 11, cornerRadius: 9, titleFont: { family: 'Inter' }, bodyFont: { family: 'Inter' } }
    },
    scales: {
      x: { grid: { display: false }, border: { display: false }, ticks: { color, font: { family: 'Inter', size: 10 } } },
      y: { grid: { color: dark ? 'rgba(255,255,255,.07)' : '#eff0f5', drawTicks: false }, border: { display: false }, ticks: { color, font: { family: 'Inter', size: 10 }, padding: 8, precision: 0 }, beginAtZero: true }
    }
  };
}

export async function renderStats(stats) {
  const Chart = await getChart();
  charts.forEach((chart) => chart.destroy());
  charts = [];
  const dark = document.documentElement.dataset.theme === 'dark';
  const colors = { todo: '#A6A7B8', doing: '#8C7CF3', done: '#56C7A5', low: '#58C79D', medium: '#F2B84B', high: '#F27676' };
  document.querySelectorAll('[data-kpi]').forEach((element) => {
    const target = Number(stats[element.dataset.kpi] || 0);
    animateNumber(element, target);
  });

  const statuses = ['todo', 'doing', 'done'];
  const statusLabels = { todo: 'Chưa làm', doing: 'Đang làm', done: 'Hoàn thành' };
  const statusValues = statuses.map((key) => stats.byStatus.find((row) => row.status === key)?.count || 0);
  document.getElementById('chart-total').textContent = String(stats.total);
  document.getElementById('status-legend').innerHTML = statuses.map((key, index) => `
    <div class="legend-row"><span><i style="--legend-color:${colors[key]}"></i>${statusLabels[key]}</span><strong>${statusValues[index]}</strong></div>
  `).join('');

  const base = chartDefaults(dark);
  const make = (id, config) => {
    const instance = new Chart(document.getElementById(id), config);
    charts.push(instance);
  };
  make('status-chart', {
    type: 'doughnut',
    data: { labels: statuses.map((key) => statusLabels[key]), datasets: [{ data: statusValues, backgroundColor: statuses.map((key) => colors[key]), borderWidth: 0, hoverOffset: 5 }] },
    options: { responsive: true, maintainAspectRatio: false, cutout: '76%', plugins: { legend: { display: false }, tooltip: base.plugins.tooltip } }
  });
  make('priority-chart', {
    type: 'bar',
    data: { labels: ['Thấp', 'Trung bình', 'Cao'], datasets: [{ data: ['low', 'medium', 'high'].map((key) => stats.byPriority.find((row) => row.priority === key)?.count || 0), backgroundColor: [colors.low, colors.medium, colors.high], borderRadius: 6, maxBarThickness: 38 }] },
    options: { ...base, plugins: base.plugins, scales: { ...base.scales, y: { ...base.scales.y, suggestedMax: Math.max(4, ...stats.byPriority.map((row) => row.count)) + 2 } } }
  });

  const today = new Date();
  const dayLabels = [];
  const dayValues = [];
  for (let offset = 6; offset >= 0; offset -= 1) {
    const day = new Date(today.getFullYear(), today.getMonth(), today.getDate() - offset);
    const key = day.toLocaleDateString('sv-SE');
    const row = stats.last7DaysCompleted.find((entry) => entry.date === key);
    dayLabels.push(new Intl.DateTimeFormat('vi-VN', { weekday: 'short' }).format(day).replace('.', ''));
    dayValues.push(row?.count || 0);
  }
  make('week-chart', {
    type: 'line',
    data: { labels: dayLabels, datasets: [{ data: dayValues, borderColor: '#8b7cf6', backgroundColor: 'rgba(139,124,246,.13)', borderWidth: 2.5, fill: true, tension: .38, pointRadius: 3, pointBackgroundColor: '#8b7cf6', pointBorderColor: dark ? '#20212d' : '#fff', pointBorderWidth: 2 }] },
    options: { ...base, plugins: base.plugins, scales: { ...base.scales, y: { ...base.scales.y, suggestedMax: Math.max(3, ...dayValues) + 1 } } }
  });
  const categoryRows = stats.byCategory;
  make('category-chart', {
    type: 'bar',
    data: { labels: categoryRows.map((row) => row.category), datasets: [{ data: categoryRows.map((row) => row.count), backgroundColor: ['#8b7cf6', '#63b9df', '#f3bd58', '#ed8ca2', '#62c6a5'], borderRadius: 5, maxBarThickness: 19, barPercentage: .63 }] },
    options: { ...base, indexAxis: 'y', plugins: base.plugins, scales: { ...base.scales, x: { ...base.scales.x, grid: { color: dark ? 'rgba(255,255,255,.07)' : '#eff0f5' } }, y: { ...base.scales.y, grid: { display: false }, ticks: { ...base.scales.y.ticks, padding: 5 } } } }
  });
}

export function destroyStats() {
  charts.forEach((chart) => chart.destroy());
  charts = [];
}

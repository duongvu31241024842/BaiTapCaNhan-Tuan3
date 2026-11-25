const priorityLabels = { low: 'Thấp', medium: 'Trung bình', high: 'Cao' };
const statusLabels = { todo: 'Chưa làm', doing: 'Đang làm', done: 'Hoàn thành' };
const categoryClasses = { 'Công việc': 'work', 'Học tập': 'study', 'Cá nhân': 'personal', 'Sức khỏe': 'health', 'Mua sắm': 'shopping' };

export function escapeHtml(value = '') {
  return String(value).replace(/[&<>"']/g, (character) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
  })[character]);
}

export function formatDate(dateString) {
  if (!dateString) return '';
  const [year, month, day] = dateString.split('-').map(Number);
  return new Intl.DateTimeFormat('vi-VN', { day: 'numeric', month: 'short' }).format(new Date(year, month - 1, day));
}

export function taskCard(task, index) {
  const isOverdue = task.status !== 'done' && task.due_date && task.due_date < new Date().toLocaleDateString('sv-SE');
  const dueText = task.due_date ? `${formatDate(task.due_date)}${task.due_time ? ` · ${escapeHtml(task.due_time)}` : ''}` : 'Chưa đặt ngày';
  return `
    <article class="task-card ${task.status === 'done' ? 'is-done' : ''}" data-task-id="${task.id}" style="--item-index:${Math.min(index, 12)}">
      <button class="task-check ${task.status === 'done' ? 'checked' : ''}" type="button" aria-label="${task.status === 'done' ? 'Đánh dấu chưa hoàn thành' : 'Đánh dấu hoàn thành'}" aria-pressed="${task.status === 'done'}">
        <svg viewBox="0 0 20 20" aria-hidden="true"><path d="m4.5 10.2 3.6 3.6 7.5-7.5"/></svg>
      </button>
      <div class="task-main">
        <div class="task-title-row"><h3 class="task-title">${escapeHtml(task.title)}</h3>${isOverdue ? '<span class="overdue-badge">Quá hạn</span>' : ''}</div>
        ${task.description ? `<p class="task-description">${escapeHtml(task.description)}</p>` : ''}
        <div class="task-meta">
          <span class="due-meta ${isOverdue ? 'due-overdue' : ''}"><svg viewBox="0 0 18 18" aria-hidden="true"><rect x="2.7" y="4" width="12.6" height="11" rx="2"/><path d="M5.5 2.5v3M12.5 2.5v3M2.7 7h12.6"/></svg>${dueText}</span>
          <span class="category-tag cat-${categoryClasses[task.category] || 'personal'}"><i></i>${escapeHtml(task.category)}</span>
          <span class="status-tag status-${task.status}">${statusLabels[task.status]}</span>
        </div>
      </div>
      <span class="priority-chip priority-${task.priority}"><i></i>${priorityLabels[task.priority]}</span>
      <div class="task-actions">
        <button class="task-action edit-task" type="button" aria-label="Chỉnh sửa ${escapeHtml(task.title)}" title="Chỉnh sửa"><svg viewBox="0 0 20 20" aria-hidden="true"><path d="m12.8 4.2 3 3M4 16l3.6-.7L16 6.9a1.8 1.8 0 0 0-2.6-2.6L5 12.8 4 16Z"/></svg></button>
        <button class="task-action delete-task" type="button" aria-label="Xóa ${escapeHtml(task.title)}" title="Xóa"><svg viewBox="0 0 20 20" aria-hidden="true"><path d="M4.5 6h11M8 6V4h4v2m2.5 0-.6 10H6.1L5.5 6m3 3v4m3-4v4"/></svg></button>
      </div>
    </article>`;
}

export function renderSkeletons(container) {
  container.innerHTML = Array.from({ length: 4 }, () => `
    <div class="skeleton-card" aria-hidden="true"><span class="skeleton-check"></span><div class="skeleton-copy"><i></i><i></i><i></i></div></div>
  `).join('');
}

export function renderEmpty(container, searching = false) {
  container.innerHTML = `
    <div class="empty-state">
      <div class="empty-illustration" aria-hidden="true"><svg viewBox="0 0 176 142" fill="none"><path d="M35 116c0-22 18-40 40-40h26c22 0 40 18 40 40v9H35v-9Z" fill="#EEEAFE"/><rect x="48" y="18" width="80" height="93" rx="13" fill="white" stroke="#E8E5F8" stroke-width="2"/><path d="M64 42h46M64 58h46M64 74h24" stroke="#D8D4EC" stroke-width="5" stroke-linecap="round"/><circle cx="117" cy="98" r="20" fill="#8C7CF3"/><path d="m107 98 7 7 13-15" stroke="white" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/><path d="m39 35 4 7 8 1-6 5 1 8-7-4-7 4 2-8-6-5 8-1 3-7ZM139 48l3 5 6 1-5 4 1 6-5-3-5 3 1-6-4-4 6-1 2-5Z" fill="#F6C768"/></svg></div>
      <h3>${searching ? 'Chưa tìm thấy công việc' : 'Một khoảng trống thật dễ chịu!'}</h3>
      <p>${searching ? 'Thử từ khóa khác hoặc thay đổi bộ lọc nhé.' : 'Thêm một công việc nhỏ để bắt đầu ngày mới của bạn.'}</p>
      ${searching ? '' : '<button type="button" class="primary-button empty-add">＋&nbsp; Tạo công việc đầu tiên</button>'}
    </div>`;
}

export function showToast(message, action, duration = 3200) {
  const region = document.getElementById('toast-region');
  const toast = document.createElement('div');
  toast.className = 'toast';
  toast.innerHTML = `<span class="toast-check">✓</span><span class="toast-message">${escapeHtml(message)}</span>${action ? '<button class="toast-action" type="button">Hoàn tác</button>' : ''}<button class="toast-dismiss" type="button" aria-label="Đóng thông báo">×</button>`;
  region.append(toast);
  const timeout = window.setTimeout(() => dismiss(), duration);
  const dismiss = () => {
    window.clearTimeout(timeout);
    toast.classList.add('toast-leaving');
    window.setTimeout(() => toast.remove(), 220);
  };
  toast.querySelector('.toast-dismiss').addEventListener('click', dismiss);
  if (action) toast.querySelector('.toast-action').addEventListener('click', async () => {
    window.clearTimeout(timeout);
    await action();
    dismiss();
  });
}

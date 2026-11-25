import { api } from './api.js';
import { destroyStats, renderStats } from './stats.js';
import { renderEmpty, renderSkeletons, showToast, taskCard } from './ui.js';

const $ = (selector) => document.querySelector(selector);
const elements = {
  taskList: $('#task-list'),
  taskDialog: $('#task-dialog'),
  taskForm: $('#task-form'),
  confirmDialog: $('#confirm-dialog'),
  search: $('#search-input')
};
const state = {
  view: location.pathname === '/stats' ? 'stats' : new URLSearchParams(location.search).get('view') === 'all' ? 'all' : 'today',
  category: '',
  query: '',
  deletedTask: null,
  activeDeleteId: null,
  loadId: 0
};
const todayISO = () => new Date().toLocaleDateString('sv-SE');
const categories = ['Công việc', 'Học tập', 'Cá nhân', 'Sức khỏe', 'Mua sắm'];
let searchTimer;

function localDateOffset(offset) {
  const date = new Date();
  date.setDate(date.getDate() + offset);
  return date.toLocaleDateString('sv-SE');
}

function setTheme(theme) {
  document.documentElement.dataset.theme = theme;
  localStorage.setItem('viecnho-theme', theme);
  $('.theme-state').textContent = theme === 'dark' ? 'Tối' : 'Sáng';
  document.querySelector('meta[name="theme-color"]').content = theme === 'dark' ? '#171821' : '#f6f7fb';
  if (state.view === 'stats' && state.currentStats) renderStats(state.currentStats).catch(showError);
}

function setupTheme() {
  const stored = localStorage.getItem('viecnho-theme');
  setTheme(stored || (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'));
  $('#theme-toggle').addEventListener('click', () => setTheme(document.documentElement.dataset.theme === 'dark' ? 'light' : 'dark'));
  $('#mobile-theme').addEventListener('click', () => setTheme(document.documentElement.dataset.theme === 'dark' ? 'light' : 'dark'));
}

function showError(error) {
  console.error(error);
  showToast(error.message || 'Đã xảy ra lỗi. Vui lòng thử lại.');
}

function updateDateHeading() {
  const now = new Date();
  const hours = now.getHours();
  const greeting = hours < 11 ? 'Chào buổi sáng' : hours < 18 ? 'Chào buổi chiều' : 'Chào buổi tối';
  $('#page-title').innerHTML = `${greeting}, Thùy Dương <span class="wave">✦</span>`;
  $('#today-date').textContent = new Intl.DateTimeFormat('vi-VN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }).format(now).toLocaleUpperCase('vi-VN');
  $('#stats-date').textContent = new Intl.DateTimeFormat('vi-VN', { month: 'long', year: 'numeric' }).format(now);
}

function dateRange() {
  const range = $('#date-filter').value;
  if (range === 'today') return { from: todayISO(), to: todayISO() };
  if (range === '7days') return { from: todayISO(), to: localDateOffset(6) };
  if (range === 'month') {
    const now = new Date();
    return {
      from: new Date(now.getFullYear(), now.getMonth(), 1).toLocaleDateString('sv-SE'),
      to: new Date(now.getFullYear(), now.getMonth() + 1, 0).toLocaleDateString('sv-SE')
    };
  }
  return {};
}

function buildTaskParams() {
  const todayMode = state.view === 'today' && $('#date-filter').value === 'today' && !state.category;
  const params = {
    scope: todayMode ? 'today' : 'all',
    q: state.query,
    status: $('#status-filter').value,
    priority: $('#priority-filter').value,
    category: state.category || $('#category-filter').value,
    sort: $('#sort-filter').value
  };
  if (!todayMode) Object.assign(params, dateRange());
  return params;
}

function setProgress(tasks) {
  const todayTasks = tasks.filter((task) => task.due_date === todayISO());
  const completed = todayTasks.filter((task) => task.status === 'done').length;
  const percent = todayTasks.length ? Math.round((completed / todayTasks.length) * 100) : 0;
  $('#progress-completed').textContent = String(completed);
  $('#progress-total').textContent = String(todayTasks.length);
  $('#progress-percent').textContent = `${percent}%`;
  $('#progress-ring').style.setProperty('--progress', `${percent * 3.6}deg`);
  $('#progress-ring').setAttribute('aria-label', `Hoàn thành ${percent} phần trăm`);
  $('#progress-hint').textContent = percent === 100 && todayTasks.length
    ? 'Tuyệt vời! Bạn đã hoàn thành mọi việc hôm nay 🎉'
    : todayTasks.length ? 'Cứ từng bước một, bạn đang làm tốt lắm!' : 'Bắt đầu từ một việc nhỏ thôi ✨';
}

function updateNavCount(tasks) {
  const openCount = tasks.filter((task) => task.status !== 'done').length;
  $('#today-count').textContent = String(openCount).padStart(2, '0');
}

async function loadTasks() {
  const loadId = ++state.loadId;
  renderSkeletons(elements.taskList);
  try {
    const tasks = await api.tasks(buildTaskParams());
    if (loadId !== state.loadId) return;
    if (state.view === 'today') {
      const todayTasks = await api.tasks({ scope: 'today' });
      if (loadId !== state.loadId) return;
      setProgress(todayTasks);
      updateNavCount(todayTasks);
    } else {
      const todayTasks = await api.tasks({ scope: 'today' });
      if (loadId !== state.loadId) return;
      updateNavCount(todayTasks);
    }
    if (!tasks.length) {
      renderEmpty(elements.taskList, Boolean(state.query || $('#status-filter').value || $('#priority-filter').value || state.category || $('#category-filter').value));
    } else {
      elements.taskList.innerHTML = tasks.map(taskCard).join('');
    }
    $('#task-total').textContent = `${tasks.length} công việc`;
    $('#list-title').textContent = state.view === 'today' ? (state.category || 'Việc cần làm') : 'Tất cả công việc';
    $('#list-caption').textContent = state.view === 'today' ? 'Những ưu tiên của bạn trong ngày' : 'Mọi kế hoạch, được sắp xếp gọn gàng';
    $('#today-overview').hidden = state.view !== 'today';
    $('#page-subtitle').textContent = state.view === 'today'
      ? 'Cùng hoàn thành những điều quan trọng nhất nhé.'
      : 'Tất cả những điều bạn đang lên kế hoạch.';
  } catch (error) {
    if (loadId !== state.loadId) return;
    elements.taskList.innerHTML = '<div class="load-error">Không thể tải công việc. <button type="button" class="retry-load">Thử lại</button></div>';
    showError(error);
  } finally {
    if (loadId === state.loadId) state.loading = false;
  }
}

function setView(view, push = true) {
  state.view = view;
  state.category = '';
  $('#date-filter').value = view === 'today' ? 'today' : 'all';
  document.querySelectorAll('.nav-link').forEach((button) => {
    const selected = button.dataset.view === view;
    button.classList.toggle('active', selected);
    if (selected) button.setAttribute('aria-current', 'page');
    else button.removeAttribute('aria-current');
  });
  document.querySelectorAll('.category-link').forEach((button) => button.classList.remove('active'));
  const isStats = view === 'stats';
  $('#tasks-view').hidden = isStats;
  $('#stats-view').hidden = !isStats;
  $('#breadcrumb-current').textContent = isStats ? 'Thống kê' : view === 'today' ? 'Hôm nay' : 'Tất cả công việc';
  if (push) history.pushState({ view }, '', isStats ? '/stats' : view === 'all' ? '/?view=all' : '/');
  destroyStats();
  if (isStats) loadStats();
  else loadTasks();
}

async function loadStats() {
  try {
    state.currentStats = await api.stats();
    await renderStats(state.currentStats);
  } catch (error) {
    showError(error);
  }
}

function openTaskDialog(task) {
  elements.taskForm.reset();
  $('#form-error').textContent = '';
  $('#task-id').value = task?.id || '';
  $('#dialog-title').textContent = task ? 'Chỉnh sửa công việc' : 'Tạo công việc mới';
  $('#save-task').innerHTML = task ? 'Lưu thay đổi <span aria-hidden="true">→</span>' : 'Lưu công việc <span aria-hidden="true">→</span>';
  $('#task-title').value = task?.title || '';
  $('#task-description').value = task?.description || '';
  $('#task-date').value = task?.due_date || '';
  $('#task-time').value = task?.due_time || '';
  $('#task-priority').value = task?.priority || 'medium';
  $('#task-category').value = task?.category || (categories.includes(state.category) ? state.category : 'Cá nhân');
  $('#task-status').value = task?.status || 'todo';
  elements.taskDialog.showModal();
  window.setTimeout(() => $('#task-title').focus(), 50);
}

async function getTaskFromCard(card) {
  return api.task(card.dataset.taskId);
}

function addConfetti(button) {
  const card = button.closest('.task-card');
  const bounds = button.getBoundingClientRect();
  for (let index = 0; index < 6; index += 1) {
    const piece = document.createElement('span');
    piece.className = `confetti confetti-${index % 3}`;
    piece.style.left = `${bounds.left + bounds.width / 2}px`;
    piece.style.top = `${bounds.top + bounds.height / 2}px`;
    piece.style.setProperty('--x', `${(index - 2.5) * 13}px`);
    piece.style.setProperty('--y', `${-16 - (index % 3) * 8}px`);
    document.body.append(piece);
    window.setTimeout(() => piece.remove(), 750);
  }
  card?.classList.add('just-completed');
  window.setTimeout(() => card?.classList.remove('just-completed'), 600);
}

async function handleTaskListClick(event) {
  const card = event.target.closest('.task-card');
  if (!card) {
    if (event.target.closest('.empty-add')) openTaskDialog();
    if (event.target.closest('.retry-load')) loadTasks();
    return;
  }
  const id = Number(card.dataset.taskId);
  try {
    if (event.target.closest('.task-check')) {
      const checkbox = event.target.closest('.task-check');
      const completing = !checkbox.classList.contains('checked');
      const updated = await api.toggleTask(id);
      if (completing) addConfetti(checkbox);
      showToast(updated.status === 'done' ? 'Đã hoàn thành công việc!' : 'Đã chuyển về chưa làm.');
      await refreshCurrentView();
    } else if (event.target.closest('.edit-task')) {
      openTaskDialog(await getTaskFromCard(card));
    } else if (event.target.closest('.delete-task')) {
      state.activeDeleteId = id;
      elements.confirmDialog.showModal();
    }
  } catch (error) {
    showError(error);
  }
}

async function refreshCurrentView() {
  if (state.view === 'stats') await loadStats();
  else await loadTasks();
}

async function saveTask(event) {
  event.preventDefault();
  const task = {
    title: $('#task-title').value.trim(),
    description: $('#task-description').value.trim(),
    due_date: $('#task-date').value || null,
    due_time: $('#task-time').value || null,
    priority: $('#task-priority').value,
    category: $('#task-category').value,
    status: $('#task-status').value
  };
  if (!task.title) {
    $('#form-error').textContent = 'Hãy nhập tên công việc trước khi lưu.';
    $('#task-title').focus();
    return;
  }
  const id = $('#task-id').value;
  $('#save-task').disabled = true;
  try {
    if (id) await api.updateTask(id, task);
    else await api.createTask(task);
    elements.taskDialog.close();
    showToast(id ? 'Đã cập nhật công việc.' : 'Đã thêm công việc mới.');
    await refreshCurrentView();
  } catch (error) {
    $('#form-error').textContent = error.message;
  } finally {
    $('#save-task').disabled = false;
  }
}

async function confirmDelete() {
  const id = state.activeDeleteId;
  if (!id) return;
  try {
    state.deletedTask = await api.tasks({ scope: 'all' }).then((tasks) => tasks.find((task) => task.id === id));
    await api.deleteTask(id);
    elements.confirmDialog.close();
    await refreshCurrentView();
    showToast('Đã xóa công việc.', async () => {
      try {
        if (state.deletedTask) {
          await api.restoreTask(state.deletedTask);
          state.deletedTask = null;
          await refreshCurrentView();
          showToast('Đã khôi phục công việc.');
        }
      } catch (error) {
        showError(error);
      }
    }, 5000);
  } catch (error) {
    showError(error);
  } finally {
    state.activeDeleteId = null;
  }
}

function setupEvents() {
  document.querySelectorAll('.nav-link').forEach((button) => button.addEventListener('click', () => setView(button.dataset.view)));
  document.querySelectorAll('.category-link').forEach((button) => button.addEventListener('click', () => {
    state.category = button.dataset.category;
    $('#date-filter').value = 'all';
    $('#category-filter').value = '';
    document.querySelectorAll('.nav-link').forEach((nav) => {
      const active = nav.dataset.view === 'all';
      nav.classList.toggle('active', active);
      if (active) nav.setAttribute('aria-current', 'page');
      else nav.removeAttribute('aria-current');
    });
    document.querySelectorAll('.category-link').forEach((item) => item.classList.toggle('active', item === button));
    state.view = 'all';
    $('#tasks-view').hidden = false;
    $('#stats-view').hidden = true;
    $('#today-overview').hidden = true;
    $('#breadcrumb-current').textContent = state.category;
    history.pushState({ view: 'all', category: state.category }, '', '/?view=all');
    loadTasks();
  }));
  ['status-filter', 'priority-filter', 'category-filter', 'date-filter', 'sort-filter'].forEach((id) => {
    $(`#${id}`).addEventListener('change', () => {
      if (id === 'category-filter') state.category = '';
      loadTasks();
    });
  });
  elements.search.addEventListener('input', () => {
    window.clearTimeout(searchTimer);
    searchTimer = window.setTimeout(() => {
      state.query = elements.search.value.trim();
      if (state.view === 'stats') setView('all');
      else loadTasks();
    }, 250);
  });
  $('#add-task-button').addEventListener('click', () => openTaskDialog());
  elements.taskList.addEventListener('click', handleTaskListClick);
  elements.taskForm.addEventListener('submit', saveTask);
  $('#dialog-close').addEventListener('click', () => elements.taskDialog.close());
  $('#cancel-task').addEventListener('click', () => elements.taskDialog.close());
  $('#cancel-delete').addEventListener('click', () => elements.confirmDialog.close());
  $('#confirm-delete').addEventListener('click', confirmDelete);
  elements.taskDialog.addEventListener('click', (event) => {
    if (event.target === elements.taskDialog) elements.taskDialog.close();
  });
  $('#category-filter').addEventListener('change', () => {
    const selected = $('#category-filter').value;
    if (selected && state.view === 'today') setView('all');
    else {
      state.category = '';
      loadTasks();
    }
  });
  window.addEventListener('popstate', (event) => {
    const view = location.pathname === '/stats' ? 'stats' : event.state?.view || new URLSearchParams(location.search).get('view') || 'today';
    setView(view, false);
  });
  window.addEventListener('keydown', (event) => {
    const target = event.target;
    const typing = target instanceof HTMLElement && (target.isContentEditable || ['INPUT', 'TEXTAREA', 'SELECT'].includes(target.tagName));
    if (event.key === '/' && !typing) {
      event.preventDefault();
      elements.search.focus();
    }
    if ((event.key === 'n' || event.key === 'N') && !typing && !elements.taskDialog.open && !elements.confirmDialog.open) {
      event.preventDefault();
      openTaskDialog();
    }
  });
}

setupTheme();
updateDateHeading();
setupEvents();
setView(state.view, false);

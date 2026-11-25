const express = require('express');
const db = require('../db');

const router = express.Router();
const priorities = new Set(['low', 'medium', 'high']);
const statuses = new Set(['todo', 'doing', 'done']);
const allowedCategories = new Set(['Công việc', 'Học tập', 'Cá nhân', 'Sức khỏe', 'Mua sắm']);
const fields = ['title', 'description', 'due_date', 'due_time', 'priority', 'category', 'status'];

function isValidDate(value) {
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const date = new Date(`${value}T00:00:00Z`);
  return !Number.isNaN(date.getTime()) && date.toISOString().slice(0, 10) === value;
}

function validateTask(input, partial = false) {
  if (!input || typeof input !== 'object' || Array.isArray(input)) return 'Dữ liệu công việc không hợp lệ.';
  if (!partial || Object.prototype.hasOwnProperty.call(input, 'title')) {
    if (typeof input.title !== 'string' || !input.title.trim() || input.title.trim().length > 160) {
      return 'Tiêu đề là bắt buộc và không được vượt quá 160 ký tự.';
    }
  }
  if (input.description !== undefined && (typeof input.description !== 'string' || input.description.length > 2000)) {
    return 'Mô tả phải là văn bản không quá 2000 ký tự.';
  }
  if (input.due_date !== undefined && input.due_date !== null && input.due_date !== '' && !isValidDate(input.due_date)) {
    return 'Ngày đến hạn không hợp lệ (định dạng YYYY-MM-DD).';
  }
  if (input.due_time !== undefined && input.due_time !== null && input.due_time !== '' && !/^([01]\d|2[0-3]):[0-5]\d$/.test(input.due_time)) {
    return 'Giờ đến hạn không hợp lệ (định dạng HH:mm).';
  }
  if (input.priority !== undefined && !priorities.has(input.priority)) return 'Mức ưu tiên không hợp lệ.';
  if (input.status !== undefined && !statuses.has(input.status)) return 'Trạng thái không hợp lệ.';
  if (input.category !== undefined && (typeof input.category !== 'string' || !allowedCategories.has(input.category))) {
    return 'Danh mục không hợp lệ.';
  }
  const unknown = Object.keys(input).find((key) => !fields.includes(key));
  if (unknown) return `Trường dữ liệu không được hỗ trợ: ${unknown}.`;
  return null;
}

router.get('/', (req, res) => {
  const { scope, q, status, priority, category, from, to, sort } = req.query;
  const clauses = [];
  const values = {};
  const today = new Date().toISOString().slice(0, 10);

  if (scope !== undefined && !['today', 'all'].includes(scope)) return res.status(400).json({ error: 'Phạm vi truy vấn không hợp lệ.' });
  if (scope === 'today') {
    clauses.push("(due_date = @today OR (due_date < @today AND status != 'done'))");
    values.today = today;
  }
  if (q !== undefined) {
    if (typeof q !== 'string' || q.length > 200) return res.status(400).json({ error: 'Từ khóa tìm kiếm không hợp lệ.' });
    clauses.push("(title LIKE @query ESCAPE '\\' OR description LIKE @query ESCAPE '\\')");
    values.query = `%${q.replace(/[\\%_]/g, '\\$&')}%`;
  }
  if (status !== undefined) {
    if (!statuses.has(status)) return res.status(400).json({ error: 'Trạng thái không hợp lệ.' });
    clauses.push('status = @status');
    values.status = status;
  }
  if (priority !== undefined) {
    if (!priorities.has(priority)) return res.status(400).json({ error: 'Mức ưu tiên không hợp lệ.' });
    clauses.push('priority = @priority');
    values.priority = priority;
  }
  if (category !== undefined) {
    if (!allowedCategories.has(category)) return res.status(400).json({ error: 'Danh mục không hợp lệ.' });
    clauses.push('category = @category');
    values.category = category;
  }
  if (from !== undefined) {
    if (!isValidDate(from)) return res.status(400).json({ error: 'Ngày bắt đầu không hợp lệ.' });
    clauses.push('due_date >= @from');
    values.from = from;
  }
  if (to !== undefined) {
    if (!isValidDate(to)) return res.status(400).json({ error: 'Ngày kết thúc không hợp lệ.' });
    clauses.push('due_date <= @to');
    values.to = to;
  }

  const orderBy = {
    due_date: 'due_date IS NULL, due_date ASC, due_time IS NULL, due_time ASC, created_at DESC',
    priority: "CASE priority WHEN 'high' THEN 0 WHEN 'medium' THEN 1 ELSE 2 END, due_date ASC",
    created_at: 'created_at DESC'
  };
  if (sort !== undefined && !Object.prototype.hasOwnProperty.call(orderBy, sort)) return res.status(400).json({ error: 'Cách sắp xếp không hợp lệ.' });

  const where = clauses.length ? `WHERE ${clauses.join(' AND ')}` : '';
  res.json(db.prepare(`SELECT * FROM tasks ${where} ORDER BY ${orderBy[sort || 'due_date']}`).all(values));
});

router.get('/:id', (req, res) => {
  const task = db.prepare('SELECT * FROM tasks WHERE id = ?').get(req.params.id);
  if (!task) return res.status(404).json({ error: 'Không tìm thấy công việc.' });
  res.json(task);
});

router.post('/', (req, res) => {
  const error = validateTask(req.body);
  if (error) return res.status(400).json({ error });
  const now = new Date().toISOString();
  const input = req.body;
  const status = input.status || 'todo';
  const result = db.prepare(`
    INSERT INTO tasks (title, description, due_date, due_time, priority, category, status, completed_at, updated_at)
    VALUES (@title, @description, @due_date, @due_time, @priority, @category, @status, @completed_at, @updated_at)
  `).run({
    title: input.title.trim(),
    description: input.description || '',
    due_date: input.due_date || null,
    due_time: input.due_time || null,
    priority: input.priority || 'medium',
    category: input.category || 'Cá nhân',
    status,
    completed_at: status === 'done' ? now : null,
    updated_at: now
  });
  res.status(201).json(db.prepare('SELECT * FROM tasks WHERE id = ?').get(result.lastInsertRowid));
});

router.put('/:id', (req, res) => {
  const error = validateTask(req.body);
  if (error) return res.status(400).json({ error });
  const existing = db.prepare('SELECT * FROM tasks WHERE id = ?').get(req.params.id);
  if (!existing) return res.status(404).json({ error: 'Không tìm thấy công việc.' });
  const status = req.body.status || 'todo';
  const completedAt = status === 'done'
    ? (existing.status === 'done' ? existing.completed_at : new Date().toISOString())
    : null;
  db.prepare(`
    UPDATE tasks SET title = @title, description = @description, due_date = @due_date,
      due_time = @due_time, priority = @priority, category = @category, status = @status,
      completed_at = @completed_at, updated_at = @updated_at
    WHERE id = @id
  `).run({
    id: existing.id,
    title: req.body.title.trim(),
    description: req.body.description || '',
    due_date: req.body.due_date || null,
    due_time: req.body.due_time || null,
    priority: req.body.priority || 'medium',
    category: req.body.category || 'Cá nhân',
    status,
    completed_at: completedAt,
    updated_at: new Date().toISOString()
  });
  res.json(db.prepare('SELECT * FROM tasks WHERE id = ?').get(existing.id));
});

router.patch('/:id/toggle', (req, res) => {
  const task = db.prepare('SELECT * FROM tasks WHERE id = ?').get(req.params.id);
  if (!task) return res.status(404).json({ error: 'Không tìm thấy công việc.' });
  const isDone = task.status !== 'done';
  db.prepare('UPDATE tasks SET status = @status, completed_at = @completed_at, updated_at = @updated_at WHERE id = @id')
    .run({
      id: task.id,
      status: isDone ? 'done' : 'todo',
      completed_at: isDone ? new Date().toISOString() : null,
      updated_at: new Date().toISOString()
    });
  res.json(db.prepare('SELECT * FROM tasks WHERE id = ?').get(task.id));
});

router.delete('/:id', (req, res) => {
  const result = db.prepare('DELETE FROM tasks WHERE id = ?').run(req.params.id);
  if (!result.changes) return res.status(404).json({ error: 'Không tìm thấy công việc.' });
  res.status(204).end();
});

module.exports = router;

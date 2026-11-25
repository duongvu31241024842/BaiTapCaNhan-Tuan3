const express = require('express');
const db = require('../db');

const router = express.Router();

router.get('/', (req, res) => {
  const today = new Date().toISOString().slice(0, 10);
  const totals = db.prepare(`
    SELECT COUNT(*) AS total,
      SUM(CASE WHEN status = 'done' THEN 1 ELSE 0 END) AS completed,
      SUM(CASE WHEN status = 'doing' THEN 1 ELSE 0 END) AS inProgress
    FROM tasks
  `).get();
  const overdueCount = db.prepare("SELECT COUNT(*) AS count FROM tasks WHERE due_date < ? AND status != 'done'").get(today).count;
  const byStatus = db.prepare(`
    SELECT status, COUNT(*) AS count FROM tasks GROUP BY status
  `).all();
  const byPriority = db.prepare(`
    SELECT priority, COUNT(*) AS count FROM tasks GROUP BY priority
  `).all();
  const byCategory = db.prepare(`
    SELECT category, COUNT(*) AS count FROM tasks GROUP BY category ORDER BY count DESC, category ASC
  `).all();
  const last7DaysCompleted = db.prepare(`
    SELECT date(completed_at) AS date, COUNT(*) AS count
    FROM tasks
    WHERE completed_at >= datetime('now', '-6 days', 'start of day')
    GROUP BY date(completed_at)
  `).all();
  res.json({
    total: totals.total || 0,
    completed: totals.completed || 0,
    inProgress: totals.inProgress || 0,
    overdueCount,
    completionRate: totals.total ? Math.round((totals.completed / totals.total) * 100) : 0,
    byStatus,
    byPriority,
    byCategory,
    last7DaysCompleted
  });
});

module.exports = router;

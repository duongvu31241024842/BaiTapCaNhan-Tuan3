const path = require('node:path');
const express = require('express');
const db = require('./src/db');
const { seedDatabase } = require('./src/seed');

if (db.prepare('SELECT COUNT(*) AS count FROM tasks').get().count === 0) {
  seedDatabase();
}

const app = express();
const port = Number(process.env.PORT) || 3000;

app.disable('x-powered-by');
app.use(express.json({ limit: '32kb' }));
app.use('/api/tasks', require('./src/routes/tasks'));
app.use('/api/stats', require('./src/routes/stats'));
app.use(express.static(path.join(__dirname, 'public')));
app.get('*', (req, res, next) => {
  if (req.path.startsWith('/api/')) return next();
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});
app.use((req, res) => res.status(404).json({ error: 'Không tìm thấy tài nguyên.' }));
app.use((error, req, res, next) => {
  console.error(error);
  if (res.headersSent) return next(error);
  const status = error.status || 500;
  res.status(status).json({ error: status === 400 ? 'Yêu cầu không hợp lệ.' : 'Đã xảy ra lỗi máy chủ.' });
});

const server = app.listen(port, () => {
  console.log(`Việc Nhỏ đang chạy tại http://localhost:${port}`);
});

function shutdown() {
  server.close(() => {
    db.close();
    process.exit(0);
  });
}
process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);

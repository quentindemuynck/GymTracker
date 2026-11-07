import express from 'express';
import { db } from '../db.js';
import { requireAuth } from '../auth.js';

const router = express.Router();
router.use(requireAuth);

// GET /api/sessions?userId=&from=&to= - view anyone's logged gym days
router.get('/', (req, res) => {
  const { userId, from, to } = req.query;
  let sql = `SELECT s.*, u.display_name, u.color, d.name AS day_name, d.emoji AS day_emoji
             FROM sessions s JOIN users u ON u.id = s.user_id LEFT JOIN days d ON d.id = s.day_id
             WHERE 1=1`;
  const params = [];
  if (userId) {
    sql += ' AND s.user_id = ?';
    params.push(userId);
  }
  if (from) {
    sql += ' AND s.date >= ?';
    params.push(from);
  }
  if (to) {
    sql += ' AND s.date <= ?';
    params.push(to);
  }
  sql += ' ORDER BY s.date DESC, s.id DESC';
  res.json(db.prepare(sql).all(...params));
});

router.post('/', (req, res) => {
  const { dayId, date, note } = req.body || {};
  if (dayId) {
    const day = db.prepare('SELECT * FROM days WHERE id = ?').get(dayId);
    if (!day || day.user_id !== req.user.id) {
      return res.status(403).json({ error: 'You can only log sessions for your own days' });
    }
  }
  const info = db
    .prepare(`INSERT INTO sessions (user_id, day_id, date, note) VALUES (?, ?, COALESCE(?, date('now')), ?)`)
    .run(req.user.id, dayId || null, date || null, note || null);
  res.status(201).json(db.prepare('SELECT * FROM sessions WHERE id = ?').get(info.lastInsertRowid));
});

router.put('/:id', (req, res) => {
  const session = db.prepare('SELECT * FROM sessions WHERE id = ?').get(req.params.id);
  if (!session) return res.status(404).json({ error: 'Session not found' });
  if (session.user_id !== req.user.id) return res.status(403).json({ error: 'You can only edit your own sessions' });
  const { dayId, date, note } = req.body || {};
  db.prepare('UPDATE sessions SET day_id = ?, date = ?, note = ? WHERE id = ?').run(
    dayId ?? session.day_id,
    date ?? session.date,
    note ?? session.note,
    session.id
  );
  res.json(db.prepare('SELECT * FROM sessions WHERE id = ?').get(session.id));
});

router.delete('/:id', (req, res) => {
  const session = db.prepare('SELECT * FROM sessions WHERE id = ?').get(req.params.id);
  if (!session) return res.status(404).json({ error: 'Session not found' });
  if (session.user_id !== req.user.id) return res.status(403).json({ error: 'You can only delete your own sessions' });
  db.prepare('DELETE FROM sessions WHERE id = ?').run(session.id);
  res.status(204).end();
});

// GET /api/sessions/streak/:userId - current consecutive-day-of-training streak + weekly count
router.get('/stats/:userId', (req, res) => {
  const rows = db
    .prepare('SELECT DISTINCT date FROM sessions WHERE user_id = ? ORDER BY date DESC')
    .all(req.params.userId)
    .map((r) => r.date);

  const today = new Date();
  const toISODate = (d) => d.toISOString().slice(0, 10);
  const dateSet = new Set(rows);

  let streak = 0;
  let cursor = new Date(today);
  // allow today to be "not yet trained" without breaking the streak
  if (!dateSet.has(toISODate(cursor))) cursor.setDate(cursor.getDate() - 1);
  while (dateSet.has(toISODate(cursor))) {
    streak += 1;
    cursor.setDate(cursor.getDate() - 1);
  }

  const weekAgo = new Date(today);
  weekAgo.setDate(weekAgo.getDate() - 6);
  const thisWeek = rows.filter((d) => d >= toISODate(weekAgo)).length;

  res.json({ streak, totalSessions: rows.length, thisWeek });
});

export default router;

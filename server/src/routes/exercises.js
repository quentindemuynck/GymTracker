import express from 'express';
import { db } from '../db.js';
import { requireAuth } from '../auth.js';

const router = express.Router();
router.use(requireAuth);

function findExercise(id) {
  return db.prepare('SELECT * FROM exercises WHERE id = ?').get(id);
}

router.get('/:id', (req, res) => {
  const ex = findExercise(req.params.id);
  if (!ex) return res.status(404).json({ error: 'Exercise not found' });
  res.json(ex);
});

// Shared template fields - either gym buddy can tune the plan itself.
router.put('/:id', (req, res) => {
  const ex = findExercise(req.params.id);
  if (!ex) return res.status(404).json({ error: 'Exercise not found' });
  const { name, target_sets, target_reps, default_weight, weight_unit, cue, video_url, exercise_order } =
    req.body || {};
  db.prepare(
    `UPDATE exercises SET name = ?, target_sets = ?, target_reps = ?, default_weight = ?, weight_unit = ?, cue = ?, video_url = ?, exercise_order = ?
     WHERE id = ?`
  ).run(
    name ?? ex.name,
    target_sets ?? ex.target_sets,
    target_reps ?? ex.target_reps,
    default_weight ?? ex.default_weight,
    weight_unit ?? ex.weight_unit,
    cue ?? ex.cue,
    video_url ?? ex.video_url,
    exercise_order ?? ex.exercise_order,
    ex.id
  );
  res.json(findExercise(ex.id));
});

router.delete('/:id', (req, res) => {
  const result = db.prepare('DELETE FROM exercises WHERE id = ?').run(req.params.id);
  if (result.changes === 0) return res.status(404).json({ error: 'Exercise not found' });
  res.status(204).end();
});

// --- Personal form-cue notes (per user, only owner may write) ---

router.get('/:id/notes', (req, res) => {
  const notes = db
    .prepare(
      `SELECT en.id, en.note, en.updated_at, u.id AS user_id, u.display_name, u.color
       FROM exercise_notes en JOIN users u ON u.id = en.user_id
       WHERE en.exercise_id = ? ORDER BY en.updated_at DESC`
    )
    .all(req.params.id);
  res.json(notes);
});

router.put('/:id/notes/me', (req, res) => {
  const { note } = req.body || {};
  const ex = findExercise(req.params.id);
  if (!ex) return res.status(404).json({ error: 'Exercise not found' });
  db.prepare(
    `INSERT INTO exercise_notes (exercise_id, user_id, note, updated_at)
     VALUES (?, ?, ?, datetime('now'))
     ON CONFLICT(exercise_id, user_id) DO UPDATE SET note = excluded.note, updated_at = datetime('now')`
  ).run(ex.id, req.user.id, note || '');
  const mine = db
    .prepare('SELECT * FROM exercise_notes WHERE exercise_id = ? AND user_id = ?')
    .get(ex.id, req.user.id);
  res.json(mine);
});

// --- Weight/reps logs (per user, only owner may write their own) ---

router.get('/:id/logs', (req, res) => {
  const { userId, limit } = req.query;
  let sql = `SELECT el.*, u.display_name, u.color FROM exercise_logs el JOIN users u ON u.id = el.user_id
             WHERE el.exercise_id = ?`;
  const params = [req.params.id];
  if (userId) {
    sql += ' AND el.user_id = ?';
    params.push(userId);
  }
  sql += ' ORDER BY el.date DESC, el.id DESC';
  if (limit) {
    sql += ' LIMIT ?';
    params.push(Number(limit));
  }
  res.json(db.prepare(sql).all(...params));
});

router.post('/:id/logs', (req, res) => {
  const ex = findExercise(req.params.id);
  if (!ex) return res.status(404).json({ error: 'Exercise not found' });
  const { weight, weight_unit, sets, reps, note, date } = req.body || {};
  const info = db
    .prepare(
      `INSERT INTO exercise_logs (exercise_id, user_id, date, weight, weight_unit, sets, reps, note)
       VALUES (?, ?, COALESCE(?, date('now')), ?, ?, ?, ?, ?)`
    )
    .run(
      ex.id,
      req.user.id,
      date || null,
      weight ?? null,
      weight_unit || ex.weight_unit || 'kg',
      sets ?? null,
      reps ?? null,
      note || null
    );
  res.status(201).json(db.prepare('SELECT * FROM exercise_logs WHERE id = ?').get(info.lastInsertRowid));
});

router.put('/logs/:logId', (req, res) => {
  const log = db.prepare('SELECT * FROM exercise_logs WHERE id = ?').get(req.params.logId);
  if (!log) return res.status(404).json({ error: 'Log not found' });
  if (log.user_id !== req.user.id) return res.status(403).json({ error: "You can only edit your own logs" });
  const { weight, weight_unit, sets, reps, note, date } = req.body || {};
  db.prepare(
    `UPDATE exercise_logs SET weight = ?, weight_unit = ?, sets = ?, reps = ?, note = ?, date = ? WHERE id = ?`
  ).run(
    weight ?? log.weight,
    weight_unit ?? log.weight_unit,
    sets ?? log.sets,
    reps ?? log.reps,
    note ?? log.note,
    date ?? log.date,
    log.id
  );
  res.json(db.prepare('SELECT * FROM exercise_logs WHERE id = ?').get(log.id));
});

router.delete('/logs/:logId', (req, res) => {
  const log = db.prepare('SELECT * FROM exercise_logs WHERE id = ?').get(req.params.logId);
  if (!log) return res.status(404).json({ error: 'Log not found' });
  if (log.user_id !== req.user.id) return res.status(403).json({ error: 'You can only delete your own logs' });
  db.prepare('DELETE FROM exercise_logs WHERE id = ?').run(log.id);
  res.status(204).end();
});

export default router;

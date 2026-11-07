import express from 'express';
import { db } from '../db.js';
import { requireAuth } from '../auth.js';

const router = express.Router();
router.use(requireAuth);

function findExercise(id) {
  return db.prepare('SELECT * FROM exercises WHERE id = ?').get(id);
}

function findOwningDay(exercise) {
  return db.prepare('SELECT * FROM days WHERE id = ?').get(exercise.day_id);
}

router.get('/:id', (req, res) => {
  const ex = findExercise(req.params.id);
  if (!ex) return res.status(404).json({ error: 'Exercise not found' });
  res.json(ex);
});

router.put('/:id', (req, res) => {
  const ex = findExercise(req.params.id);
  if (!ex) return res.status(404).json({ error: 'Exercise not found' });
  const day = findOwningDay(ex);
  if (!day || day.user_id !== req.user.id) {
    return res.status(403).json({ error: 'You can only edit exercises in your own days' });
  }
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
  const ex = findExercise(req.params.id);
  if (!ex) return res.status(404).json({ error: 'Exercise not found' });
  const day = findOwningDay(ex);
  if (!day || day.user_id !== req.user.id) {
    return res.status(403).json({ error: 'You can only delete exercises in your own days' });
  }
  db.prepare('DELETE FROM exercises WHERE id = ?').run(ex.id);
  res.status(204).end();
});

// POST /api/exercises/:id/copy { targetDayId } - copy any exercise (template, a friend's,
// or your own) into one of YOUR OWN days.
router.post('/:id/copy', (req, res) => {
  const source = findExercise(req.params.id);
  if (!source) return res.status(404).json({ error: 'Exercise not found' });

  const { targetDayId } = req.body || {};
  if (!targetDayId) return res.status(400).json({ error: 'targetDayId is required' });
  const targetDay = db.prepare('SELECT * FROM days WHERE id = ?').get(targetDayId);
  if (!targetDay) return res.status(404).json({ error: 'Target day not found' });
  if (targetDay.user_id !== req.user.id) {
    return res.status(403).json({ error: 'You can only copy exercises into your own days' });
  }

  const maxOrder = db
    .prepare('SELECT COALESCE(MAX(exercise_order), -1) AS m FROM exercises WHERE day_id = ?')
    .get(targetDay.id).m;
  const info = db
    .prepare(
      `INSERT INTO exercises (day_id, name, target_sets, target_reps, default_weight, weight_unit, cue, exercise_order, video_url)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`
    )
    .run(
      targetDay.id,
      source.name,
      source.target_sets,
      source.target_reps,
      source.default_weight,
      source.weight_unit,
      source.cue,
      maxOrder + 1,
      source.video_url
    );
  res.status(201).json(db.prepare('SELECT * FROM exercises WHERE id = ?').get(info.lastInsertRowid));
});

// --- Weight/reps logs (only the owner of the exercise may log against it) ---

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
  const day = findOwningDay(ex);
  if (!day || day.user_id !== req.user.id) {
    return res.status(403).json({ error: 'You can only log exercises in your own days — copy it to your split first' });
  }
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

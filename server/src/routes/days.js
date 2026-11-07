import express from 'express';
import { db } from '../db.js';
import { requireAuth } from '../auth.js';

const router = express.Router();
router.use(requireAuth);

function getFullDay(dayId) {
  const day = db.prepare('SELECT * FROM days WHERE id = ?').get(dayId);
  if (!day) return null;
  const exercises = db
    .prepare('SELECT * FROM exercises WHERE day_id = ? ORDER BY exercise_order, id')
    .all(dayId);
  return { ...day, exercises };
}

// GET /api/days - all days with their exercises
router.get('/', (req, res) => {
  const days = db.prepare('SELECT * FROM days ORDER BY day_order, id').all();
  const withExercises = days.map((d) => ({
    ...d,
    exercises: db.prepare('SELECT * FROM exercises WHERE day_id = ? ORDER BY exercise_order, id').all(d.id),
  }));
  res.json(withExercises);
});

router.get('/:id', (req, res) => {
  const day = getFullDay(req.params.id);
  if (!day) return res.status(404).json({ error: 'Day not found' });
  res.json(day);
});

router.post('/', (req, res) => {
  const { name, subtitle, emoji, weekday } = req.body || {};
  if (!name) return res.status(400).json({ error: 'name is required' });
  const maxOrder = db.prepare('SELECT COALESCE(MAX(day_order), -1) AS m FROM days').get().m;
  const info = db
    .prepare('INSERT INTO days (name, subtitle, emoji, weekday, day_order) VALUES (?, ?, ?, ?, ?)')
    .run(name, subtitle || null, emoji || '\u{1F3CB}', weekday || null, maxOrder + 1);
  res.status(201).json(getFullDay(info.lastInsertRowid));
});

router.put('/:id', (req, res) => {
  const day = db.prepare('SELECT * FROM days WHERE id = ?').get(req.params.id);
  if (!day) return res.status(404).json({ error: 'Day not found' });
  const { name, subtitle, emoji, weekday, day_order } = req.body || {};
  db.prepare(
    'UPDATE days SET name = ?, subtitle = ?, emoji = ?, weekday = ?, day_order = ? WHERE id = ?'
  ).run(
    name ?? day.name,
    subtitle ?? day.subtitle,
    emoji ?? day.emoji,
    weekday ?? day.weekday,
    day_order ?? day.day_order,
    day.id
  );
  res.json(getFullDay(day.id));
});

router.delete('/:id', (req, res) => {
  const result = db.prepare('DELETE FROM days WHERE id = ?').run(req.params.id);
  if (result.changes === 0) return res.status(404).json({ error: 'Day not found' });
  res.status(204).end();
});

// Exercises nested under a day
router.post('/:id/exercises', (req, res) => {
  const day = db.prepare('SELECT * FROM days WHERE id = ?').get(req.params.id);
  if (!day) return res.status(404).json({ error: 'Day not found' });
  const { name, target_sets, target_reps, default_weight, weight_unit, cue, video_url } = req.body || {};
  if (!name) return res.status(400).json({ error: 'name is required' });
  const maxOrder = db
    .prepare('SELECT COALESCE(MAX(exercise_order), -1) AS m FROM exercises WHERE day_id = ?')
    .get(day.id).m;
  const info = db
    .prepare(
      `INSERT INTO exercises (day_id, name, target_sets, target_reps, default_weight, weight_unit, cue, exercise_order, video_url)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`
    )
    .run(
      day.id,
      name,
      target_sets ?? null,
      target_reps ?? null,
      default_weight ?? null,
      weight_unit || 'kg',
      cue || null,
      maxOrder + 1,
      video_url || null
    );
  res.status(201).json(db.prepare('SELECT * FROM exercises WHERE id = ?').get(info.lastInsertRowid));
});

export default router;

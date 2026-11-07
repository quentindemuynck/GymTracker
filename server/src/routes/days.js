import express from 'express';
import { db } from '../db.js';
import { requireAuth } from '../auth.js';

const router = express.Router();
router.use(requireAuth);

const DAY_SELECT = `
  SELECT days.*, u.display_name AS owner_display_name, u.color AS owner_color
  FROM days LEFT JOIN users u ON u.id = days.user_id
`;

function getFullDay(dayId) {
  const day = db.prepare(`${DAY_SELECT} WHERE days.id = ?`).get(dayId);
  if (!day) return null;
  const exercises = db
    .prepare('SELECT * FROM exercises WHERE day_id = ? ORDER BY exercise_order, id')
    .all(dayId);
  return { ...day, exercises };
}

function withExercises(days) {
  return days.map((d) => ({
    ...d,
    exercises: db.prepare('SELECT * FROM exercises WHERE day_id = ? ORDER BY exercise_order, id').all(d.id),
  }));
}

// GET /api/days - MY OWN split only
router.get('/', (req, res) => {
  const days = db.prepare(`${DAY_SELECT} WHERE days.user_id = ? ORDER BY day_order, days.id`).all(req.user.id);
  res.json(withExercises(days));
});

// GET /api/days/templates - global starter templates anyone can copy
router.get('/templates', (req, res) => {
  const days = db.prepare(`${DAY_SELECT} WHERE days.user_id IS NULL ORDER BY day_order, days.id`).all();
  res.json(withExercises(days));
});

// GET /api/days/user/:userId - another user's split, read-only
router.get('/user/:userId', (req, res) => {
  const days = db
    .prepare(`${DAY_SELECT} WHERE days.user_id = ? ORDER BY day_order, days.id`)
    .all(req.params.userId);
  res.json(withExercises(days));
});

// GET /api/days/:id - any single day (own, a friend's, or a template) - read access is open,
// mutation routes below enforce ownership individually.
router.get('/:id', (req, res) => {
  const day = getFullDay(req.params.id);
  if (!day) return res.status(404).json({ error: 'Day not found' });
  res.json(day);
});

router.post('/', (req, res) => {
  const { name, subtitle, emoji, weekday } = req.body || {};
  if (!name) return res.status(400).json({ error: 'name is required' });
  const maxOrder = db
    .prepare('SELECT COALESCE(MAX(day_order), -1) AS m FROM days WHERE user_id = ?')
    .get(req.user.id).m;
  const info = db
    .prepare('INSERT INTO days (user_id, name, subtitle, emoji, weekday, day_order) VALUES (?, ?, ?, ?, ?, ?)')
    .run(req.user.id, name, subtitle || null, emoji || '\u{1F3CB}', weekday || null, maxOrder + 1);
  res.status(201).json(getFullDay(info.lastInsertRowid));
});

router.put('/:id', (req, res) => {
  const day = db.prepare('SELECT * FROM days WHERE id = ?').get(req.params.id);
  if (!day) return res.status(404).json({ error: 'Day not found' });
  if (day.user_id !== req.user.id) return res.status(403).json({ error: 'You can only edit your own days' });
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
  const day = db.prepare('SELECT * FROM days WHERE id = ?').get(req.params.id);
  if (!day) return res.status(404).json({ error: 'Day not found' });
  if (day.user_id !== req.user.id) return res.status(403).json({ error: 'You can only delete your own days' });
  db.prepare('DELETE FROM days WHERE id = ?').run(day.id);
  res.status(204).end();
});

// POST /api/days/:id/copy - copy ANY day (template, a friend's, or your own) into a new
// day you own, along with all of its exercises.
router.post('/:id/copy', (req, res) => {
  const source = getFullDay(req.params.id);
  if (!source) return res.status(404).json({ error: 'Day not found' });

  const maxOrder = db
    .prepare('SELECT COALESCE(MAX(day_order), -1) AS m FROM days WHERE user_id = ?')
    .get(req.user.id).m;

  const insertDay = db.prepare(
    'INSERT INTO days (user_id, name, subtitle, emoji, weekday, day_order) VALUES (?, ?, ?, ?, ?, ?)'
  );
  const insertExercise = db.prepare(
    `INSERT INTO exercises (day_id, name, target_sets, target_reps, default_weight, weight_unit, cue, exercise_order, video_url)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`
  );

  const newDayId = db.transaction(() => {
    const dayInfo = insertDay.run(
      req.user.id,
      source.name,
      source.subtitle,
      source.emoji,
      source.weekday,
      maxOrder + 1
    );
    source.exercises.forEach((ex, i) => {
      insertExercise.run(
        dayInfo.lastInsertRowid,
        ex.name,
        ex.target_sets,
        ex.target_reps,
        ex.default_weight,
        ex.weight_unit,
        ex.cue,
        i,
        ex.video_url
      );
    });
    return dayInfo.lastInsertRowid;
  })();

  res.status(201).json(getFullDay(newDayId));
});

// Exercises nested under a day
router.post('/:id/exercises', (req, res) => {
  const day = db.prepare('SELECT * FROM days WHERE id = ?').get(req.params.id);
  if (!day) return res.status(404).json({ error: 'Day not found' });
  if (day.user_id !== req.user.id) {
    return res.status(403).json({ error: 'You can only add exercises to your own days' });
  }
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

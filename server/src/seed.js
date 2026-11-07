import { db } from './db.js';

const DAYS = [
  {
    name: 'Push',
    subtitle: 'Chest - Tricep - Front & Side Delts',
    emoji: '\u{1F3CB}',
    weekday: 'Monday',
    exercises: [
      {
        name: 'Smith Machine Incline Bench Press (30°)',
        target_sets: 2,
        target_reps: '12',
        default_weight: 6.25,
        cue: 'Hands on the grip, elbows tucked in, arch your back.',
      },
      {
        name: 'Incline Smith Machine Shoulder Press (60°)',
        target_sets: 2,
        target_reps: '12',
        default_weight: 6.25,
        cue: 'Each side (ES).',
      },
      {
        name: 'Tricep Cable V-Bar Pushdown',
        target_sets: 2,
        target_reps: '12',
        default_weight: 8.75,
        cue: 'Slight V-bar grip.',
      },
      {
        name: 'Pec Dec Flys / Chest Press Machine',
        target_sets: 3,
        target_reps: '12',
        default_weight: 18.75,
        cue: 'Pec dec flys (stand 8) at 18.75kg, or chest press machine with elbows flared at 20kg — alternate between the two.',
      },
      {
        name: 'Dumbbell Lateral Raises',
        target_sets: 2,
        target_reps: '12',
        default_weight: 2,
      },
      {
        name: 'Leg Raises (Abs)',
        target_sets: 2,
        target_reps: 'failure',
      },
    ],
  },
  {
    name: 'Pull',
    subtitle: 'Back - Bicep - Rear Delts - Forearm (lat focused)',
    emoji: '\u{1F4AA}',
    weekday: 'Tuesday',
    exercises: [
      {
        name: 'Mag Lat Pulldown (Wide Grip)',
        target_sets: 2,
        target_reps: '10',
        default_weight: 15,
        cue: 'Wide grip, thumbless, knees under the pad. Keep body close, pull slow into your hips.',
      },
      {
        name: 'Machine Row (Stand 5)',
        target_sets: 2,
        target_reps: '10',
        default_weight: 7.5,
        cue: 'Each side (ES).',
      },
      {
        name: 'SA Cable Lat Pulldown (90°)',
        target_sets: 2,
        target_reps: '12',
        default_weight: 7.5,
      },
      {
        name: 'EZ Bar Preacher Curl (Stand 4)',
        target_sets: 1,
        target_reps: '10',
        default_weight: 0,
        cue: 'Each side (ES).',
      },
      {
        name: 'Close Grip Machine Row / Wide Grip Seated Cable Row',
        target_sets: 2,
        target_reps: '10',
        default_weight: 7.5,
        cue: 'Close grip machine row (ES) at 7.5kg, or wide grip seated cable row 1x10 at 15kg.',
      },
      {
        name: 'Seated Supported DB Bicep Curl (60°)',
        target_sets: 2,
        target_reps: '10',
        default_weight: 6,
      },
      {
        name: 'Smith Machine T-Bar Row (45°) / Close Grip Machine Row',
        target_sets: 2,
        target_reps: '10',
        default_weight: 7.5,
        cue: 'T-bar row (ES) at 7.5kg, or close grip machine row (ES) at 5kg.',
      },
      {
        name: 'DB Hammer Curl Variations',
        target_sets: 2,
        target_reps: '10',
        default_weight: 8,
      },
      {
        name: 'Reverse Pec Deck / Rear Delt Fly',
        target_sets: 2,
        target_reps: '12',
        default_weight: 7.5,
        cue: 'Reverse pec deck at 7.5kg, or rear delt fly at 2.5kg.',
      },
      {
        name: 'Cable Straight Bar Forearm Curl',
        target_sets: 2,
        target_reps: '8',
        default_weight: 10,
      },
    ],
  },
  {
    name: 'Leg Day A',
    subtitle: 'Lower - Hamstring & Glute Focus',
    emoji: '\u{1F9BF}',
    weekday: 'Wednesday',
    exercises: [
      {
        name: 'Mobility Warm-up',
        cue: 'Chest openers, leg swings, hip leaning back, cobra, flying hip, hip in & outs.',
      },
      {
        name: 'Barbell RDL (slow)',
        target_sets: 2,
        target_reps: '5',
        default_weight: 0,
        cue: 'Each side (ES). Keep it slow and controlled.',
      },
      {
        name: 'Squat',
        target_sets: 2,
        target_reps: '8',
        default_weight: 8,
        cue: 'Working range 8-10kg.',
      },
      {
        name: 'Single Leg Calf Raises (Stand 8)',
        target_sets: 2,
        target_reps: '12',
        default_weight: 20,
      },
      {
        name: 'Seated Hamstring Curl',
        target_sets: 2,
        target_reps: '10',
        default_weight: 15,
        cue: 'Use towel & pin.',
      },
      {
        name: 'Leg Extension',
        target_sets: 2,
        target_reps: '10',
        default_weight: 15,
      },
      {
        name: 'Leg Raises',
        target_sets: 2,
        target_reps: 'failure',
      },
      {
        name: 'Seated Adductors',
        target_sets: 2,
        target_reps: '8',
        default_weight: 30,
        cue: 'Slow with a stretch at the end.',
      },
      {
        name: 'Seated Abductors',
        target_sets: 1,
        target_reps: '10',
        default_weight: 30,
        cue: '1x10 leaning forward (voorover leunen) + 1x10 leaning against the bench (tegen het bankje leunen).',
      },
    ],
  },
];

const QUOTES = [
  { text: 'The only bad workout is the one that didn’t happen.', author: null },
  { text: 'Discipline is choosing between what you want now and what you want most.', author: 'Abraham Lincoln' },
  { text: 'Strength does not come from winning. Your struggles develop your strengths.', author: 'Arnold Schwarzenegger' },
  { text: 'The pain of discipline is far less than the pain of regret.', author: null },
  { text: 'You don’t have to be extreme, just consistent.', author: null },
  { text: 'Sweat is just fat crying.', author: null },
  { text: 'A one hour workout is 4% of your day. No excuses.', author: null },
  { text: 'It never gets easier, you just get stronger.', author: null },
  { text: 'Progress, not perfection.', author: null },
  { text: 'The body achieves what the mind believes.', author: null },
  { text: 'Fall in love with the process and the results will come.', author: null },
  { text: 'Nobody who ever gave his best regretted it.', author: 'George Halas' },
  { text: 'Champions keep playing until they get it right.', author: 'Billie Jean King' },
  { text: 'Your only limit is you.', author: null },
  { text: 'Small steps every day lead to big results.', author: null },
  { text: 'Train like a beast, look like a beauty.', author: null },
  { text: 'Today’s pain is tomorrow’s power.', author: null },
  { text: 'Consistency over intensity.', author: null },
  { text: 'Lift heavy, recover harder.', author: null },
  { text: 'The gym is the only place where you can earn your success before you’ve had it.', author: null },
];

function seedDays() {
  const existing = db.prepare('SELECT COUNT(*) AS c FROM days').get().c;
  if (existing > 0) {
    console.log('Days already seeded, skipping.');
    return;
  }
  const insertDay = db.prepare(
    'INSERT INTO days (name, subtitle, emoji, weekday, day_order) VALUES (?, ?, ?, ?, ?)'
  );
  const insertExercise = db.prepare(
    `INSERT INTO exercises (day_id, name, target_sets, target_reps, default_weight, weight_unit, cue, exercise_order)
     VALUES (?, ?, ?, ?, ?, 'kg', ?, ?)`
  );

  const run = db.transaction(() => {
    DAYS.forEach((day, dayIndex) => {
      const dayInfo = insertDay.run(day.name, day.subtitle, day.emoji, day.weekday, dayIndex);
      day.exercises.forEach((ex, exIndex) => {
        insertExercise.run(
          dayInfo.lastInsertRowid,
          ex.name,
          ex.target_sets ?? null,
          ex.target_reps ?? null,
          ex.default_weight ?? null,
          ex.cue ?? null,
          exIndex
        );
      });
    });
  });
  run();
  console.log(`Seeded ${DAYS.length} days.`);
}

function seedQuotes() {
  const existing = db.prepare('SELECT COUNT(*) AS c FROM quotes').get().c;
  if (existing > 0) {
    console.log('Quotes already seeded, skipping.');
    return;
  }
  const insert = db.prepare('INSERT INTO quotes (text, author) VALUES (?, ?)');
  const run = db.transaction(() => {
    QUOTES.forEach((q) => insert.run(q.text, q.author));
  });
  run();
  console.log(`Seeded ${QUOTES.length} quotes.`);
}

seedDays();
seedQuotes();
console.log('Seed complete.');

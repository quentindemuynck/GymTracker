import express from 'express';
import { db } from '../db.js';
import { requireAuth } from '../auth.js';

const router = express.Router();
router.use(requireAuth);

// Cheap string hash so the daily pick jumps around unpredictably instead of visibly
// cycling 0, 1, 2, 3... through the list.
function hashString(str) {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = (hash * 31 + str.charCodeAt(i)) | 0;
  }
  return Math.abs(hash);
}

// Quote of the day: same quote for everyone and stable all day (keyed off today's UTC
// date), but which quote that is looks random from day to day rather than following the
// list's order.
router.get('/today', (req, res) => {
  const quotes = db.prepare('SELECT * FROM quotes').all();
  if (quotes.length === 0) return res.json(null);
  const dateKey = new Date().toISOString().slice(0, 10);
  const index = hashString(dateKey) % quotes.length;
  res.json(quotes[index]);
});

export default router;

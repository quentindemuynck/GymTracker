import express from 'express';
import { db } from '../db.js';
import { requireAuth } from '../auth.js';

const router = express.Router();
router.use(requireAuth);

// Deterministic "quote of the day" so everyone sees the same one, but it still rotates daily.
router.get('/today', (req, res) => {
  const quotes = db.prepare('SELECT * FROM quotes').all();
  if (quotes.length === 0) return res.json(null);
  const dayNumber = Math.floor(Date.now() / 86400000);
  res.json(quotes[dayNumber % quotes.length]);
});

router.get('/random', (req, res) => {
  const quote = db.prepare('SELECT * FROM quotes ORDER BY RANDOM() LIMIT 1').get();
  res.json(quote || null);
});

export default router;

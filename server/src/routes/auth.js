import express from 'express';
import bcrypt from 'bcryptjs';
import { db } from '../db.js';
import { signToken, setAuthCookie, clearAuthCookie, requireAuth } from '../auth.js';

const router = express.Router();

const PALETTE = ['#6ee7b7', '#93c5fd', '#fca5a5', '#fcd34d', '#c4b5fd', '#f9a8d4'];

router.post('/register', (req, res) => {
  const { username, password, displayName } = req.body || {};
  if (!username || !password || !displayName) {
    return res.status(400).json({ error: 'username, password and displayName are required' });
  }
  if (password.length < 6) {
    return res.status(400).json({ error: 'Password must be at least 6 characters' });
  }
  const existing = db.prepare('SELECT id FROM users WHERE username = ?').get(username.toLowerCase());
  if (existing) return res.status(409).json({ error: 'Username already taken' });

  const userCount = db.prepare('SELECT COUNT(*) AS c FROM users').get().c;
  const color = PALETTE[userCount % PALETTE.length];
  const hash = bcrypt.hashSync(password, 10);
  const info = db
    .prepare('INSERT INTO users (username, password_hash, display_name, color) VALUES (?, ?, ?, ?)')
    .run(username.toLowerCase(), hash, displayName, color);

  const user = { id: info.lastInsertRowid, username: username.toLowerCase() };
  const token = signToken(user);
  setAuthCookie(res, token);
  res.status(201).json({ id: user.id, username: user.username, displayName, color });
});

router.post('/login', (req, res) => {
  const { username, password } = req.body || {};
  if (!username || !password) return res.status(400).json({ error: 'username and password are required' });
  const user = db.prepare('SELECT * FROM users WHERE username = ?').get(username.toLowerCase());
  if (!user || !bcrypt.compareSync(password, user.password_hash)) {
    return res.status(401).json({ error: 'Invalid username or password' });
  }
  const token = signToken(user);
  setAuthCookie(res, token);
  res.json({ id: user.id, username: user.username, displayName: user.display_name, color: user.color });
});

router.post('/logout', (req, res) => {
  clearAuthCookie(res);
  res.status(204).end();
});

router.get('/me', requireAuth, (req, res) => {
  const user = db.prepare('SELECT id, username, display_name, color FROM users WHERE id = ?').get(req.user.id);
  if (!user) return res.status(404).json({ error: 'User not found' });
  res.json({ id: user.id, username: user.username, displayName: user.display_name, color: user.color });
});

router.get('/users', requireAuth, (req, res) => {
  const users = db.prepare('SELECT id, display_name, color FROM users ORDER BY id').all();
  res.json(users.map((u) => ({ id: u.id, displayName: u.display_name, color: u.color })));
});

export default router;

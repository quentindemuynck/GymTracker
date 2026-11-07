import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import path from 'node:path';
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';

import './db.js';
import authRoutes from './routes/auth.js';
import dayRoutes from './routes/days.js';
import exerciseRoutes from './routes/exercises.js';
import sessionRoutes from './routes/sessions.js';
import quoteRoutes from './routes/quotes.js';

const app = express();
const PORT = process.env.PORT || 4000;
const origins = (process.env.CORS_ORIGIN || 'http://localhost:5173').split(',').map((o) => o.trim());

app.use(cors({ origin: origins, credentials: true }));
app.use(express.json());
app.use(cookieParser());

app.get('/api/health', (req, res) => res.json({ ok: true }));

app.use('/api/auth', authRoutes);
app.use('/api/days', dayRoutes);
app.use('/api/exercises', exerciseRoutes);
app.use('/api/sessions', sessionRoutes);
app.use('/api/quotes', quoteRoutes);

// Optionally serve the built frontend (web/dist) so one process can run the whole app
// behind a single port/origin in production. Run `npm run build:web` from the repo root first.
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const webDist = path.join(__dirname, '..', '..', 'web', 'dist');
if (fs.existsSync(webDist)) {
  app.use(express.static(webDist));
  app.get(/^(?!\/api).*/, (req, res) => {
    res.sendFile(path.join(webDist, 'index.html'));
  });
  console.log('Serving built frontend from web/dist');
}

app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ error: 'Something went wrong on the server' });
});

app.listen(PORT, () => {
  console.log(`GymTracker API running on http://localhost:${PORT}`);
});

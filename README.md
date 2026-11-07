# Gym Tracker

A shared gym-split planner, logger and tracker — built so you and your gym buddy can
replace the "Gymsplit SigmaBeer" notes app with something that actually tracks your weights,
form cues and gym days, from either of your phones. Install it as a PWA.

## What it does

- **Personal splits** — your days and exercises are your own: add/edit/delete freely, with
  target sets/reps/weight and a form cue per exercise (e.g. "elbows tucked in").
- **Weight logging** — log the weight, sets, reps and a note every time you do an exercise
  in your own split.
- **Templates** — starter splits (seeded from your original notes) that anyone can copy into
  their own account and then customize however they want.
- **Users tab** — browse everyone's splits and stats read-only, and copy any day or exercise
  of theirs straight into your own split.
- **Gym day tracker** — mark a day as done (or backfill a past date) and see your streak,
  weekly count and total sessions.
- **Quote of the day** — same quote for everyone, rotates daily.
- **Enforced ownership** — you can see everyone's splits/logs, but can only edit, delete or
  log against days and exercises you own (checked server-side, not just hidden in the UI).

Not included yet (see "Later" below): exercise demo videos — you asked to skip these for now.

## Stack

- **Backend**: Node + Express + SQLite (`better-sqlite3`, a single file database — easy to
  back up, no separate DB server to run). Cookie-based auth (JWT in an httpOnly cookie).
- **Frontend**: React + TypeScript + Vite, built as an installable PWA (`vite-plugin-pwa`).
- No external services required — everything runs on your own server.

## Project layout

```
server/   Express API + SQLite database
  src/
    db.js        schema
    seed.js       seeds your split + quotes (safe to re-run, skips if already seeded)
    routes/       auth, days/exercises, logs/notes, sessions, quotes
  data/           gymtracker.db lives here (gitignored)
web/      React PWA frontend (Vite)
```

## Local development

Requires Node 20+.

```bash
npm run install:all   # installs server/ and web/ deps
cp server/.env.example server/.env
npm run seed           # seeds your Push/Pull/Leg Day A split + motivation quotes
npm run dev             # runs the API (port 4000) and the frontend (port 5173) together
```

Open http://localhost:5173, register an account for yourself, and send your buddy the link
to do the same (once it's deployed somewhere you can both reach — see below).

To reset all data during development, stop the server and delete `server/data/gymtracker.db*`,
then run `npm run seed` again.

## Self-hosting (production)

Since you're running this on your own server, the backend can serve the built frontend
directly — one Node process, one port, no CORS to configure:

```bash
npm run install:all
npm run build:web                 # builds web/dist
cp server/.env.example server/.env
# edit server/.env: set a real JWT_SECRET, NODE_ENV=production, and CORS_ORIGIN to your domain
npm run seed
npm run start:server              # serves the API + the built PWA on PORT (default 4000)
```

Then put a reverse proxy (Caddy, nginx, or Cloudflare Tunnel) in front of it with **HTTPS** —
browsers only let a PWA be installed and its service worker run over HTTPS (localhost is
exempt, your real domain isn't). Point the proxy at `http://localhost:4000` and it just works.

Keep the process alive with `pm2` or a systemd unit, e.g.:

```bash
pm2 start server/src/index.js --name gymtracker --cwd server
```

Back up `server/data/gymtracker.db` periodically — it's the only state the app has.

### Accounts

There's no admin/invite step — registration is open (`/register`). Since this is on your own
server for just the two of you, that's fine; if you want to lock it down further later, the
easiest option is to put the reverse proxy behind HTTP basic auth or a VPN, or I can add an
invite-code gate to `/api/auth/register`.

## Permissions model

- Days and their exercises belong to one user (`days.user_id`). Only the owner can edit,
  delete, add exercises to, or log workouts against their own days — enforced in the API
  (`user_id` checked on every write), not just hidden in the UI.
- A day with `user_id = NULL` is a global **template** — visible to everyone, owned by no one,
  not directly editable or loggable. New accounts start with an empty split; the Templates
  page lets them copy a starter split (and then freely customize their copy).
- Anyone can view anyone else's days, exercises and logs (the **Users** tab), and copy any
  single exercise or an entire day into their own split via `POST /days/:id/copy` or
  `POST /exercises/:id/copy`. Copying always creates new rows owned by you — the original is
  untouched.
- Gym-day sessions (the streak tracker) are owned by whoever logged them, same as before.

## Later / ideas

- **Exercise videos** — you said skip for now. When you want them, the cleanest path given
  your exercise names (lots of "Smith machine", "stand 8", etc.) is a YouTube search embed
  per exercise rather than a fixed video-database lookup, since a free API (like wger.de)
  won't have your specific machines. I left `video_url` on each exercise so a link can be
  added manually in the meantime.
- Progress charts (weight over time per exercise).
- PR tracking (auto-highlight your heaviest set per exercise).
- Offline logging queue (right now logging needs a connection; the PWA shell itself works offline).
- Body-weight tracking.

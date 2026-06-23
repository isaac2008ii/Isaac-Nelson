# Forge — Workout Tracker

A clean, private, **Hevy-style workout tracker** for daily use — without any
social features. No accounts, no feed, no followers. Just you, your lifts, and
a complete memory of everything you've done.

Everything is stored locally in your browser, so it works offline and **never
forgets what you did the day before**. Pure HTML/CSS/JS — no build step.

## Run it

It's a static site. Open `index.html` directly, or serve the folder:

```bash
python3 -m http.server 8000
# then visit http://localhost:8000
```

Add it to your phone's home screen for an app-like, full-screen experience.

## What it does

- **Log workouts live** — add exercises, log each set (weight × reps), tick
  sets off as you go, with a running timer, set count and volume in the header.
- **Remembers last time** — when you log an exercise, your previous session's
  sets are shown next to each row and pre-filled, so you always know what to
  beat. This is the whole point: it doesn't forget.
- **Rest timer** — auto-starts when you complete a set, with ±15s and skip.
- **Routines / templates** — build reusable workout templates and start a full
  session in one tap, with target sets per exercise.
- **Exercise library** — 55 built-in exercises across 8 muscle groups, plus
  your own custom exercises. Search and filter by muscle.
- **History** — every finished workout is saved forever, with full set detail.
  Tap any workout to view it, repeat it, or delete it.
- **Progress & stats** — weekly workout counts, total volume / sets / time,
  per-exercise estimated-1RM trend charts, and personal records (heaviest,
  best e1RM, best set volume, most reps).
- **Resume in progress** — leave mid-workout and a "Resume" bar brings you
  right back; the active session survives reloads.
- **Backup** — export all your data to a JSON file and import it back on any
  device. Switch between kg/lb and set a default rest time.

## Your data stays yours

Everything lives in `localStorage` on your device under two keys
(`forge.data.v1` and `forge.active.v1`). Nothing is sent anywhere — there is no
server and no analytics. Use **Stats → Export** regularly to keep a backup, and
**Import** to restore or move to another device.

## Files

- `index.html` — app shell (views, bottom tab bar, overlays)
- `styles.css` — mobile-first dark theme
- `db.js` — data layer: storage, exercise seed, records & progress math
- `app.js` — views, the workout logger, exercise picker, charts, rest timer

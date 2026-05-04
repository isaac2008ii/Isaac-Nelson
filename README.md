# Scripture Quest

A Bible reading game built for teen guys. Think Duolingo, but for the Word.

Read the Word. Beat your boys. Build the streak.

## What's in it

- **Daily streak** — miss a day, lose the streak. Don't miss.
- **XP & ranks** — Squire → Page → Soldier → Knight → Champion → Lionheart → Apostle.
- **Daily quests** — hit your chapter goal, save a reflection, keep the streak alive.
- **Reading plans** — bite-sized passages, picked for teen guys:
  - **Warrior's Heart** — David, courage, kingdom
  - **Built Different** — identity in Christ
  - **Wisdom for the Way** — Proverbs that hit
  - **The King's Story** — the Gospel of Mark
  - **Run Your Race** — endurance & discipline
- **Leaderboard** — weekly, all-time, and streak. Add your friends and beat them.
- **Leagues** — Bronze → Silver → Gold → Sapphire → Ruby → Diamond.
- **Achievements** — On Fire (7-day streak), Iron Man (30-day), Bookworm, Disciple, etc.
- **Reflect & Apply** — short prompt after each passage. Saved locally. +5 XP.

## How to run

It's a static web app — no build step, no server needed.

```bash
# from the repo root
python3 -m http.server 8000
# then open http://localhost:8000
```

Or just open `index.html` directly in a browser.

Works on phones (responsive layout, sticky bottom nav) and desktops.

## Files

- `index.html` — app shell with all views
- `styles.css` — dark, game-themed UI
- `app.js` — state, XP, streaks, quests, leaderboard, achievements
- `data.js` — Bible passages (WEB, public domain), plans, ranks, achievements

All progress is saved in `localStorage` under the key `scripture-quest-v1`.

## Translation

Default is the **World English Bible** (WEB) — a modern, public-domain translation.

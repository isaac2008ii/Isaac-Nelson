# Bloom — Klaviyo Growth Dashboard

A custom, aesthetic dashboard for visualizing Klaviyo signup-form growth.
Frosted-glass cards, soft mesh gradients, and hand-built SVG charts (no
heavyweight chart library). Pure HTML/CSS/JS — no build step.

## Run it (demo data — no setup)

It's a static site. Open `index.html` directly, or serve the folder:

```bash
python3 -m http.server 8000
# then visit http://localhost:8000
```

The sidebar badge will say **"Demo data"** — you're seeing realistic mock numbers.

## Run it with your real Klaviyo data

There's a tiny zero-dependency Node server (`server.js`) that serves the
dashboard **and** securely proxies Klaviyo so your private key never reaches
the browser. Needs **Node 18+** (no `npm install`).

1. Get a **Private API key**: Klaviyo → **Settings → API Keys → Create Private
   API Key** (read-only scopes are enough).
2. Copy `.env.example` to `.env` and paste your key:
   ```bash
   cp .env.example .env
   # edit .env -> KLAVIYO_API_KEY=pk_xxxxxxxx
   ```
3. Start it:
   ```bash
   node server.js
   ```
4. Open **http://localhost:8000**. The badge now reads **"Live API"**.

Live today: form list, per-form **signup growth** chart, and the growth-ranked
leaderboard. The KPI cards, funnel, and sources donut stay on demo data until
those Klaviyo metrics are wired in (each falls back automatically, so nothing
breaks).

> Your `.env` is git-ignored. Never commit your real key.

## What it shows

- **KPI row** — new subscribers, submit rate, AOV, revenue/recipient (with sparklines)
- **Signup form growth** — smooth animated area chart per form, switchable, with hover tooltips
- **Conversion funnel** — views → interacted → submitted → confirmed
- **Top forms** — ranked by growth vs. previous period
- **Subscriber sources** — donut breakdown

Use the `7D / 30D / 90D` toggle to change the window and the form dropdown to
switch which signup form the hero chart and funnel describe.

## Wiring in real Klaviyo data

The UI reads everything through `window.BloomData` in `data.js`, which
currently returns realistic **mock** data shaped like Klaviyo's API. To go
live, replace those methods with calls to *your own backend proxy*.

> ⚠️ Never put a Klaviyo private API key in browser code. Front it with a
> small server (or serverless function) that holds the key and exposes only
> the aggregates this dashboard needs.

Relevant Klaviyo endpoints:

- Forms: `GET /api/forms/`
- Form growth over time: `POST /api/form-reporting/` (or Metric Aggregates
  for the "Subscribed to List" / form-submit metric, bucketed by day)
- List/segment size growth: `GET /api/lists/{id}` + Metric Aggregates

Example swap in `data.js`:

```js
getFormGrowth: async (formId, days) => {
  const res = await fetch(`/api/bloom/forms/${formId}/growth?days=${days}`);
  return res.json(); // -> { form, series:[{date,value}], total, delta }
}
```

(The render functions in `app.js` would then `await` these calls.)

## Files

- `index.html` — markup / layout
- `styles.css` — glassmorphism, mesh gradient, responsive grid
- `data.js` — data layer (mock now, Klaviyo proxy later)
- `app.js` — rendering + custom SVG charts + interactions

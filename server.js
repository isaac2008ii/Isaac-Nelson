/*
 * Bloom backend — zero-dependency Node server.
 * --------------------------------------------------------------
 * Serves the static dashboard AND proxies Klaviyo so your private
 * API key never reaches the browser.
 *
 * Run:   KLAVIYO_API_KEY=pk_xxx node server.js
 *        (or put the key in a .env file — see .env.example)
 *
 * Needs Node 18+ (uses the built-in global fetch). No npm install.
 *
 * Live endpoints (used by data.js):
 *   GET /api/bloom/status              -> { connected }
 *   GET /api/bloom/forms               -> [{ id, name, color }]
 *   GET /api/bloom/forms/:id/growth    -> { form, series, total, delta }
 *   GET /api/bloom/ranking?days=30     -> [{ name, total, delta, color }]
 * Anything not implemented live returns 501 and the dashboard
 * falls back to demo data for that widget.
 */
"use strict";

const http = require("node:http");
const fs = require("node:fs");
const path = require("node:path");
const url = require("node:url");

// --- load .env (simple parser, no dependency) ---
(function loadEnv() {
  try {
    const txt = fs.readFileSync(path.join(__dirname, ".env"), "utf8");
    txt.split("\n").forEach((line) => {
      const m = line.match(/^\s*([\w.-]+)\s*=\s*(.*)\s*$/);
      if (m && !process.env[m[1]]) {
        process.env[m[1]] = m[2].replace(/^["']|["']$/g, "");
      }
    });
  } catch (_) { /* no .env, that's fine */ }
})();

const KEY = process.env.KLAVIYO_API_KEY || "";
const PORT = process.env.PORT || 8000;
const REVISION = "2024-10-15";
const COLORS = ["orange", "violet", "blue", "rose"];

/* ---------------- Klaviyo helpers ---------------- */
function kFetch(endpoint, init = {}) {
  return fetch("https://a.klaviyo.com" + endpoint, {
    ...init,
    headers: {
      Authorization: "Klaviyo-API-Key " + KEY,
      revision: REVISION,
      accept: "application/json",
      "content-type": "application/json",
      ...(init.headers || {}),
    },
  });
}

// tiny in-memory cache so repeated widget loads don't hammer the API
const cache = new Map();
async function cached(key, ttlMs, fn) {
  const hit = cache.get(key);
  if (hit && Date.now() - hit.t < ttlMs) return hit.v;
  const v = await fn();
  cache.set(key, { t: Date.now(), v });
  return v;
}

async function getForms() {
  return cached("forms", 5 * 60_000, async () => {
    const res = await kFetch("/api/forms");
    if (!res.ok) throw new Error("forms " + res.status);
    const json = await res.json();
    return (json.data || []).map((f, i) => ({
      id: f.id,
      name: (f.attributes && f.attributes.name) || "Untitled form",
      color: COLORS[i % COLORS.length],
    }));
  });
}

function isoDaysAgo(days) {
  const d = new Date();
  d.setUTCHours(0, 0, 0, 0);
  d.setUTCDate(d.getUTCDate() - days);
  return d.toISOString();
}

// One report covering `days` ending today, daily buckets, all forms.
async function getReport(days) {
  return cached("report:" + days, 60_000, async () => {
    const body = {
      data: {
        type: "form-series-report",
        attributes: {
          statistics: ["submits", "viewed_form"],
          interval: "daily",
          timeframe: { start: isoDaysAgo(days), end: new Date().toISOString() },
        },
      },
    };
    const res = await kFetch("/api/form-series-reports", {
      method: "POST",
      body: JSON.stringify(body),
    });
    if (!res.ok) throw new Error("report " + res.status + " " + (await res.text()).slice(0, 200));
    const json = await res.json();
    const attrs = (json.data && json.data.attributes) || {};
    const dates = (attrs.date_times || []).map((d) => String(d).slice(0, 10));
    const byForm = {};
    (attrs.results || []).forEach((r) => {
      const id = r.groupings && r.groupings.form_id;
      if (id) byForm[id] = (r.statistics && r.statistics.submits) || [];
    });
    return { dates, byForm };
  });
}

function sum(a) { return a.reduce((x, y) => x + (y || 0), 0); }

async function growth(formId, days) {
  const forms = await getForms();
  const form = forms.find((f) => f.id === formId) || forms[0];
  const rep = await getReport(days * 2); // 2x window so we can compute prev-period delta
  const submits = rep.byForm[formId] || [];
  const half = Math.floor(submits.length / 2);
  const recent = submits.slice(half);
  const prior = submits.slice(0, half);
  const recentDates = rep.dates.slice(half);
  const series = recent.map((v, i) => ({ date: recentDates[i] || "", value: v || 0 }));
  const total = sum(recent);
  const priorTotal = sum(prior);
  const delta = priorTotal > 0 ? ((total - priorTotal) / priorTotal) * 100 : 0;
  return { form, series, total, delta };
}

async function ranking(days) {
  const forms = await getForms();
  const rep = await getReport(days * 2);
  return forms
    .map((f) => {
      const s = rep.byForm[f.id] || [];
      const half = Math.floor(s.length / 2);
      const total = sum(s.slice(half));
      const prior = sum(s.slice(0, half));
      const delta = prior > 0 ? ((total - prior) / prior) * 100 : 0;
      return { name: f.name, total, delta, color: f.color };
    })
    .sort((a, b) => b.total - a.total);
}

/* ---------------- HTTP server ---------------- */
const MIME = {
  ".html": "text/html", ".css": "text/css", ".js": "text/javascript",
  ".json": "application/json", ".svg": "image/svg+xml", ".ico": "image/x-icon",
};

function sendJSON(res, code, obj) {
  res.writeHead(code, { "content-type": "application/json" });
  res.end(JSON.stringify(obj));
}

async function handleApi(req, res, pathname, query) {
  if (pathname === "/api/bloom/status") {
    return sendJSON(res, 200, { connected: !!KEY });
  }
  if (!KEY) return sendJSON(res, 503, { error: "no_key" });

  try {
    if (pathname === "/api/bloom/forms") {
      return sendJSON(res, 200, await getForms());
    }
    const g = pathname.match(/^\/api\/bloom\/forms\/([^/]+)\/growth$/);
    if (g) {
      const days = parseInt(query.days, 10) || 30;
      return sendJSON(res, 200, await growth(decodeURIComponent(g[1]), days));
    }
    if (pathname === "/api/bloom/ranking") {
      const days = parseInt(query.days, 10) || 30;
      return sendJSON(res, 200, await ranking(days));
    }
    return sendJSON(res, 501, { error: "not_implemented" });
  } catch (err) {
    console.error("[bloom] Klaviyo error:", err.message);
    return sendJSON(res, 502, { error: "klaviyo_failed", detail: err.message });
  }
}

function serveStatic(res, pathname) {
  let file = pathname === "/" ? "/index.html" : pathname;
  const full = path.join(__dirname, path.normalize(file).replace(/^(\.\.[/\\])+/, ""));
  if (!full.startsWith(__dirname)) { res.writeHead(403); return res.end("Forbidden"); }
  fs.readFile(full, (err, data) => {
    if (err) { res.writeHead(404); return res.end("Not found"); }
    res.writeHead(200, { "content-type": MIME[path.extname(full)] || "application/octet-stream" });
    res.end(data);
  });
}

http.createServer((req, res) => {
  const parsed = url.parse(req.url, true);
  if (parsed.pathname.startsWith("/api/")) {
    return handleApi(req, res, parsed.pathname, parsed.query);
  }
  serveStatic(res, parsed.pathname);
}).listen(PORT, () => {
  console.log(`\n  Bloom running at  http://localhost:${PORT}`);
  console.log(`  Klaviyo: ${KEY ? "connected (live data)" : "no key set -> demo data"}\n`);
});

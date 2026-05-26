/*
 * Bloom — Klaviyo data layer
 * --------------------------------------------------------------
 * Public methods are async. Each one tries the live backend first
 * (server.js, which proxies Klaviyo using your private key) and
 * transparently falls back to realistic MOCK data if the backend
 * isn't running, has no key, or hasn't implemented that widget.
 *
 * So: open index.html directly -> demo data. Run `node server.js`
 * with a key -> real data where implemented, demo for the rest.
 */
(function () {
  "use strict";

  /* ============== live backend ============== */
  async function api(path) {
    try {
      const res = await fetch(path, { headers: { accept: "application/json" } });
      if (!res.ok) return null;
      return await res.json();
    } catch (_) {
      return null; // offline / opened via file:// -> use mock
    }
  }

  /* ============== mock generators ============== */
  const FORMS = [
    { id: "Xa1", name: "Welcome Pop-Up", base: 1180, momentum: 1.0,  color: "orange" },
    { id: "Yb2", name: "Footer Embed",   base: 540,  momentum: 0.62, color: "violet" },
    { id: "Zc3", name: "Exit Intent",    base: 760,  momentum: 0.81, color: "blue"   },
    { id: "Wd4", name: "Spin to Win",    base: 920,  momentum: 1.14, color: "rose"   },
  ];

  function seeded(seed) {
    let s = seed % 2147483647;
    if (s <= 0) s += 2147483646;
    return () => (s = (s * 16807) % 2147483647) / 2147483647;
  }

  function seriesFor(form, days) {
    const rnd = seeded(form.id.charCodeAt(0) * 97 + days);
    const out = [];
    const level = (form.base / 30) * form.momentum;
    const today = new Date("2026-05-25T00:00:00");
    for (let i = days - 1; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(d.getDate() - i);
      const trend = (days - i) / days;
      const weekly = 1 + 0.18 * Math.sin((d.getDay() / 7) * Math.PI * 2);
      const noise = 0.78 + rnd() * 0.5;
      const value = Math.round(level * (0.7 + trend * 0.7) * weekly * noise);
      out.push({ date: d.toISOString().slice(0, 10), value });
    }
    return out;
  }
  const sum = (a) => a.reduce((x, y) => x + y.value, 0);

  const Mock = {
    listForms: () => FORMS.map((f) => ({ id: f.id, name: f.name, color: f.color })),
    getFormGrowth(formId, days) {
      const form = FORMS.find((f) => f.id === formId) || FORMS[0];
      const series = seriesFor(form, days);
      const total = sum(series);
      const prev = total * 0.86;
      return { form: { id: form.id, name: form.name, color: form.color }, series, total, delta: ((total - prev) / prev) * 100 };
    },
    getRanking(days) {
      return FORMS.map((f) => {
        const g = this.getFormGrowth(f.id, days);
        return { name: f.name, total: g.total, delta: g.delta, color: f.color };
      }).sort((a, b) => b.total - a.total);
    },
    getSummary(days) {
      const subs = FORMS.reduce((a, f) => a + this.getFormGrowth(f.id, days).total, 0);
      return [
        { label: "New subscribers", value: subs, delta: 18.4, fmt: "int", spark: "orange" },
        { label: "Form submit rate", value: 7.9, delta: 2.1, fmt: "pct", spark: "violet" },
        { label: "Avg. order value", value: 64.2, delta: -1.3, fmt: "usd", spark: "blue" },
        { label: "Revenue / recipient", value: 1.87, delta: 9.6, fmt: "usd", spark: "rose" },
      ];
    },
    getFunnel(formId, days) {
      const { total } = this.getFormGrowth(formId, days);
      const views = Math.round(total / 0.079);
      return [
        { label: "Form views", value: views, color: "blue" },
        { label: "Interacted", value: Math.round(views * 0.34), color: "violet" },
        { label: "Submitted", value: total, color: "orange" },
        { label: "Confirmed", value: Math.round(total * 0.91), color: "rose" },
      ];
    },
    getSources: () => [
      { label: "Signup forms", value: 58, color: "orange" },
      { label: "Checkout", value: 22, color: "violet" },
      { label: "API / Import", value: 13, color: "blue" },
      { label: "Manual", value: 7, color: "rose" },
    ],
  };

  /* ============== public API (live -> mock) ============== */
  const BloomData = {
    async isLive() {
      const s = await api("/api/bloom/status");
      return !!(s && s.connected);
    },
    async listForms() {
      return (await api("/api/bloom/forms")) || Mock.listForms();
    },
    async getFormGrowth(formId, days) {
      return (await api(`/api/bloom/forms/${encodeURIComponent(formId)}/growth?days=${days}`))
        || Mock.getFormGrowth(formId, days);
    },
    async getRanking(days) {
      return (await api(`/api/bloom/ranking?days=${days}`)) || Mock.getRanking(days);
    },
    // not implemented live yet -> always demo data
    async getSummary(days) { return Mock.getSummary(days); },
    async getFunnel(formId, days) { return Mock.getFunnel(formId, days); },
    async getSources() { return Mock.getSources(); },
  };

  window.BloomData = BloomData;
})();

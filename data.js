/*
 * Bloom — Klaviyo data layer
 * --------------------------------------------------------------
 * Right now this serves realistic MOCK data so the dashboard is
 * viewable with zero credentials. The shapes mirror Klaviyo's
 * REST API responses so you can swap in live calls later.
 *
 * To go live, replace BloomData.getFormGrowth / getSummary etc.
 * with fetches to your own backend proxy that holds the Klaviyo
 * private key (NEVER ship the key to the browser). See README.
 */
(function () {
  "use strict";

  const FORMS = [
    { id: "Xa1", name: "Welcome Pop-Up", base: 1180, momentum: 1.0,  color: "orange" },
    { id: "Yb2", name: "Footer Embed",   base: 540,  momentum: 0.62, color: "violet" },
    { id: "Zc3", name: "Exit Intent",    base: 760,  momentum: 0.81, color: "blue"   },
    { id: "Wd4", name: "Spin to Win",    base: 920,  momentum: 1.14, color: "rose"   },
  ];

  // Deterministic pseudo-random so the chart is stable across reloads.
  function seeded(seed) {
    let s = seed % 2147483647;
    if (s <= 0) s += 2147483646;
    return () => (s = (s * 16807) % 2147483647) / 2147483647;
  }

  function seriesFor(form, days) {
    const rnd = seeded(form.id.charCodeAt(0) * 97 + days);
    const out = [];
    let level = (form.base / 30) * form.momentum;
    const today = new Date("2026-05-25T00:00:00");
    for (let i = days - 1; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(d.getDate() - i);
      // gentle upward trend + weekly seasonality + noise
      const trend = (days - i) / days;
      const weekly = 1 + 0.18 * Math.sin((d.getDay() / 7) * Math.PI * 2);
      const noise = 0.78 + rnd() * 0.5;
      const value = Math.round(level * (0.7 + trend * 0.7) * weekly * noise);
      out.push({ date: d.toISOString().slice(0, 10), value });
    }
    return out;
  }

  function sum(arr) { return arr.reduce((a, b) => a + b.value, 0); }

  const BloomData = {
    listForms() {
      return FORMS.map((f) => ({ id: f.id, name: f.name, color: f.color }));
    },

    getFormGrowth(formId, days) {
      const form = FORMS.find((f) => f.id === formId) || FORMS[0];
      const series = seriesFor(form, days);
      const total = sum(series);
      const prev = sum(seriesFor(form, days).map((p, i) => ({ value: p.value * 0.86 })));
      const delta = ((total - prev) / prev) * 100;
      return { form, series, total, delta };
    },

    getSummary(days) {
      const all = FORMS.map((f) => this.getFormGrowth(f.id, days));
      const subscribers = all.reduce((a, b) => a + b.total, 0);
      return [
        { label: "New subscribers", value: subscribers, delta: 18.4, fmt: "int", spark: "orange" },
        { label: "Form submit rate", value: 7.9, delta: 2.1, fmt: "pct", spark: "violet" },
        { label: "Avg. order value", value: 64.2, delta: -1.3, fmt: "usd", spark: "blue" },
        { label: "Revenue / recipient", value: 1.87, delta: 9.6, fmt: "usd", spark: "rose" },
      ];
    },

    getFunnel(formId, days) {
      const { total } = this.getFormGrowth(formId, days);
      const views = Math.round(total / 0.079);
      const interacted = Math.round(views * 0.34);
      const submitted = total;
      const confirmed = Math.round(total * 0.91);
      return [
        { label: "Form views", value: views, color: "blue" },
        { label: "Interacted", value: interacted, color: "violet" },
        { label: "Submitted", value: submitted, color: "orange" },
        { label: "Confirmed", value: confirmed, color: "rose" },
      ];
    },

    getRanking(days) {
      return FORMS.map((f) => {
        const g = this.getFormGrowth(f.id, days);
        return { name: f.name, total: g.total, delta: g.delta, color: f.color };
      }).sort((a, b) => b.total - a.total);
    },

    getSources() {
      return [
        { label: "Signup forms", value: 58, color: "orange" },
        { label: "Checkout", value: 22, color: "violet" },
        { label: "API / Import", value: 13, color: "blue" },
        { label: "Manual", value: 7, color: "rose" },
      ];
    },
  };

  window.BloomData = BloomData;
})();

(function () {
  "use strict";

  const D = window.BloomData;
  const SVGNS = "http://www.w3.org/2000/svg";

  const COLORS = {
    orange: "#ff7a45",
    violet: "#7b6cf6",
    blue: "#4aa8ff",
    rose: "#ff6fae",
  };

  const state = { days: 30, formId: null };

  /* ---------------- formatting ---------------- */
  const fmt = {
    int: (n) => Math.round(n).toLocaleString("en-US"),
    pct: (n) => n.toFixed(1) + "%",
    usd: (n) => "$" + n.toFixed(2),
    short: (n) => (n >= 1000 ? (n / 1000).toFixed(n >= 10000 ? 0 : 1) + "k" : Math.round(n)),
    signed: (n) => (n >= 0 ? "+" : "") + n.toFixed(1) + "%",
  };

  // delta may be null (a brand-new form with no prior period to compare)
  function deltaLabel(delta) {
    if (delta == null) return { text: "New", up: true, arrow: "" };
    const up = delta >= 0;
    return { text: (up ? "↑ " : "↓ ") + fmt.signed(delta).replace("-", ""), up, arrow: "" };
  }

  const $ = (s) => document.querySelector(s);
  const el = (tag, attrs) => {
    const n = document.createElementNS(SVGNS, tag);
    for (const k in attrs) n.setAttribute(k, attrs[k]);
    return n;
  };

  /* ---------------- KPIs ---------------- */
  async function renderKpis() {
    const row = $("#kpiRow");
    row.innerHTML = "";
    const data = await D.getSummary(state.days);
    data.forEach((k) => {
      const up = k.delta >= 0;
      const card = document.createElement("div");
      card.className = "kpi";
      card.innerHTML = `
        <p class="kpi__label">${k.label}</p>
        <p class="kpi__value">${fmt[k.fmt](k.value)}</p>
        <p class="kpi__delta kpi__delta--${up ? "up" : "down"}">
          ${up ? "↑" : "↓"} ${fmt.signed(k.delta).replace("-", "")} vs prev
        </p>`;
      card.appendChild(miniSpark(k.spark));
      row.appendChild(card);
    });
  }

  function miniSpark(colorKey) {
    const w = 64, h = 30, n = 12;
    const rnd = (i) => 0.4 + 0.6 * Math.abs(Math.sin(i * 1.7 + colorKey.length));
    const pts = Array.from({ length: n }, (_, i) => [(i / (n - 1)) * w, h - rnd(i) * h * 0.8 - h * 0.1]);
    const svg = el("svg", { class: "kpi__spark", viewBox: `0 0 ${w} ${h}` });
    const d = pts.map((p, i) => (i ? "L" : "M") + p[0].toFixed(1) + " " + p[1].toFixed(1)).join(" ");
    svg.appendChild(el("path", {
      d, fill: "none", stroke: COLORS[colorKey], "stroke-width": 2,
      "stroke-linecap": "round", "stroke-linejoin": "round", opacity: 0.85,
    }));
    return svg;
  }

  /* ---------------- Hero growth chart ---------------- */
  async function renderGrowth() {
    const { form, series, total, delta } = await D.getFormGrowth(state.formId, state.days);
    $("#formTitle").textContent = form.name;
    $("#heroTotal").textContent = fmt.int(total);
    const hd = $("#heroDelta");
    const dl = deltaLabel(delta);
    hd.textContent = dl.text;
    hd.style.color = dl.up ? "#1f9d6a" : "#e0556b";

    const svg = $("#growthChart");
    svg.innerHTML = "";
    if (!series.length) return;
    const W = 760, H = 280, padB = 28, padT = 14;
    const color = COLORS[form.color] || COLORS.orange;
    const vals = series.map((d) => d.value);
    const max = Math.max(...vals) * 1.12 || 1;
    const min = Math.min(...vals) * 0.6;
    const x = (i) => (i / (series.length - 1)) * W;
    const span = max - min || 1;
    const y = (v) => padT + (H - padT - padB) * (1 - (v - min) / span);

    const defs = el("defs", {});
    const grad = el("linearGradient", { id: "areaGrad", x1: 0, y1: 0, x2: 0, y2: 1 });
    grad.appendChild(el("stop", { offset: "0%", "stop-color": color, "stop-opacity": 0.32 }));
    grad.appendChild(el("stop", { offset: "100%", "stop-color": color, "stop-opacity": 0 }));
    defs.appendChild(grad);
    svg.appendChild(defs);

    for (let g = 0; g <= 3; g++) {
      const gy = padT + ((H - padT - padB) / 3) * g;
      svg.appendChild(el("line", { x1: 0, x2: W, y1: gy, y2: gy, stroke: "rgba(26,23,34,0.06)", "stroke-width": 1 }));
    }

    const pts = series.map((d, i) => [x(i), y(d.value)]);
    const line = smoothPath(pts);
    svg.appendChild(el("path", { d: line + ` L ${W} ${H - padB} L 0 ${H - padB} Z`, fill: "url(#areaGrad)" }));
    const stroke = el("path", {
      d: line, fill: "none", stroke: color, "stroke-width": 3,
      "stroke-linecap": "round", "stroke-linejoin": "round",
    });
    svg.appendChild(stroke);

    const len = safeLen(stroke);
    stroke.style.strokeDasharray = len;
    stroke.style.strokeDashoffset = len;
    stroke.style.transition = "stroke-dashoffset 1.1s cubic-bezier(.2,.7,.2,1)";
    requestAnimationFrame(() => (stroke.style.strokeDashoffset = 0));

    const last = pts[pts.length - 1];
    svg.appendChild(el("circle", { cx: last[0], cy: last[1], r: 5, fill: color }));
    svg.appendChild(el("circle", { cx: last[0], cy: last[1], r: 5, fill: "none", stroke: color, "stroke-width": 2, opacity: 0.3 }));

    attachHover(svg, series, pts, color, W, H);
  }

  function smoothPath(pts) {
    if (pts.length < 2) return pts.length ? `M ${pts[0][0]} ${pts[0][1]}` : "";
    let d = `M ${pts[0][0]} ${pts[0][1]}`;
    for (let i = 0; i < pts.length - 1; i++) {
      const p0 = pts[i - 1] || pts[i], p1 = pts[i], p2 = pts[i + 1], p3 = pts[i + 2] || p2;
      const c1x = p1[0] + (p2[0] - p0[0]) / 6, c1y = p1[1] + (p2[1] - p0[1]) / 6;
      const c2x = p2[0] - (p3[0] - p1[0]) / 6, c2y = p2[1] - (p3[1] - p1[1]) / 6;
      d += ` C ${c1x} ${c1y} ${c2x} ${c2y} ${p2[0]} ${p2[1]}`;
    }
    return d;
  }
  function safeLen(p) { try { return p.getTotalLength(); } catch (e) { return 2000; } }

  function attachHover(svg, series, pts, color, W, H) {
    const tip = $("#chartTip");
    const guide = el("line", { y1: 0, y2: H, stroke: color, "stroke-width": 1, "stroke-dasharray": "4 4", opacity: 0 });
    const dot = el("circle", { r: 5, fill: "#fff", stroke: color, "stroke-width": 3, opacity: 0 });
    svg.appendChild(guide); svg.appendChild(dot);
    svg.addEventListener("mousemove", (e) => {
      const rect = svg.getBoundingClientRect();
      let i = Math.round(((e.clientX - rect.left) / rect.width) * (series.length - 1));
      i = Math.max(0, Math.min(series.length - 1, i));
      const [px, py] = pts[i];
      guide.setAttribute("x1", px); guide.setAttribute("x2", px); guide.setAttribute("opacity", 0.5);
      dot.setAttribute("cx", px); dot.setAttribute("cy", py); dot.setAttribute("opacity", 1);
      tip.hidden = false;
      tip.style.left = (px / W) * rect.width + "px";
      tip.style.top = (py / H) * rect.height + "px";
      const d = series[i];
      const label = d.date ? new Date(d.date).toLocaleDateString("en-US", { month: "short", day: "numeric" }) : "";
      tip.innerHTML = `${fmt.int(d.value)} signups<small>${label}</small>`;
    });
    svg.addEventListener("mouseleave", () => {
      tip.hidden = true; guide.setAttribute("opacity", 0); dot.setAttribute("opacity", 0);
    });
  }

  /* ---------------- Funnel ---------------- */
  async function renderFunnel() {
    const data = await D.getFunnel(state.formId, state.days);
    const max = data[0].value || 1;
    const wrap = $("#funnel");
    wrap.innerHTML = "";
    data.forEach((row, i) => {
      const div = document.createElement("div");
      div.className = "funnel__row";
      div.innerHTML = `
        <div class="funnel__top"><b>${row.label}</b><span>${fmt.int(row.value)}</span></div>
        <div class="funnel__bar"><div class="funnel__fill" style="width:${(row.value / max) * 100}%;
          background:linear-gradient(90deg, ${COLORS[row.color]}, ${COLORS[row.color]}aa);
          animation-delay:${i * 0.08}s"></div></div>`;
      wrap.appendChild(div);
    });
  }

  /* ---------------- Ranking ---------------- */
  async function renderRanking() {
    const list = $("#rankList");
    list.innerHTML = "";
    const data = await D.getRanking(state.days);
    data.forEach((r, i) => {
      const dl = deltaLabel(r.delta);
      const li = document.createElement("li");
      li.className = "rank";
      li.innerHTML = `
        <span class="rank__pos">${i + 1}</span>
        <div>
          <div class="rank__name" style="display:flex;align-items:center;gap:8px">
            <i style="width:8px;height:8px;border-radius:50%;background:${COLORS[r.color] || COLORS.orange}"></i>${r.name}
          </div>
          <div class="rank__meta">${fmt.int(r.total)} subscribers</div>
        </div>
        <div class="rank__chg ${dl.up ? "up" : "down"}">${dl.text}<small>${r.delta == null ? "form" : "vs prev"}</small></div>`;
      list.appendChild(li);
    });
  }

  /* ---------------- Donut ---------------- */
  async function renderDonut() {
    const data = await D.getSources();
    const svg = $("#donutChart");
    svg.innerHTML = "";
    const cx = 100, cy = 100, r = 78, sw = 26, C = 2 * Math.PI * r;
    let offset = 0;
    data.forEach((d) => {
      const frac = d.value / 100;
      const seg = el("circle", {
        cx, cy, r, fill: "none", stroke: COLORS[d.color], "stroke-width": sw,
        "stroke-dasharray": `${C * frac} ${C}`, "stroke-dashoffset": -offset, "stroke-linecap": "round",
      });
      seg.style.transition = "stroke-dasharray 0.9s ease";
      svg.appendChild(seg);
      offset += C * frac;
    });
    $("#donutPct").textContent = data[0].value + "%";
    const legend = $("#donutLegend");
    legend.innerHTML = "";
    data.forEach((d) => {
      const li = document.createElement("li");
      li.innerHTML = `<i style="background:${COLORS[d.color]}"></i>${d.label}<b>${d.value}%</b>`;
      legend.appendChild(li);
    });
  }

  /* ---------------- Status badge ---------------- */
  async function renderStatus() {
    const live = await D.isLive();
    const sub = $("#hintSub");
    const pulse = $("#hintPulse");
    if (sub) sub.textContent = live ? "Klaviyo · Live API" : "Demo data · no key";
    if (pulse) pulse.style.background = live ? "#2ec28a" : "#c9a13b";
  }

  /* ---------------- Controls ---------------- */
  async function initSelect() {
    const sel = $("#formSelect");
    const forms = await D.listForms();
    state.formId = forms.length ? forms[0].id : null;
    sel.innerHTML = "";
    forms.forEach((f) => {
      const o = document.createElement("option");
      o.value = f.id; o.textContent = f.name;
      sel.appendChild(o);
    });
    sel.addEventListener("change", (e) => {
      state.formId = e.target.value;
      renderGrowth(); renderFunnel();
    });
  }

  function initRange() {
    $("#rangeToggle").addEventListener("click", (e) => {
      const btn = e.target.closest(".range__btn");
      if (!btn) return;
      document.querySelectorAll(".range__btn").forEach((b) => b.classList.remove("range__btn--on"));
      btn.classList.add("range__btn--on");
      state.days = parseInt(btn.dataset.range, 10);
      renderAll();
    });
  }

  function renderAll() {
    renderKpis(); renderGrowth(); renderFunnel(); renderRanking(); renderDonut();
  }

  document.addEventListener("DOMContentLoaded", async () => {
    renderStatus();
    initRange();
    await initSelect();
    renderAll();
  });
})();

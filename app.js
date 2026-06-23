/*
 * Forge — workout tracker UI
 * Single-page, no build step. Renders views into #screen and drives
 * the active-workout logger, exercise picker, rest timer and stats.
 */
(function () {
  "use strict";

  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));

  /* ---------------- formatting ---------------- */
  const unit = () => DB.settings().unit;
  const fmt = {
    weight: (n) => (n || n === 0 ? `${round(n)}${unit()}` : "—"),
    num: (n) => Math.round(n).toLocaleString("en-US"),
    vol: (n) => Math.round(n).toLocaleString("en-US") + " " + unit(),
    clock: (sec) => {
      sec = Math.max(0, Math.round(sec));
      const m = Math.floor(sec / 60), s = sec % 60;
      return `${m}:${String(s).padStart(2, "0")}`;
    },
    dur: (sec) => {
      sec = Math.round(sec || 0);
      const h = Math.floor(sec / 3600), m = Math.floor((sec % 3600) / 60);
      return h ? `${h}h ${m}m` : `${m}m`;
    },
    date: (d) => new Date(d).toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" }),
    dateShort: (d) => new Date(d).toLocaleDateString("en-US", { month: "short", day: "numeric" }),
    relDay: (d) => {
      const days = Math.floor((Date.now() - new Date(d)) / 86400000);
      if (days <= 0) return "Today";
      if (days === 1) return "Yesterday";
      if (days < 7) return days + " days ago";
      return fmt.date(d);
    },
  };
  function round(n) { return Math.round((+n || 0) * 100) / 100; }
  const esc = (s) => String(s ?? "").replace(/[&<>"']/g, (c) =>
    ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const cap = (s) => s.charAt(0).toUpperCase() + s.slice(1);

  const MUSCLE_COLOR = {
    chest: "#ff6b5e", back: "#4aa8ff", shoulders: "#ffb340", legs: "#8b7cff",
    biceps: "#33d6a6", triceps: "#ff7ac0", core: "#ffd24a", cardio: "#5ad1ff",
  };
  const muscleDot = (m) =>
    `<i class="mdot" style="background:${MUSCLE_COLOR[m] || "#888"}"></i>`;

  /* ---------------- toast ---------------- */
  let toastT;
  function toast(msg) {
    const t = $("#toast");
    t.textContent = msg;
    t.hidden = false;
    clearTimeout(toastT);
    toastT = setTimeout(() => (t.hidden = true), 2200);
  }

  /* ====================================================================
     ROUTER
  ==================================================================== */
  const state = { view: "home" };

  function go(view) {
    state.view = view;
    $$(".tab").forEach((t) => t.classList.toggle("tab--on", t.dataset.view === view));
    render();
    $("#screen").scrollTop = 0;
  }

  function render() {
    const screen = $("#screen");
    const fn = VIEWS[state.view] || VIEWS.home;
    screen.innerHTML = fn();
    refreshResumeBar();
  }

  /* ====================================================================
     VIEWS
  ==================================================================== */
  const VIEWS = {
    home() {
      const wk = DB.statsForRange(7);
      const routines = DB.routines();
      const recent = DB.workouts().slice(0, 3);
      const name = "there";
      return `
        <header class="head">
          <div>
            <p class="head__eyebrow">${esc(new Date().toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" }))}</p>
            <h1 class="head__title">Ready to train?</h1>
          </div>
          <button class="iconbtn" data-view="exercises" title="Exercise library">
            <svg viewBox="0 0 24 24"><path d="M6 4v16M18 4v16M4 8h4M16 8h4M4 16h4M16 16h4M8 12h8"/></svg>
          </button>
        </header>

        <section class="statgrid">
          ${statCard("Workouts", wk.count, "this week")}
          ${statCard("Volume", fmt.num(wk.volume), unit() + " · 7d")}
          ${statCard("Sets", wk.sets, "this week")}
          ${statCard("Time", fmt.dur(wk.durationSec), "this week")}
        </section>

        <button class="bigbtn" data-action="quick-start">
          <svg viewBox="0 0 24 24"><path d="M12 5v14M5 12h14"/></svg>
          Start Empty Workout
        </button>

        <section class="block">
          <div class="block__head">
            <h2>Your Routines</h2>
            <button class="link" data-view="routines">Manage</button>
          </div>
          ${routines.length
            ? routines.slice(0, 4).map(routineCard).join("")
            : emptyState("No routines yet", "Build a reusable template so every session is one tap away.", "New Routine", "new-routine")}
        </section>

        <section class="block">
          <div class="block__head">
            <h2>Recent Workouts</h2>
            ${recent.length ? `<button class="link" data-view="history">See all</button>` : ""}
          </div>
          ${recent.length
            ? recent.map(workoutCard).join("")
            : `<p class="muted">Your finished workouts will show up here — and stay here. Nothing gets forgotten.</p>`}
        </section>
      `;
    },

    routines() {
      const routines = DB.routines();
      return `
        <header class="head">
          <div><h1 class="head__title">Routines</h1></div>
          <button class="iconbtn iconbtn--accent" data-action="new-routine" title="New routine">
            <svg viewBox="0 0 24 24"><path d="M12 5v14M5 12h14"/></svg>
          </button>
        </header>
        ${routines.length
          ? routines.map(routineCard).join("")
          : emptyState("No routines yet", "Create a template with your go-to exercises and target sets.", "New Routine", "new-routine")}
      `;
    },

    history() {
      const ws = DB.workouts();
      return `
        <header class="head"><div><h1 class="head__title">History</h1></div></header>
        ${ws.length
          ? ws.map(workoutCard).join("")
          : emptyState("No workouts logged", "Finish your first session and it'll live here forever.", "Start a Workout", "quick-start")}
      `;
    },

    exercises() {
      return `
        <header class="head">
          <button class="iconbtn" data-view="home" title="Back">
            <svg viewBox="0 0 24 24"><path d="M15 18l-6-6 6-6"/></svg>
          </button>
          <div style="flex:1"><h1 class="head__title">Exercises</h1></div>
          <button class="iconbtn iconbtn--accent" data-action="new-exercise" title="New exercise">
            <svg viewBox="0 0 24 24"><path d="M12 5v14M5 12h14"/></svg>
          </button>
        </header>
        <input class="search" id="exSearch" placeholder="Search exercises…" />
        <div class="chips" id="exFilters">
          <button class="chip chip--on" data-muscle="">All</button>
          ${DB.MUSCLES.map((m) => `<button class="chip" data-muscle="${m}">${muscleDot(m)}${cap(m)}</button>`).join("")}
        </div>
        <div id="exList">${exerciseListHTML("", "")}</div>
      `;
    },

    stats() {
      return statsViewHTML();
    },
  };

  /* ---------------- small card builders ---------------- */
  function statCard(label, value, sub) {
    return `<div class="stat">
      <p class="stat__val">${value}</p>
      <p class="stat__label">${label}</p>
      <p class="stat__sub">${sub}</p>
    </div>`;
  }

  function routineCard(r) {
    const names = r.exercises.map((e) => {
      const ex = DB.exercise(e.exerciseId);
      return ex ? ex.name : "—";
    });
    const preview = names.slice(0, 3).join(" · ") + (names.length > 3 ? ` +${names.length - 3} more` : "");
    return `<article class="rcard" data-routine="${r.id}">
      <div class="rcard__body">
        <h3>${esc(r.name)}</h3>
        <p class="muted">${esc(preview) || "No exercises"}</p>
      </div>
      <div class="rcard__actions">
        <button class="ghost" data-action="edit-routine" data-id="${r.id}">Edit</button>
        <button class="primary sm" data-action="start-routine" data-id="${r.id}">Start</button>
      </div>
    </article>`;
  }

  function workoutCard(w) {
    const v = DB.workoutVolume(w);
    const exLines = w.exercises.slice(0, 4).map((e) => {
      const ex = DB.exercise(e.exerciseId);
      const done = e.sets.filter((s) => s.done).length;
      return `<li>${muscleDot(ex ? ex.muscle : "")}<span>${done} × ${esc(e.name || (ex ? ex.name : "Exercise"))}</span></li>`;
    }).join("");
    const more = w.exercises.length > 4 ? `<li class="muted">+${w.exercises.length - 4} more</li>` : "";
    return `<article class="wcard" data-action="open-workout" data-id="${w.id}">
      <div class="wcard__head">
        <h3>${esc(w.name || "Workout")}</h3>
        <span class="wcard__when">${fmt.relDay(w.date)}</span>
      </div>
      <div class="wcard__meta">
        <span>⏱ ${fmt.dur(w.durationSec)}</span>
        <span>🏋 ${fmt.vol(v.volume)}</span>
        <span>≡ ${v.sets} sets</span>
      </div>
      <ul class="wcard__ex">${exLines}${more}</ul>
    </article>`;
  }

  function emptyState(title, body, btnLabel, action) {
    return `<div class="empty">
      <div class="empty__icon">🏋️</div>
      <h3>${esc(title)}</h3>
      <p>${esc(body)}</p>
      ${btnLabel ? `<button class="primary" data-action="${action}">${esc(btnLabel)}</button>` : ""}
    </div>`;
  }

  /* ====================================================================
     EXERCISE LIBRARY VIEW
  ==================================================================== */
  function exerciseListHTML(query, muscle) {
    let list = DB.exercises();
    const q = query.trim().toLowerCase();
    if (q) list = list.filter((e) => e.name.toLowerCase().includes(q));
    if (muscle) list = list.filter((e) => e.muscle === muscle);
    if (!list.length) return `<p class="muted" style="padding:24px 4px">No matches.</p>`;
    return list.map((e) => `
      <button class="exrow" data-action="open-exercise" data-id="${e.id}">
        ${muscleDot(e.muscle)}
        <div class="exrow__body">
          <span class="exrow__name">${esc(e.name)}</span>
          <span class="exrow__sub">${cap(e.muscle)} · ${cap(e.equipment)}${e.custom ? " · custom" : ""}</span>
        </div>
        <svg class="exrow__chev" viewBox="0 0 24 24"><path d="M9 6l6 6-6 6"/></svg>
      </button>`).join("");
  }

  function bindExerciseView() {
    const search = $("#exSearch");
    if (!search) return;
    let muscle = "";
    const update = () => ($("#exList").innerHTML = exerciseListHTML(search.value, muscle));
    search.addEventListener("input", update);
    $("#exFilters").addEventListener("click", (e) => {
      const chip = e.target.closest(".chip");
      if (!chip) return;
      muscle = chip.dataset.muscle;
      $$("#exFilters .chip").forEach((c) => c.classList.toggle("chip--on", c === chip));
      update();
    });
  }

  /* ====================================================================
     EXERCISE DETAIL (modal)
  ==================================================================== */
  function openExercise(id) {
    const ex = DB.exercise(id);
    if (!ex) return;
    const pr = DB.records(id);
    const prog = DB.exerciseProgress(id);
    const chart = prog.length > 1
      ? lineChart(prog.map((p) => ({ x: p.date, y: p.e1rm })), MUSCLE_COLOR[ex.muscle])
      : `<p class="muted" style="padding:16px 0">Log this exercise a few times to see your strength trend.</p>`;
    openModal(`
      <div class="sheet__head">
        ${muscleDot(ex.muscle)}
        <h2>${esc(ex.name)}</h2>
        <button class="x" data-close>✕</button>
      </div>
      <p class="muted">${cap(ex.muscle)} · ${cap(ex.equipment)}</p>

      <div class="prgrid">
        ${prStat("Heaviest", fmt.weight(pr.heaviest))}
        ${prStat("Best e1RM", pr.best1rm ? fmt.weight(pr.best1rm) : "—")}
        ${prStat("Best set vol", pr.bestVolumeSet ? fmt.num(pr.bestVolumeSet) : "—")}
        ${prStat("Most reps", pr.bestReps || "—")}
      </div>

      <h3 class="sheet__sub">Estimated 1RM trend</h3>
      ${chart}

      <h3 class="sheet__sub">Recent history</h3>
      ${historyForExercise(id)}

      ${ex.custom ? `<button class="danger wide" data-action="delete-exercise" data-id="${id}" style="margin-top:18px">Delete exercise</button>` : ""}
    `);
  }

  function prStat(label, val) {
    return `<div class="prstat"><span class="prstat__v">${val}</span><span class="prstat__l">${label}</span></div>`;
  }

  function historyForExercise(id) {
    const rows = [];
    for (const w of DB.workouts()) {
      const entry = w.exercises.find((e) => e.exerciseId === id);
      if (!entry) continue;
      const sets = entry.sets.filter((s) => s.done)
        .map((s) => `${round(s.weight)}${unit()}×${s.reps}`).join(", ");
      if (sets) rows.push(`<div class="histrow"><span>${fmt.dateShort(w.date)}</span><span class="muted">${sets}</span></div>`);
      if (rows.length >= 8) break;
    }
    return rows.length ? rows.join("") : `<p class="muted">No completed sets yet.</p>`;
  }

  /* ====================================================================
     STATS VIEW
  ==================================================================== */
  let statsRange = 7;
  let statsExerciseId = null;

  function statsViewHTML() {
    const s = DB.statsForRange(statsRange === 0 ? 36500 : statsRange);
    const weekly = DB.weeklyWorkoutCounts(8);
    const exWithData = DB.exercises().filter((e) => DB.exerciseProgress(e.id).length);
    if (!statsExerciseId && exWithData.length) statsExerciseId = exWithData[0].id;
    const prog = statsExerciseId ? DB.exerciseProgress(statsExerciseId) : [];
    const set = DB.settings();

    return `
      <header class="head"><div><h1 class="head__title">Stats</h1></div></header>

      <div class="chips" id="rangeChips">
        ${[[7, "7 days"], [30, "30 days"], [0, "All time"]].map(([v, l]) =>
          `<button class="chip ${statsRange === v ? "chip--on" : ""}" data-range="${v}">${l}</button>`).join("")}
      </div>

      <section class="statgrid">
        ${statCard("Workouts", s.count, "")}
        ${statCard("Volume", fmt.num(s.volume), unit())}
        ${statCard("Sets", s.sets, "")}
        ${statCard("Time", fmt.dur(s.durationSec), "")}
      </section>

      <section class="block">
        <div class="block__head"><h2>Workouts per week</h2></div>
        ${barChart(weekly.map((w) => ({ label: fmt.dateShort(w.label), value: w.count })))}
      </section>

      <section class="block">
        <div class="block__head"><h2>Exercise progress</h2></div>
        ${exWithData.length ? `
          <div class="select">
            <select id="statsEx">
              ${exWithData.map((e) => `<option value="${e.id}" ${e.id === statsExerciseId ? "selected" : ""}>${esc(e.name)}</option>`).join("")}
            </select>
          </div>
          ${prog.length > 1
            ? lineChart(prog.map((p) => ({ x: p.date, y: p.e1rm })), "#33d6a6")
            : `<p class="muted" style="padding:14px 0">Need at least two sessions of this exercise to chart it.</p>`}
        ` : `<p class="muted">Log some workouts to unlock progress charts.</p>`}
      </section>

      <section class="block">
        <div class="block__head"><h2>Settings</h2></div>
        <div class="setrow">
          <span>Units</span>
          <div class="seg" id="unitSeg">
            <button class="${set.unit === "kg" ? "on" : ""}" data-unit="kg">kg</button>
            <button class="${set.unit === "lb" ? "on" : ""}" data-unit="lb">lb</button>
          </div>
        </div>
        <div class="setrow">
          <span>Default rest timer</span>
          <div class="seg" id="restSeg">
            ${[60, 90, 120, 180].map((v) =>
              `<button class="${set.restDefault === v ? "on" : ""}" data-rest-default="${v}">${v}s</button>`).join("")}
          </div>
        </div>
        <div class="setrow">
          <span>Backup your data</span>
          <div class="setrow__btns">
            <button class="ghost sm" data-action="export">Export</button>
            <button class="ghost sm" data-action="import">Import</button>
          </div>
        </div>
        <button class="danger wide" data-action="reset" style="margin-top:10px">Reset all data</button>
        <p class="muted tiny" style="margin-top:10px">Everything is stored privately on this device. No account, no cloud, no social. Export regularly to keep a backup.</p>
      </section>
    `;
  }

  function bindStatsView() {
    const chips = $("#rangeChips");
    if (!chips) return;
    chips.addEventListener("click", (e) => {
      const c = e.target.closest(".chip");
      if (!c) return;
      statsRange = +c.dataset.range;
      render();
    });
    const sel = $("#statsEx");
    if (sel) sel.addEventListener("change", (e) => { statsExerciseId = e.target.value; render(); });
    const unitSeg = $("#unitSeg");
    if (unitSeg) unitSeg.addEventListener("click", (e) => {
      const b = e.target.closest("[data-unit]"); if (!b) return;
      DB.setUnit(b.dataset.unit); render(); toast("Units set to " + b.dataset.unit);
    });
    const restSeg = $("#restSeg");
    if (restSeg) restSeg.addEventListener("click", (e) => {
      const b = e.target.closest("[data-rest-default]"); if (!b) return;
      DB.setRestDefault(+b.dataset.restDefault); render();
    });
  }

  /* ====================================================================
     CHARTS (hand-built SVG)
  ==================================================================== */
  function lineChart(points, color) {
    if (!points.length) return "";
    const W = 320, H = 150, pad = 24;
    const ys = points.map((p) => p.y);
    const min = Math.min(...ys) * 0.95, max = Math.max(...ys) * 1.05 || 1;
    const span = max - min || 1;
    const x = (i) => pad + (i / Math.max(1, points.length - 1)) * (W - pad * 2);
    const y = (v) => pad + (1 - (v - min) / span) * (H - pad * 2);
    const d = points.map((p, i) => (i ? "L" : "M") + x(i).toFixed(1) + " " + y(p.y).toFixed(1)).join(" ");
    const area = d + ` L ${x(points.length - 1)} ${H - pad} L ${x(0)} ${H - pad} Z`;
    const last = points[points.length - 1];
    return `<svg class="chart" viewBox="0 0 ${W} ${H}" preserveAspectRatio="none">
      <defs><linearGradient id="lg" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stop-color="${color}" stop-opacity="0.28"/>
        <stop offset="100%" stop-color="${color}" stop-opacity="0"/>
      </linearGradient></defs>
      <path d="${area}" fill="url(#lg)"/>
      <path d="${d}" fill="none" stroke="${color}" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/>
      <circle cx="${x(points.length - 1)}" cy="${y(last.y)}" r="4" fill="${color}"/>
    </svg>
    <div class="chart__cap"><span>${fmt.dateShort(points[0].x)}</span><span>${last.y}${unit()} now</span><span>${fmt.dateShort(last.x)}</span></div>`;
  }

  function barChart(bars) {
    const max = Math.max(1, ...bars.map((b) => b.value));
    return `<div class="bars">${bars.map((b) => `
      <div class="bar">
        <div class="bar__col"><div class="bar__fill" style="height:${(b.value / max) * 100}%">${b.value ? `<span>${b.value}</span>` : ""}</div></div>
        <span class="bar__label">${b.label}</span>
      </div>`).join("")}</div>`;
  }

  /* ====================================================================
     EXERCISE PICKER (multi-select overlay)
  ==================================================================== */
  let pickerCb = null;
  let pickerSelected = new Set();
  let pickerNode = null;

  function openPicker(onPick) {
    pickerCb = onPick;
    pickerSelected = new Set();
    // Build a fresh overlay each time so it can stack over the logger or
    // the routine editor without clobbering their DOM or leaking listeners.
    const p = document.createElement("section");
    p.className = "picker";
    document.body.appendChild(p);
    pickerNode = p;
    p.innerHTML = `
      <header class="logger__bar">
        <button class="ghost" data-pick-cancel>Cancel</button>
        <h2>Add Exercises</h2>
        <button class="primary sm" data-pick-done>Add <span id="pickCount"></span></button>
      </header>
      <div class="logger__body">
        <input class="search" id="pickSearch" placeholder="Search exercises…" autofocus />
        <div class="chips" id="pickFilters">
          <button class="chip chip--on" data-muscle="">All</button>
          ${DB.MUSCLES.map((m) => `<button class="chip" data-muscle="${m}">${cap(m)}</button>`).join("")}
        </div>
        <button class="newex" data-pick-new>+ Create new exercise</button>
        <div id="pickList"></div>
      </div>`;
    let muscle = "";
    const renderList = () => {
      const q = $("#pickSearch").value.trim().toLowerCase();
      let list = DB.exercises();
      if (q) list = list.filter((e) => e.name.toLowerCase().includes(q));
      if (muscle) list = list.filter((e) => e.muscle === muscle);
      $("#pickList").innerHTML = list.map((e) => `
        <button class="pickrow ${pickerSelected.has(e.id) ? "pickrow--on" : ""}" data-pick="${e.id}">
          ${muscleDot(e.muscle)}
          <div class="exrow__body">
            <span class="exrow__name">${esc(e.name)}</span>
            <span class="exrow__sub">${cap(e.muscle)} · ${cap(e.equipment)}</span>
          </div>
          <span class="pickcheck">${pickerSelected.has(e.id) ? "✓" : ""}</span>
        </button>`).join("") || `<p class="muted" style="padding:20px 4px">No matches.</p>`;
      $("#pickCount").textContent = pickerSelected.size ? `(${pickerSelected.size})` : "";
    };
    $("#pickSearch").addEventListener("input", renderList);
    $("#pickFilters").addEventListener("click", (e) => {
      const c = e.target.closest(".chip"); if (!c) return;
      muscle = c.dataset.muscle;
      $$("#pickFilters .chip").forEach((x) => x.classList.toggle("chip--on", x === c));
      renderList();
    });
    p.onclick = pickerClick;
    function pickerClick(e) {
      const row = e.target.closest("[data-pick]");
      if (row) {
        const id = row.dataset.pick;
        pickerSelected.has(id) ? pickerSelected.delete(id) : pickerSelected.add(id);
        renderList();
        return;
      }
      if (e.target.closest("[data-pick-cancel]")) { closePicker(); }
      if (e.target.closest("[data-pick-new]")) {
        newExerciseModal((ex) => { pickerSelected.add(ex.id); renderList(); });
      }
      if (e.target.closest("[data-pick-done]")) {
        const ids = Array.from(pickerSelected);
        closePicker();
        if (ids.length && pickerCb) pickerCb(ids);
      }
    }
    renderList();
    setTimeout(() => { const s = p.querySelector("#pickSearch"); if (s) s.focus(); }, 60);
  }
  function closePicker() {
    if (pickerNode) { pickerNode.remove(); pickerNode = null; }
  }

  /* ====================================================================
     NEW / EDIT EXERCISE
  ==================================================================== */
  function newExerciseModal(after) {
    openModal(`
      <div class="sheet__head"><h2>New Exercise</h2><button class="x" data-close>✕</button></div>
      <label class="field"><span>Name</span><input id="neName" placeholder="e.g. Cable Pullover" /></label>
      <label class="field"><span>Muscle group</span>
        <select id="neMuscle">${DB.MUSCLES.map((m) => `<option value="${m}">${cap(m)}</option>`).join("")}</select>
      </label>
      <label class="field"><span>Equipment</span>
        <select id="neEquip">${["barbell", "dumbbell", "machine", "cable", "bodyweight", "other"].map((m) => `<option value="${m}">${cap(m)}</option>`).join("")}</select>
      </label>
      <button class="primary wide" id="neSave">Create exercise</button>
    `);
    $("#neSave").addEventListener("click", () => {
      const name = $("#neName").value.trim();
      if (!name) { toast("Give it a name"); return; }
      const ex = DB.addExercise(name, $("#neMuscle").value, $("#neEquip").value);
      closeModal();
      toast("Exercise created");
      if (after) after(ex);
      else if (state.view === "exercises") render();
    });
    setTimeout(() => { const n = $("#neName"); if (n) n.focus(); }, 50);
  }

  /* ====================================================================
     ROUTINE EDITOR
  ==================================================================== */
  function editRoutine(routineId) {
    const existing = routineId ? DB.routine(routineId) : null;
    const draft = existing
      ? JSON.parse(JSON.stringify(existing))
      : { name: "", exercises: [] };

    const p = $("#picker");
    p.hidden = false;

    function paint() {
      p.innerHTML = `
        <header class="logger__bar">
          <button class="ghost" data-r-cancel>Cancel</button>
          <h2>${existing ? "Edit" : "New"} Routine</h2>
          <button class="primary sm" data-r-save>Save</button>
        </header>
        <div class="logger__body">
          <input class="bigfield" id="rName" placeholder="Routine name" value="${esc(draft.name)}" />
          ${draft.exercises.length ? draft.exercises.map((e, i) => {
            const ex = DB.exercise(e.exerciseId);
            return `<div class="redit">
              ${muscleDot(ex ? ex.muscle : "")}
              <div class="redit__body">
                <span class="exrow__name">${esc(ex ? ex.name : "Exercise")}</span>
                <div class="redit__sets">
                  <button class="stepper" data-r-dec="${i}">−</button>
                  <span>${e.targetSets} sets</span>
                  <button class="stepper" data-r-inc="${i}">+</button>
                </div>
              </div>
              <button class="x" data-r-del="${i}">✕</button>
            </div>`;
          }).join("") : `<p class="muted" style="padding:8px 2px">No exercises yet.</p>`}
          <button class="newex" data-r-add>+ Add exercises</button>
        </div>`;
      $("#rName").addEventListener("input", (e) => (draft.name = e.target.value));
    }

    p.onclick = (e) => {
      const inc = e.target.closest("[data-r-inc]");
      const dec = e.target.closest("[data-r-dec]");
      const del = e.target.closest("[data-r-del]");
      if (inc) { draft.exercises[+inc.dataset.rInc].targetSets++; paint(); return; }
      if (dec) { const ex = draft.exercises[+dec.dataset.rDec]; ex.targetSets = Math.max(1, ex.targetSets - 1); paint(); return; }
      if (del) { draft.exercises.splice(+del.dataset.rDel, 1); paint(); return; }
      if (e.target.closest("[data-r-add]")) {
        draft.name = $("#rName").value;
        openPicker((ids) => {
          ids.forEach((id) => draft.exercises.push({ exerciseId: id, targetSets: 3 }));
          paint();
        });
        return;
      }
      if (e.target.closest("[data-r-cancel]")) { closeRoutineEditor(); return; }
      if (e.target.closest("[data-r-save]")) {
        draft.name = $("#rName").value.trim() || "Untitled Routine";
        if (!draft.exercises.length) { toast("Add at least one exercise"); return; }
        if (existing) draft.id = existing.id;
        DB.saveRoutine(draft);
        closeRoutineEditor();
        toast("Routine saved");
        render();
        return;
      }
    };
    function closeRoutineEditor() { p.hidden = true; p.innerHTML = ""; p.onclick = null; }
    paint();
  }

  /* ====================================================================
     ACTIVE WORKOUT LOGGER
  ==================================================================== */
  let active = null;        // current workout object
  let timerInt = null;

  function newSet(prev) {
    return { weight: prev ? prev.weight : "", reps: prev ? prev.reps : "", done: false };
  }

  function startEmptyWorkout() {
    active = { id: DB.uid(), name: defaultWorkoutName(), startedAt: Date.now(), exercises: [] };
    DB.setActiveWorkout(active);
    openLogger();
    openPicker(addExercisesToActive);
  }

  function startFromRoutine(routineId) {
    const r = DB.routine(routineId);
    if (!r) return;
    active = {
      id: DB.uid(), name: r.name, startedAt: Date.now(), routineId: r.id,
      exercises: r.exercises.map((re) => {
        const ex = DB.exercise(re.exerciseId);
        const last = DB.lastPerformance(re.exerciseId);
        const n = re.targetSets || 3;
        return {
          exerciseId: re.exerciseId,
          name: ex ? ex.name : "Exercise",
          muscle: ex ? ex.muscle : "",
          sets: Array.from({ length: n }, (_, i) => newSet(last && last.sets[i])),
        };
      }),
    };
    DB.setActiveWorkout(active);
    openLogger();
  }

  function resumeWorkout() {
    active = DB.activeWorkout();
    if (active) openLogger();
  }

  function defaultWorkoutName() {
    const h = new Date().getHours();
    const part = h < 12 ? "Morning" : h < 17 ? "Afternoon" : "Evening";
    return part + " Workout";
  }

  function addExercisesToActive(ids) {
    if (!active) return;
    ids.forEach((id) => {
      const ex = DB.exercise(id);
      const last = DB.lastPerformance(id);
      active.exercises.push({
        exerciseId: id,
        name: ex ? ex.name : "Exercise",
        muscle: ex ? ex.muscle : "",
        sets: [newSet(last && last.sets[0])],
      });
    });
    persistActive();
    paintLogger();
  }

  function openLogger() {
    const l = $("#logger");
    l.hidden = false;
    document.body.classList.add("logging");
    paintLogger();
    startTimer();
  }

  function closeLogger() {
    const l = $("#logger");
    l.hidden = true;
    l.innerHTML = "";
    document.body.classList.remove("logging");
    stopTimer();
    stopRest();
    refreshResumeBar();
  }

  function startTimer() {
    stopTimer();
    timerInt = setInterval(() => {
      const t = $("#logTime");
      if (t && active) t.textContent = fmt.clock((Date.now() - active.startedAt) / 1000);
    }, 1000);
  }
  function stopTimer() { if (timerInt) clearInterval(timerInt); timerInt = null; }

  function liveStats() {
    let vol = 0, sets = 0;
    active.exercises.forEach((e) => e.sets.forEach((s) => {
      if (s.done) { vol += (+s.weight || 0) * (+s.reps || 0); sets++; }
    }));
    return { vol, sets };
  }

  function paintLogger() {
    const l = $("#logger");
    const ls = liveStats();
    l.innerHTML = `
      <header class="logger__bar">
        <button class="ghost" data-log-min title="Minimize">▾</button>
        <div class="logger__title">
          <input class="logname" id="logName" value="${esc(active.name)}" />
          <div class="logger__sub">
            <span id="logTime">${fmt.clock((Date.now() - active.startedAt) / 1000)}</span>
            <span>· ${ls.sets} sets · ${fmt.vol(ls.vol)}</span>
          </div>
        </div>
        <button class="primary sm" data-log-finish>Finish</button>
      </header>

      <div class="logger__body" id="logBody">
        ${active.exercises.map(exerciseBlock).join("") || `<p class="muted" style="padding:18px 2px">No exercises yet — add some below.</p>`}
        <button class="newex" data-log-add>+ Add exercises</button>
        <button class="discard" data-log-discard>Discard workout</button>
      </div>`;
    $("#logName").addEventListener("change", (e) => { active.name = e.target.value.trim() || defaultWorkoutName(); persistActive(); });
  }

  function exerciseBlock(ex, exIdx) {
    const last = DB.lastPerformance(ex.exerciseId);
    const rows = ex.sets.map((s, i) => {
      const prev = last && last.sets[i]
        ? `${round(last.sets[i].weight)}${unit()}×${last.sets[i].reps}`
        : "—";
      return `<div class="setrow2 ${s.done ? "setrow2--done" : ""}" data-ex="${exIdx}" data-set="${i}">
        <span class="setrow2__n">${i + 1}</span>
        <span class="setrow2__prev" title="Last time">${prev}</span>
        <input class="setrow2__in" inputmode="decimal" data-field="weight" data-ex="${exIdx}" data-set="${i}"
          value="${s.weight}" placeholder="${last && last.sets[i] ? round(last.sets[i].weight) : "0"}" />
        <input class="setrow2__in" inputmode="numeric" data-field="reps" data-ex="${exIdx}" data-set="${i}"
          value="${s.reps}" placeholder="${last && last.sets[i] ? last.sets[i].reps : "0"}" />
        <button class="setrow2__chk" data-toggle data-ex="${exIdx}" data-set="${i}">✓</button>
      </div>`;
    }).join("");
    return `<article class="exblock">
      <div class="exblock__head">
        ${muscleDot(ex.muscle)}
        <h3>${esc(ex.name)}</h3>
        <button class="x" data-ex-del="${exIdx}">✕</button>
      </div>
      <div class="setrow2 setrow2--head">
        <span class="setrow2__n">#</span>
        <span class="setrow2__prev">Last</span>
        <span>${unit()}</span><span>Reps</span><span></span>
      </div>
      ${rows}
      <button class="addset" data-set-add="${exIdx}">+ Add set</button>
    </article>`;
  }

  function updateLogHeader() {
    const ls = liveStats();
    const sub = $(".logger__sub");
    if (sub) sub.innerHTML = `<span id="logTime">${fmt.clock((Date.now() - active.startedAt) / 1000)}</span><span>· ${ls.sets} sets · ${fmt.vol(ls.vol)}</span>`;
  }

  function persistActive() { if (active) DB.setActiveWorkout(active); }

  // delegated events inside logger
  function loggerClick(e) {
    const t = e.target;
    const toggle = t.closest("[data-toggle]");
    if (toggle) {
      const ex = active.exercises[+toggle.dataset.ex];
      const set = ex.sets[+toggle.dataset.set];
      set.done = !set.done;
      const row = toggle.closest(".setrow2");
      row.classList.toggle("setrow2--done", set.done);
      persistActive();
      updateLogHeader();
      if (set.done) startRest();
      return;
    }
    const addSet = t.closest("[data-set-add]");
    if (addSet) {
      const ex = active.exercises[+addSet.dataset.setAdd];
      ex.sets.push(newSet(ex.sets[ex.sets.length - 1]));
      persistActive(); paintLogger();
      return;
    }
    const delEx = t.closest("[data-ex-del]");
    if (delEx) {
      active.exercises.splice(+delEx.dataset.exDel, 1);
      persistActive(); paintLogger();
      return;
    }
    if (t.closest("[data-log-add]")) { openPicker(addExercisesToActive); return; }
    if (t.closest("[data-log-min]")) { closeLoggerKeepActive(); return; }
    if (t.closest("[data-log-finish]")) { finishWorkout(); return; }
    if (t.closest("[data-log-discard]")) { discardWorkout(); return; }
  }

  function loggerInput(e) {
    const inp = e.target.closest("[data-field]");
    if (!inp) return;
    const ex = active.exercises[+inp.dataset.ex];
    const set = ex.sets[+inp.dataset.set];
    set[inp.dataset.field] = inp.value;
    persistActive();
  }

  function closeLoggerKeepActive() {
    // minimize: hide overlay but keep active workout running
    $("#logger").hidden = true;
    document.body.classList.remove("logging");
    stopTimer();
    refreshResumeBar();
  }

  function finishWorkout() {
    const ls = liveStats();
    if (ls.sets === 0) {
      confirmModal("Finish with no completed sets?",
        "Nothing will be saved to your history.",
        "Discard", () => { discardConfirmed(); });
      return;
    }
    // keep only sets that were completed
    const saved = {
      id: active.id,
      name: active.name,
      date: new Date().toISOString(),
      durationSec: Math.round((Date.now() - active.startedAt) / 1000),
      exercises: active.exercises
        .map((e) => ({
          exerciseId: e.exerciseId,
          name: e.name,
          sets: e.sets.filter((s) => s.done).map((s) => ({ weight: +s.weight || 0, reps: +s.reps || 0, done: true })),
        }))
        .filter((e) => e.sets.length),
    };
    DB.addWorkout(saved);
    active = null;
    DB.setActiveWorkout(null);
    closeLogger();
    go("home");
    toast(`Workout saved · ${ls.sets} sets · ${fmt.vol(ls.vol)}`);
  }

  function discardWorkout() {
    confirmModal("Discard this workout?", "This can't be undone.", "Discard", discardConfirmed);
  }
  function discardConfirmed() {
    active = null;
    DB.setActiveWorkout(null);
    closeLogger();
    render();
  }

  /* ====================================================================
     REST TIMER
  ==================================================================== */
  let restInt = null, restLeft = 0;
  function startRest() {
    restLeft = DB.settings().restDefault || 90;
    showRest();
    stopRestInterval();
    restInt = setInterval(() => {
      restLeft--;
      if (restLeft <= 0) { finishRest(); return; }
      $("#restTime").textContent = fmt.clock(restLeft);
    }, 1000);
  }
  function showRest() {
    const r = $("#rest");
    r.hidden = false;
    $("#restTime").textContent = fmt.clock(restLeft);
  }
  function finishRest() {
    stopRestInterval();
    if (navigator.vibrate) navigator.vibrate(200);
    const r = $("#rest");
    r.classList.add("rest--done");
    $("#restTime").textContent = "Done";
    setTimeout(() => { r.hidden = true; r.classList.remove("rest--done"); }, 1500);
  }
  function stopRest() { stopRestInterval(); $("#rest").hidden = true; }
  function stopRestInterval() { if (restInt) clearInterval(restInt); restInt = null; }

  /* ====================================================================
     MODALS
  ==================================================================== */
  function openModal(html) {
    const m = $("#modal");
    m.hidden = false;
    m.innerHTML = `<div class="modal__backdrop" data-close></div><div class="sheet">${html}</div>`;
  }
  function closeModal() { const m = $("#modal"); m.hidden = true; m.innerHTML = ""; }

  function confirmModal(title, body, confirmLabel, onConfirm) {
    openModal(`
      <div class="sheet__head"><h2>${esc(title)}</h2></div>
      <p class="muted">${esc(body)}</p>
      <div class="modal__row">
        <button class="ghost wide" data-close>Cancel</button>
        <button class="danger wide" id="confirmYes">${esc(confirmLabel)}</button>
      </div>`);
    $("#confirmYes").addEventListener("click", () => { closeModal(); onConfirm(); });
  }

  function openWorkoutDetail(id) {
    const w = DB.workout(id);
    if (!w) return;
    const v = DB.workoutVolume(w);
    openModal(`
      <div class="sheet__head"><h2>${esc(w.name || "Workout")}</h2><button class="x" data-close>✕</button></div>
      <p class="muted">${fmt.date(w.date)} · ${fmt.dur(w.durationSec)} · ${fmt.vol(v.volume)} · ${v.sets} sets</p>
      ${w.exercises.map((e) => {
        const ex = DB.exercise(e.exerciseId);
        return `<div class="detx">
          <div class="detx__head">${muscleDot(ex ? ex.muscle : "")}<b>${esc(e.name || (ex ? ex.name : "Exercise"))}</b></div>
          ${e.sets.map((s, i) => `<div class="detx__set"><span>${i + 1}</span><span>${round(s.weight)}${unit()} × ${s.reps}</span></div>`).join("")}
        </div>`;
      }).join("")}
      <div class="modal__row" style="margin-top:16px">
        <button class="ghost wide" data-action="repeat-workout" data-id="${w.id}">Repeat</button>
        <button class="danger wide" data-action="delete-workout" data-id="${w.id}">Delete</button>
      </div>`);
  }

  function repeatWorkout(id) {
    const w = DB.workout(id);
    if (!w) return;
    active = {
      id: DB.uid(), name: w.name, startedAt: Date.now(),
      exercises: w.exercises.map((e) => {
        const ex = DB.exercise(e.exerciseId);
        return {
          exerciseId: e.exerciseId,
          name: e.name || (ex ? ex.name : "Exercise"),
          muscle: ex ? ex.muscle : "",
          sets: e.sets.map((s) => ({ weight: s.weight, reps: s.reps, done: false })),
        };
      }),
    };
    DB.setActiveWorkout(active);
    closeModal();
    openLogger();
  }

  /* ====================================================================
     IMPORT / EXPORT
  ==================================================================== */
  function exportData() {
    const blob = new Blob([DB.exportJSON()], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `forge-backup-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
    toast("Backup downloaded");
  }
  function importData() {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = "application/json";
    input.onchange = () => {
      const file = input.files[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = () => {
        try { DB.importJSON(reader.result); render(); toast("Backup restored"); }
        catch (e) { toast("Couldn't read that file"); }
      };
      reader.readAsText(file);
    };
    input.click();
  }

  /* ====================================================================
     RESUME BAR
  ==================================================================== */
  function refreshResumeBar() {
    const bar = $("#resumeBar");
    const a = DB.activeWorkout();
    const loggerOpen = !$("#logger").hidden;
    if (a && !loggerOpen) {
      const ls = (() => {
        let sets = 0;
        a.exercises.forEach((e) => e.sets.forEach((s) => s.done && sets++));
        return sets;
      })();
      bar.hidden = false;
      bar.innerHTML = `<span class="dot"></span> Resume “${esc(a.name)}” · ${ls} sets logged`;
    } else {
      bar.hidden = true;
    }
  }

  /* ====================================================================
     GLOBAL EVENT WIRING
  ==================================================================== */
  function handleAction(action, idEl) {
    const id = idEl ? idEl.dataset.id : null;
    switch (action) {
      case "quick-start": startEmptyWorkout(); break;
      case "new-routine": editRoutine(null); break;
      case "edit-routine": editRoutine(id); break;
      case "start-routine": startFromRoutine(id); break;
      case "new-exercise": newExerciseModal(); break;
      case "open-exercise": openExercise(id); break;
      case "delete-exercise":
        confirmModal("Delete exercise?", "Past workouts keep their records.", "Delete", () => {
          DB.deleteExercise(id); closeModal(); render(); toast("Deleted");
        });
        break;
      case "open-workout": openWorkoutDetail(id); break;
      case "delete-workout":
        confirmModal("Delete workout?", "This removes it from your history.", "Delete", () => {
          DB.deleteWorkout(id); closeModal(); render(); toast("Deleted");
        });
        break;
      case "repeat-workout": repeatWorkout(id); break;
      case "export": exportData(); break;
      case "import": importData(); break;
      case "reset":
        confirmModal("Reset everything?", "Deletes all routines, workouts and custom exercises on this device.", "Reset", () => {
          DB.resetAll(); closeModal(); statsExerciseId = null; go("home"); toast("Reset complete");
        });
        break;
    }
  }

  function init() {
    // tabbar
    $(".tabbar").addEventListener("click", (e) => {
      const tab = e.target.closest(".tab");
      if (!tab) return;
      if (tab.dataset.action) { handleAction(tab.dataset.action); return; }
      if (tab.dataset.view) go(tab.dataset.view);
    });

    // global delegated actions + view switches inside screen
    $("#screen").addEventListener("click", (e) => {
      const viewBtn = e.target.closest("[data-view]");
      if (viewBtn && !e.target.closest("[data-action]")) { go(viewBtn.dataset.view); return; }
      const act = e.target.closest("[data-action]");
      if (act) { handleAction(act.dataset.action, act); }
    });

    // modal
    $("#modal").addEventListener("click", (e) => {
      if (e.target.closest("[data-close]")) { closeModal(); return; }
      const act = e.target.closest("[data-action]");
      if (act) handleAction(act.dataset.action, act);
    });

    // logger
    const l = $("#logger");
    l.addEventListener("click", loggerClick);
    l.addEventListener("input", loggerInput);

    // rest timer controls
    $("#rest").addEventListener("click", (e) => {
      const adj = e.target.closest("[data-rest]");
      if (adj) { restLeft = Math.max(5, restLeft + +adj.dataset.rest); $("#restTime").textContent = fmt.clock(restLeft); return; }
      if (e.target.closest("#restSkip")) stopRest();
    });

    // resume bar
    $("#resumeBar").addEventListener("click", resumeWorkout);

    // re-bind view-specific listeners after each render
    window.__afterRender = () => {
      if (state.view === "exercises") bindExerciseView();
      if (state.view === "stats") bindStatsView();
    };

    // restore active workout (but don't auto-open; show resume bar)
    go("home");
    refreshResumeBar();
  }

  // hook afterRender into render
  const _render = render;
  render = function () { _render(); if (window.__afterRender) window.__afterRender(); };

  document.addEventListener("DOMContentLoaded", init);
})();

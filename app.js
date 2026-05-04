/* ===== Scripture Quest — App logic ===== */

const STORAGE_KEY = "scripture-quest-v1";
const XP_PER_PASSAGE = 10;
const XP_PER_REFLECTION = 5;
const DAILY_BONUS_XP = 20;
const STREAK_BONUS_PER_7 = 50;

const $ = sel => document.querySelector(sel);
const $$ = sel => Array.from(document.querySelectorAll(sel));

// ---------- State ----------
const defaultState = () => ({
  name: "",
  avatar: "🦁",
  goal: 2,
  translation: "WEB",
  xp: 0,
  hearts: 3,
  streak: 0,
  bestStreak: 0,
  lastReadDate: null,        // YYYY-MM-DD
  todayCount: 0,
  totalChapters: 0,
  reflections: 0,
  planProgress: {},          // { planId: lessonIndex }
  currentPlan: "warrior",
  currentLesson: 0,
  achievements: [],          // earned ids
  reflectionsByLesson: {},   // { "planId:idx": text }
  friends: [],               // [{ name, avatar, xp, streak, weekly }]
  flags: {}                  // misc flags (earlyBird, etc.)
});

let state = loadState();

function loadState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return defaultState();
    const parsed = JSON.parse(raw);
    return Object.assign(defaultState(), parsed);
  } catch (e) {
    return defaultState();
  }
}

function saveState() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

// ---------- Date helpers ----------
function todayKey() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function yesterdayKey() {
  const d = new Date();
  d.setDate(d.getDate() - 1);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function rollDayIfNeeded() {
  const today = todayKey();
  if (state.lastReadDate !== today) {
    if (state.lastReadDate && state.lastReadDate !== yesterdayKey()) {
      // missed a day -> streak resets
      state.streak = 0;
    }
    state.todayCount = 0;
  }
}

// ---------- Ranks / Leagues ----------
function rankFor(xp) {
  let current = RANKS[0];
  for (const r of RANKS) {
    if (xp >= r.xp) current = r;
  }
  return current;
}

function leagueFor(xp) {
  let current = LEAGUES[0];
  for (const l of LEAGUES) {
    if (xp >= l.minXp) current = l;
  }
  return current;
}

// ---------- Friends (simulated peers) ----------
function ensureFriends() {
  if (state.friends && state.friends.length) return;
  // pick 5 starter friends
  const shuffled = FRIEND_POOL.slice().sort(() => Math.random() - 0.5).slice(0, 5);
  state.friends = shuffled.map(f => ({
    name: f.name,
    avatar: f.avatar,
    xp: Math.floor(Math.random() * 250) + 40,
    weekly: Math.floor(Math.random() * 180) + 20,
    streak: Math.floor(Math.random() * 12)
  }));
  saveState();
}

function nudgeFriends() {
  // Friends drift their XP between sessions (so the board feels alive).
  const now = Date.now();
  if (!state.flags.lastNudge) state.flags.lastNudge = now;
  const hoursPassed = (now - state.flags.lastNudge) / 36e5;
  if (hoursPassed < 0.25) return;
  state.friends.forEach(f => {
    const gain = Math.round(Math.random() * 8 * Math.max(1, hoursPassed));
    f.weekly += gain;
    f.xp += gain;
    if (Math.random() < 0.15) f.streak += 1;
  });
  state.flags.lastNudge = now;
  saveState();
}

// ---------- Quests (daily) ----------
function todaysQuests() {
  return [
    {
      id: "daily_goal",
      icon: "🎯",
      name: `Hit your daily goal`,
      meta: `${state.todayCount}/${state.goal} passages today`,
      progress: Math.min(state.todayCount / state.goal, 1),
      reward: DAILY_BONUS_XP,
      done: state.todayCount >= state.goal && (state.flags.dailyClaimed === todayKey())
    },
    {
      id: "reflect",
      icon: "📝",
      name: `Save a reflection`,
      meta: state.flags.reflectedToday === todayKey() ? "Done — nice." : "Write something honest.",
      progress: state.flags.reflectedToday === todayKey() ? 1 : 0,
      reward: XP_PER_REFLECTION,
      done: state.flags.reflectedToday === todayKey()
    },
    {
      id: "streak_keep",
      icon: "🔥",
      name: `Keep your streak alive`,
      meta: state.lastReadDate === todayKey() ? `Day ${state.streak} locked in` : "Read at least 1 passage",
      progress: state.lastReadDate === todayKey() ? 1 : 0,
      reward: 0,
      done: state.lastReadDate === todayKey()
    }
  ];
}

// ---------- View routing ----------
function showView(view) {
  $$(".view").forEach(el => el.classList.add("hidden"));
  $("#view-" + view).classList.remove("hidden");
  $$(".nav-btn").forEach(b => b.classList.toggle("active", b.dataset.view === view));
  if (view === "home") renderHome();
  if (view === "read") renderRead();
  if (view === "leaderboard") renderLeaderboard();
  if (view === "profile") renderProfile();
}

// ---------- Toast / Celebrate ----------
let toastTimer = null;
function toast(msg) {
  const t = $("#toast");
  t.textContent = msg;
  t.classList.remove("hidden");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => t.classList.add("hidden"), 1800);
}

function celebrate({ emoji = "🔥", title = "Quest Complete!", sub = "" } = {}) {
  $("#celebrate-emoji").textContent = emoji;
  $("#celebrate-title").textContent = title;
  $("#celebrate-sub").textContent = sub;
  $("#celebrate").classList.remove("hidden");
}

// ---------- Onboarding ----------
function renderOnboarding() {
  const grid = $("#avatar-grid");
  grid.innerHTML = "";
  AVATARS.forEach(a => {
    const b = document.createElement("button");
    b.type = "button";
    b.textContent = a;
    if (a === state.avatar) b.classList.add("selected");
    b.addEventListener("click", () => {
      state.avatar = a;
      $$("#avatar-grid button").forEach(x => x.classList.remove("selected"));
      b.classList.add("selected");
    });
    grid.appendChild(b);
  });

  $$("#goal-grid .goal-pill").forEach(btn => {
    btn.addEventListener("click", () => {
      state.goal = parseInt(btn.dataset.goal, 10);
      $$("#goal-grid .goal-pill").forEach(x => x.classList.remove("selected"));
      btn.classList.add("selected");
    });
  });

  $("#onboard-start").addEventListener("click", () => {
    const name = $("#onboard-name").value.trim();
    if (!name) {
      toast("Drop your name first.");
      $("#onboard-name").focus();
      return;
    }
    state.name = name;
    saveState();
    enterApp();
  });
}

function enterApp() {
  $("#onboarding").classList.add("hidden");
  $("#topbar").classList.remove("hidden");
  $("#bottomnav").classList.remove("hidden");
  ensureFriends();
  nudgeFriends();
  renderTopBar();
  showView("home");
}

// ---------- Top bar ----------
function renderTopBar() {
  $("#stat-streak").textContent = state.streak;
  $("#stat-xp").textContent = state.xp;
  $("#stat-hearts").textContent = state.hearts;
}

// ---------- Home ----------
function renderHome() {
  rollDayIfNeeded();
  saveState();
  renderTopBar();

  $("#hero-avatar").textContent = state.avatar;
  $("#hero-greeting").textContent = `What's up, ${state.name}.`;
  const r = rankFor(state.xp);
  $("#hero-rank").textContent = `Rank: ${r.name} · Lv ${r.lv}`;

  // Progress ring
  const pct = Math.min(state.todayCount / state.goal, 1);
  const C = 2 * Math.PI * 52;
  $("#ring-progress").style.strokeDasharray = C;
  $("#ring-progress").style.strokeDashoffset = C * (1 - pct);
  $("#ring-done").textContent = state.todayCount;
  $("#ring-goal").textContent = state.goal;
  $("#ring-sub").textContent = pct >= 1
    ? "Goal smashed. Keep the streak rolling."
    : `${state.goal - state.todayCount} to go. Get after it.`;

  // Quests
  const ql = $("#quest-list");
  ql.innerHTML = "";
  todaysQuests().forEach(q => {
    const el = document.createElement("div");
    el.className = "quest" + (q.done ? " done" : "");
    el.innerHTML = `
      <div class="quest-icon">${q.icon}</div>
      <div>
        <div class="quest-name">${q.name}</div>
        <div class="quest-meta">${q.meta}</div>
        <div class="quest-bar"><div style="width:${Math.round(q.progress * 100)}%"></div></div>
      </div>
      <div class="quest-reward">${q.reward ? "+" + q.reward + " XP" : ""}</div>
    `;
    ql.appendChild(el);
  });

  // Plans
  const pg = $("#plan-grid");
  pg.innerHTML = "";
  PLANS.forEach(p => {
    const done = state.planProgress[p.id] || 0;
    const total = p.lessons.length;
    const el = document.createElement("div");
    el.className = "plan";
    el.style.setProperty("--plan-color", p.color);
    el.innerHTML = `
      <div class="plan-emoji">${p.emoji}</div>
      <div class="plan-name">${p.name}</div>
      <div class="plan-desc">${p.desc}</div>
      <div class="plan-progress">
        <div class="plan-bar"><div style="width:${Math.round((done / total) * 100)}%"></div></div>
        <span>${done}/${total}</span>
      </div>
    `;
    el.addEventListener("click", () => {
      state.currentPlan = p.id;
      state.currentLesson = Math.min(done, total - 1);
      saveState();
      showView("read");
    });
    pg.appendChild(el);
  });

  // Badges
  const bs = $("#badge-strip");
  bs.innerHTML = "";
  ACHIEVEMENTS.forEach(a => {
    const earned = state.achievements.includes(a.id);
    const el = document.createElement("div");
    el.className = "badge" + (earned ? "" : " locked");
    el.innerHTML = `<div class="badge-emoji">${a.emoji}</div><div class="badge-name">${a.name}</div>`;
    bs.appendChild(el);
  });
}

// ---------- Read ----------
function currentPlan() {
  return PLANS.find(p => p.id === state.currentPlan) || PLANS[0];
}
function currentLesson() {
  const p = currentPlan();
  const idx = Math.max(0, Math.min(state.currentLesson, p.lessons.length - 1));
  return { plan: p, idx, lesson: p.lessons[idx] };
}

function renderRead() {
  const { plan, idx, lesson } = currentLesson();
  $("#read-plan-name").textContent = plan.name;
  $("#read-ref").textContent = lesson.ref;
  $("#read-xp-preview").textContent = XP_PER_PASSAGE;

  const passage = $("#passage");
  passage.innerHTML = "";
  const themeEl = document.createElement("div");
  themeEl.style.cssText = "font-style:italic;color:var(--muted);margin-bottom:10px;";
  themeEl.textContent = lesson.theme;
  passage.appendChild(themeEl);

  lesson.verses.forEach(v => {
    const span = document.createElement("p");
    span.style.margin = "0 0 8px";
    span.innerHTML = `<span class="v">${v.v}</span>${v.t}`;
    passage.appendChild(span);
  });
  passage.scrollTop = 0;

  $("#reflect-prompt").textContent = lesson.prompt;
  const key = `${plan.id}:${idx}`;
  $("#reflect-input").value = state.reflectionsByLesson[key] || "";

  // mark-read button label
  const done = (state.planProgress[plan.id] || 0) > idx;
  $("#mark-read").textContent = done ? "Already Read ✓" : "I Read This ✓";
  $("#mark-read").disabled = false;
}

function gotoLesson(delta) {
  const p = currentPlan();
  state.currentLesson = Math.max(0, Math.min(state.currentLesson + delta, p.lessons.length - 1));
  saveState();
  renderRead();
}

function markRead() {
  const { plan, idx } = currentLesson();
  const prevDone = state.planProgress[plan.id] || 0;
  const isNew = idx >= prevDone;

  // Streak handling
  const today = todayKey();
  if (state.lastReadDate !== today) {
    if (state.lastReadDate === yesterdayKey()) {
      state.streak += 1;
    } else {
      state.streak = 1;
    }
    if (state.streak > state.bestStreak) state.bestStreak = state.streak;
    state.lastReadDate = today;
    state.todayCount = 0;
  }

  if (isNew) {
    state.planProgress[plan.id] = idx + 1;
    state.totalChapters += 1;
    state.xp += XP_PER_PASSAGE;
    state.todayCount += 1;

    // weekly leaderboard for "you"
    state.flags.youWeekly = (state.flags.youWeekly || 0) + XP_PER_PASSAGE;
  }

  // Early bird flag
  if (new Date().getHours() < 8) state.flags.earlyBird = true;

  // Daily goal completion bonus (one time per day)
  if (state.todayCount >= state.goal && state.flags.dailyClaimed !== today) {
    state.xp += DAILY_BONUS_XP;
    state.flags.dailyClaimed = today;
    if (state.streak > 0 && state.streak % 7 === 0) {
      state.xp += STREAK_BONUS_PER_7;
    }
    saveState();
    checkAchievements();
    renderTopBar();
    celebrate({
      emoji: "🏆",
      title: "Daily Quest Complete!",
      sub: `+${DAILY_BONUS_XP} XP${state.streak % 7 === 0 ? `  ·  +${STREAK_BONUS_PER_7} streak bonus` : ""}`
    });
    return;
  }

  saveState();
  checkAchievements();
  renderTopBar();
  toast(isNew ? `+${XP_PER_PASSAGE} XP — keep going` : "Already counted ✓");

  // Auto advance to next lesson
  const p = currentPlan();
  if (state.currentLesson < p.lessons.length - 1) {
    setTimeout(() => gotoLesson(1), 350);
  } else {
    setTimeout(() => renderRead(), 100);
  }
}

function saveReflection() {
  const { plan, idx } = currentLesson();
  const key = `${plan.id}:${idx}`;
  const text = $("#reflect-input").value.trim();
  if (!text) {
    toast("Write something first.");
    return;
  }
  const wasNew = !state.reflectionsByLesson[key];
  state.reflectionsByLesson[key] = text;

  if (wasNew) {
    state.reflections = (state.reflections || 0) + 1;
    state.xp += XP_PER_REFLECTION;
    state.flags.reflectedToday = todayKey();
    state.flags.youWeekly = (state.flags.youWeekly || 0) + XP_PER_REFLECTION;
    saveState();
    checkAchievements();
    renderTopBar();
    toast(`+${XP_PER_REFLECTION} XP for reflecting`);
  } else {
    saveState();
    toast("Reflection saved");
  }
}

// ---------- Leaderboard ----------
let lbTab = "weekly";
function renderLeaderboard() {
  ensureFriends();
  nudgeFriends();

  const league = leagueFor(state.xp);
  $("#lb-league-name").textContent = league.name;

  const rows = state.friends.map(f => ({ ...f, isYou: false }));
  rows.push({
    name: state.name || "You",
    avatar: state.avatar,
    xp: state.xp,
    weekly: state.flags.youWeekly || 0,
    streak: state.streak,
    isYou: true
  });

  let scoreOf;
  if (lbTab === "weekly") scoreOf = r => r.weekly;
  else if (lbTab === "alltime") scoreOf = r => r.xp;
  else scoreOf = r => r.streak;

  rows.sort((a, b) => scoreOf(b) - scoreOf(a));

  const list = $("#lb-list");
  list.innerHTML = "";
  rows.forEach((r, i) => {
    const li = document.createElement("li");
    li.className = "lb-row" + (r.isYou ? " you" : "");
    const rankClass = i < 3 ? "top" : "";
    const sub = lbTab === "streak" ? `${r.streak} day streak` : `${r.xp} total XP`;
    li.innerHTML = `
      <div class="lb-rank ${rankClass}">${i + 1}</div>
      <div class="lb-avatar">${r.avatar}</div>
      <div>
        <div class="lb-name">${r.name}${r.isYou ? " (you)" : ""}</div>
        <div class="lb-sub">${sub}</div>
      </div>
      <div class="lb-score">${scoreOf(r)}${lbTab === "streak" ? "🔥" : " XP"}</div>
    `;
    list.appendChild(li);
  });
}

// ---------- Profile ----------
function renderProfile() {
  $("#profile-avatar").textContent = state.avatar;
  $("#profile-name").textContent = state.name || "You";
  const r = rankFor(state.xp);
  $("#profile-rank").textContent = `${r.name} · Lv ${r.lv}`;
  $("#kpi-streak").textContent = state.streak;
  $("#kpi-best").textContent = state.bestStreak;
  $("#kpi-chapters").textContent = state.totalChapters;
  $("#kpi-xp").textContent = state.xp;

  const ag = $("#achievement-grid");
  ag.innerHTML = "";
  ACHIEVEMENTS.forEach(a => {
    const earned = state.achievements.includes(a.id);
    const el = document.createElement("div");
    el.className = "achievement" + (earned ? "" : " locked");
    el.innerHTML = `
      <div class="achievement-emoji">${a.emoji}</div>
      <div class="achievement-name">${a.name}</div>
      <div class="achievement-desc">${a.desc}</div>
    `;
    ag.appendChild(el);
  });

  $("#setting-goal").value = String(state.goal);
  $("#setting-translation").value = state.translation;
}

// ---------- Achievements ----------
function checkAchievements() {
  let newlyEarned = [];
  ACHIEVEMENTS.forEach(a => {
    if (!state.achievements.includes(a.id) && a.check(state)) {
      state.achievements.push(a.id);
      newlyEarned.push(a);
    }
  });
  if (newlyEarned.length) {
    saveState();
    const a = newlyEarned[0];
    setTimeout(() => {
      celebrate({ emoji: a.emoji, title: `Achievement: ${a.name}`, sub: a.desc });
    }, 500);
  }
}

// ---------- Friends add ----------
function addFriend() {
  const name = $("#friend-name").value.trim();
  if (!name) {
    toast("Type a name first.");
    return;
  }
  const avatars = ["🦁", "🐺", "🦅", "🐉", "⚔️", "🛡️", "⚡", "🔥"];
  state.friends.push({
    name,
    avatar: avatars[Math.floor(Math.random() * avatars.length)],
    xp: 0,
    weekly: 0,
    streak: 0
  });
  $("#friend-name").value = "";
  saveState();
  renderLeaderboard();
  toast(`${name} added to your league`);
}

// ---------- Wiring ----------
function wire() {
  // Bottom nav
  $$(".nav-btn").forEach(b => {
    b.addEventListener("click", () => showView(b.dataset.view));
  });

  // Hero CTA
  $("#cta-continue").addEventListener("click", () => showView("read"));

  // Read controls
  $("#prev-passage").addEventListener("click", () => gotoLesson(-1));
  $("#next-passage").addEventListener("click", () => gotoLesson(1));
  $("#mark-read").addEventListener("click", markRead);
  $("#reflect-save").addEventListener("click", saveReflection);
  $("#back-to-plans").addEventListener("click", () => showView("home"));

  // Leaderboard tabs
  $$(".lb-tab").forEach(t => {
    t.addEventListener("click", () => {
      $$(".lb-tab").forEach(x => x.classList.remove("active"));
      t.classList.add("active");
      lbTab = t.dataset.tab;
      renderLeaderboard();
    });
  });
  $("#add-friend").addEventListener("click", addFriend);

  // Profile settings
  $("#setting-goal").addEventListener("change", e => {
    state.goal = parseInt(e.target.value, 10);
    saveState();
    toast(`Daily goal set to ${state.goal}`);
  });
  $("#setting-translation").addEventListener("change", e => {
    state.translation = e.target.value;
    saveState();
  });
  $("#reset-progress").addEventListener("click", () => {
    if (confirm("Reset everything? Streaks, XP, friends — all gone.")) {
      localStorage.removeItem(STORAGE_KEY);
      state = defaultState();
      location.reload();
    }
  });

  // Celebrate close
  $("#celebrate-close").addEventListener("click", () => {
    $("#celebrate").classList.add("hidden");
    renderTopBar();
    if (!$("#view-home").classList.contains("hidden")) renderHome();
    if (!$("#view-profile").classList.contains("hidden")) renderProfile();
  });
}

// ---------- Init ----------
function init() {
  wire();
  rollDayIfNeeded();
  if (!state.name) {
    $("#onboarding").classList.remove("hidden");
    renderOnboarding();
  } else {
    enterApp();
  }
}

document.addEventListener("DOMContentLoaded", init);

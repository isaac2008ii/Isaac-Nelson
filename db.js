/*
 * Forge — local data layer
 * --------------------------------------------------------------
 * Everything lives in the browser via localStorage, so the app
 * works offline and NEVER forgets what you did the day before.
 * No accounts, no servers, no social feed — just your training.
 *
 * Two keys are used:
 *   forge.data    -> exercises, routines, finished workouts, settings
 *   forge.active  -> the in-progress workout (survives reloads)
 */
(function () {
  "use strict";

  const DATA_KEY = "forge.data.v1";
  const ACTIVE_KEY = "forge.active.v1";

  /* ---------- Seed exercise library ---------- */
  // muscle groups: chest, back, shoulders, legs, biceps, triceps, core, cardio
  const SEED_EXERCISES = [
    // Chest
    ["Bench Press (Barbell)", "chest", "barbell"],
    ["Incline Bench Press (Barbell)", "chest", "barbell"],
    ["Bench Press (Dumbbell)", "chest", "dumbbell"],
    ["Incline Bench Press (Dumbbell)", "chest", "dumbbell"],
    ["Chest Fly (Machine)", "chest", "machine"],
    ["Cable Crossover", "chest", "cable"],
    ["Push Up", "chest", "bodyweight"],
    ["Dip", "chest", "bodyweight"],
    // Back
    ["Deadlift (Barbell)", "back", "barbell"],
    ["Pull Up", "back", "bodyweight"],
    ["Chin Up", "back", "bodyweight"],
    ["Lat Pulldown (Cable)", "back", "cable"],
    ["Seated Cable Row", "back", "cable"],
    ["Bent Over Row (Barbell)", "back", "barbell"],
    ["Bent Over Row (Dumbbell)", "back", "dumbbell"],
    ["T-Bar Row", "back", "barbell"],
    ["Face Pull", "back", "cable"],
    // Shoulders
    ["Overhead Press (Barbell)", "shoulders", "barbell"],
    ["Shoulder Press (Dumbbell)", "shoulders", "dumbbell"],
    ["Lateral Raise (Dumbbell)", "shoulders", "dumbbell"],
    ["Lateral Raise (Cable)", "shoulders", "cable"],
    ["Rear Delt Fly", "shoulders", "dumbbell"],
    ["Arnold Press", "shoulders", "dumbbell"],
    ["Shrug (Barbell)", "shoulders", "barbell"],
    // Legs
    ["Back Squat (Barbell)", "legs", "barbell"],
    ["Front Squat (Barbell)", "legs", "barbell"],
    ["Leg Press", "legs", "machine"],
    ["Romanian Deadlift", "legs", "barbell"],
    ["Leg Extension", "legs", "machine"],
    ["Leg Curl (Seated)", "legs", "machine"],
    ["Lunge (Dumbbell)", "legs", "dumbbell"],
    ["Bulgarian Split Squat", "legs", "dumbbell"],
    ["Hip Thrust (Barbell)", "legs", "barbell"],
    ["Calf Raise (Standing)", "legs", "machine"],
    ["Goblet Squat", "legs", "dumbbell"],
    // Biceps
    ["Bicep Curl (Dumbbell)", "biceps", "dumbbell"],
    ["Bicep Curl (Barbell)", "biceps", "barbell"],
    ["Hammer Curl", "biceps", "dumbbell"],
    ["Preacher Curl", "biceps", "machine"],
    ["Cable Curl", "biceps", "cable"],
    // Triceps
    ["Tricep Pushdown (Cable)", "triceps", "cable"],
    ["Overhead Tricep Extension", "triceps", "dumbbell"],
    ["Skullcrusher", "triceps", "barbell"],
    ["Close Grip Bench Press", "triceps", "barbell"],
    ["Tricep Dip", "triceps", "bodyweight"],
    // Core
    ["Plank", "core", "bodyweight"],
    ["Hanging Leg Raise", "core", "bodyweight"],
    ["Cable Crunch", "core", "cable"],
    ["Russian Twist", "core", "bodyweight"],
    ["Ab Wheel Rollout", "core", "bodyweight"],
    // Cardio
    ["Running", "cardio", "bodyweight"],
    ["Cycling", "cardio", "machine"],
    ["Rowing Machine", "cardio", "machine"],
    ["Stair Climber", "cardio", "machine"],
    ["Jump Rope", "cardio", "bodyweight"],
  ];

  const MUSCLES = [
    "chest", "back", "shoulders", "legs",
    "biceps", "triceps", "core", "cardio",
  ];

  function uid() {
    return Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
  }

  function seedExercises() {
    return SEED_EXERCISES.map(([name, muscle, equipment]) => ({
      id: uid(),
      name,
      muscle,
      equipment,
      custom: false,
    }));
  }

  function defaultData() {
    return {
      exercises: seedExercises(),
      routines: [],
      workouts: [],
      settings: { unit: "kg", restDefault: 90 },
    };
  }

  /* ---------- Persistence ---------- */
  let cache = null;

  function load() {
    if (cache) return cache;
    try {
      const raw = localStorage.getItem(DATA_KEY);
      cache = raw ? JSON.parse(raw) : defaultData();
    } catch (e) {
      cache = defaultData();
    }
    // forward-compatible defaults
    cache.exercises ||= [];
    cache.routines ||= [];
    cache.workouts ||= [];
    cache.settings ||= { unit: "kg", restDefault: 90 };
    return cache;
  }

  function save() {
    localStorage.setItem(DATA_KEY, JSON.stringify(cache));
  }

  /* ---------- Public API ---------- */
  const DB = {
    uid,
    MUSCLES,

    // ----- settings -----
    settings() { return load().settings; },
    setUnit(u) { load().settings.unit = u; save(); },
    setRestDefault(sec) { load().settings.restDefault = sec; save(); },

    // ----- exercises -----
    exercises() { return load().exercises.slice().sort((a, b) => a.name.localeCompare(b.name)); },
    exercise(id) { return load().exercises.find((e) => e.id === id); },
    addExercise(name, muscle, equipment) {
      const ex = { id: uid(), name: name.trim(), muscle, equipment, custom: true };
      load().exercises.push(ex);
      save();
      return ex;
    },
    updateExercise(id, patch) {
      const ex = this.exercise(id);
      if (ex) { Object.assign(ex, patch); save(); }
      return ex;
    },
    deleteExercise(id) {
      const d = load();
      d.exercises = d.exercises.filter((e) => e.id !== id);
      save();
    },

    // ----- routines -----
    routines() { return load().routines; },
    routine(id) { return load().routines.find((r) => r.id === id); },
    saveRoutine(routine) {
      const d = load();
      if (routine.id) {
        const i = d.routines.findIndex((r) => r.id === routine.id);
        if (i >= 0) d.routines[i] = routine;
        else d.routines.push(routine);
      } else {
        routine.id = uid();
        d.routines.push(routine);
      }
      save();
      return routine;
    },
    deleteRoutine(id) {
      const d = load();
      d.routines = d.routines.filter((r) => r.id !== id);
      save();
    },

    // ----- workouts (completed) -----
    workouts() {
      return load().workouts.slice().sort((a, b) => new Date(b.date) - new Date(a.date));
    },
    workout(id) { return load().workouts.find((w) => w.id === id); },
    addWorkout(workout) {
      workout.id ||= uid();
      load().workouts.push(workout);
      save();
      return workout;
    },
    deleteWorkout(id) {
      const d = load();
      d.workouts = d.workouts.filter((w) => w.id !== id);
      save();
    },

    // ----- active workout (in progress) -----
    activeWorkout() {
      try {
        const raw = localStorage.getItem(ACTIVE_KEY);
        return raw ? JSON.parse(raw) : null;
      } catch (e) { return null; }
    },
    setActiveWorkout(w) {
      if (w) localStorage.setItem(ACTIVE_KEY, JSON.stringify(w));
      else localStorage.removeItem(ACTIVE_KEY);
    },

    /* ---------- Derived insight helpers ---------- */

    // Most recent COMPLETED set log for an exercise (so we never forget
    // what you did last time). Returns array of sets or null.
    lastPerformance(exerciseId, beforeDate) {
      const ws = this.workouts();
      for (const w of ws) {
        if (beforeDate && new Date(w.date) >= new Date(beforeDate)) continue;
        const entry = w.exercises.find((e) => e.exerciseId === exerciseId);
        if (entry && entry.sets.some((s) => s.done)) {
          return {
            date: w.date,
            sets: entry.sets.filter((s) => s.done),
          };
        }
      }
      return null;
    },

    // Personal records for an exercise across all history.
    records(exerciseId) {
      let heaviest = 0, bestVolumeSet = 0, best1rm = 0, bestReps = 0;
      this.workouts().forEach((w) => {
        const entry = w.exercises.find((e) => e.exerciseId === exerciseId);
        if (!entry) return;
        entry.sets.forEach((s) => {
          if (!s.done) return;
          const weight = +s.weight || 0;
          const reps = +s.reps || 0;
          if (weight > heaviest) heaviest = weight;
          if (reps > bestReps) bestReps = reps;
          const vol = weight * reps;
          if (vol > bestVolumeSet) bestVolumeSet = vol;
          const orm = weight * (1 + reps / 30); // Epley estimate
          if (orm > best1rm) best1rm = orm;
        });
      });
      return {
        heaviest,
        bestReps,
        bestVolumeSet,
        best1rm: Math.round(best1rm * 10) / 10,
      };
    },

    // Time series of estimated 1RM per workout for an exercise (oldest first).
    exerciseProgress(exerciseId) {
      return this.workouts()
        .slice()
        .reverse()
        .map((w) => {
          const entry = w.exercises.find((e) => e.exerciseId === exerciseId);
          if (!entry) return null;
          let best1rm = 0, vol = 0, topWeight = 0;
          entry.sets.forEach((s) => {
            if (!s.done) return;
            const weight = +s.weight || 0;
            const reps = +s.reps || 0;
            best1rm = Math.max(best1rm, weight * (1 + reps / 30));
            vol += weight * reps;
            topWeight = Math.max(topWeight, weight);
          });
          if (vol === 0 && topWeight === 0) return null;
          return { date: w.date, e1rm: Math.round(best1rm), volume: Math.round(vol), topWeight };
        })
        .filter(Boolean);
    },

    // Volume for a single completed workout.
    workoutVolume(w) {
      let vol = 0, sets = 0;
      w.exercises.forEach((e) =>
        e.sets.forEach((s) => {
          if (s.done) { vol += (+s.weight || 0) * (+s.reps || 0); sets++; }
        })
      );
      return { volume: Math.round(vol), sets };
    },

    // Aggregate stats for the trailing N days.
    statsForRange(days) {
      const cutoff = Date.now() - days * 86400000;
      const ws = this.workouts().filter((w) => new Date(w.date).getTime() >= cutoff);
      let volume = 0, sets = 0, durationSec = 0;
      ws.forEach((w) => {
        const v = this.workoutVolume(w);
        volume += v.volume; sets += v.sets;
        durationSec += w.durationSec || 0;
      });
      return { count: ws.length, volume, sets, durationSec };
    },

    // Workouts-per-week buckets for the last `weeks` weeks (oldest first).
    weeklyWorkoutCounts(weeks) {
      const out = [];
      const now = new Date();
      // Anchor to start of current week (Mon).
      for (let i = weeks - 1; i >= 0; i--) {
        const end = new Date(now); end.setDate(now.getDate() - i * 7);
        const start = new Date(end); start.setDate(end.getDate() - 6);
        start.setHours(0, 0, 0, 0); end.setHours(23, 59, 59, 999);
        const count = this.workouts().filter((w) => {
          const t = new Date(w.date);
          return t >= start && t <= end;
        }).length;
        out.push({ label: end, count });
      }
      return out;
    },

    /* ---------- Backup ---------- */
    exportJSON() { return JSON.stringify(load(), null, 2); },
    importJSON(json) {
      const parsed = JSON.parse(json);
      cache = parsed;
      cache.exercises ||= [];
      cache.routines ||= [];
      cache.workouts ||= [];
      cache.settings ||= { unit: "kg", restDefault: 90 };
      save();
    },
    resetAll() {
      cache = defaultData();
      save();
      this.setActiveWorkout(null);
    },
  };

  window.DB = DB;
})();

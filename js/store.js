/* ============================================================================
   store.js — all localStorage access + derived stats + the new journey/XP model.
   Session/settings keys are byte-for-byte identical to the original app so
   returning users keep their history; only skate_journey_v1 is added.
   ============================================================================ */
import { DAYS, countMoves } from "./data.js";

/* ---- keys (unchanged from the original single-file app) ---- */
export const SETTINGS_KEY     = "skateTrainingSettingsV2";
export const PROGRESS_KEY     = "skateTrainingProgressV2";
export const SKIP_HISTORY_KEY = "skateTrainingSkipHistoryV2";
export const ENGAGE_KEY       = "skateEngagementPickV2";
export const LS_SESSIONS      = "skate_sessions_v2";
export const LS_TRACKER       = "skate_tracker_v2";
export const LS_EVENTS        = "skate_events_v1";
export const LS_READINESS     = "skate_readiness";
export const LS_JOURNEY       = "skate_journey_v1";   // NEW in V2

const DAY_MS = 86400000;

/* ---- generic JSON helpers (never throw) ---- */
export function readStorage(key, fallback) {
  try { const v = localStorage.getItem(key); return v == null ? fallback : JSON.parse(v); }
  catch { return fallback; }
}
export function writeStorage(key, value) {
  try { localStorage.setItem(key, JSON.stringify(value)); } catch {}
}

/* ---- sessions (schema: { dayKey, isoDate, durationSecs, session, ...patches }) ---- */
export function loadSessions() { return readStorage(LS_SESSIONS, []); }
export function saveSession(entry) {
  const all = loadSessions(); all.push(entry); writeStorage(LS_SESSIONS, all);
}
export function patchLastSession(patch) {
  const all = loadSessions();
  if (!all.length) return;
  all[all.length - 1] = { ...all[all.length - 1], ...patch };
  writeStorage(LS_SESSIONS, all);
}

/* Local calendar day (YYYY-MM-DD in the athlete's timezone, not UTC) — the key
   for streaks/week grouping so evening sessions don't roll into "tomorrow". */
export function localDateKey(d = new Date()) {
  const y = d.getFullYear(), m = String(d.getMonth() + 1).padStart(2, "0"), day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}
/* A session's calendar day — prefers the stored localDate, falls back to the
   UTC isoDate slice for rows written before this change. */
export function sessionDay(s) { return s.localDate || (s.isoDate || "").slice(0, 10); }

export function mondayOfThisWeek() {
  const d = new Date(); d.setHours(0, 0, 0, 0);
  const dow = d.getDay();                 // 0=Sun..6=Sat
  d.setDate(d.getDate() + (dow === 0 ? -6 : 1 - dow));
  return d;
}
export function thisWeekSessions() {
  const mondayKey = localDateKey(mondayOfThisWeek());
  return loadSessions().filter(s => sessionDay(s) >= mondayKey);   // YYYY-MM-DD lexical compare
}

/* Longest run of consecutive calendar days with >=1 session. */
export function longestStreak(sessions = loadSessions()) {
  const days = [...new Set(sessions.map(sessionDay).filter(Boolean))].sort();
  let best = 0, run = 0, prev = null;
  days.forEach(d => {
    if (prev && Math.round((new Date(d) - new Date(prev)) / DAY_MS) === 1) run++; else run = 1;
    prev = d; if (run > best) best = run;
  });
  return best;
}
/* Current streak anchored to today/yesterday (local). */
export function currentStreak(sessions = loadSessions()) {
  const days = [...new Set(sessions.map(sessionDay).filter(Boolean))].sort();
  if (!days.length) return 0;
  let cur = new Date(days[days.length - 1]);
  const today = new Date(localDateKey());   // local midnight
  const anchor = new Date(today); anchor.setDate(anchor.getDate() - 1);
  if (cur < anchor) return 0;
  let streak = 1;
  for (let i = days.length - 2; i >= 0; i--) {
    const prev = new Date(days[i]);
    if (Math.round((cur - prev) / DAY_MS) === 1) { streak++; cur = prev; } else break;
  }
  return streak;
}

/* ---- settings (V2 defaults merged over any stored value) ---- */
export const SETTINGS_DEFAULTS = {
  athleteName: "Jenn",
  coachVoiceOn: true,
  voiceStyle: "warm",
  exerciseRestSeconds: 5,
  roundRestSeconds: 20,
  sectionRestSeconds: 30,
  testMode: false,
  prizePool: [
    "Choose the family movie 🎬",
    "Pick dinner one night 🍝",
    "30 min extra screen time 📱",
    "Hot chocolate after practice ☕",
    "Stay up 20 min later 🌙",
    "A new sticker sheet ✨"
  ]
};
export function loadSettings() {
  return { ...SETTINGS_DEFAULTS, ...readStorage(SETTINGS_KEY, {}) };
}
export function saveSettings(patch) {
  const merged = { ...loadSettings(), ...patch };
  writeStorage(SETTINGS_KEY, merged);
  return merged;
}

/* ---- readiness (versioned V2 schema + "same as yesterday" shortcut) ---- */
export function loadReadiness() { return readStorage(LS_READINESS, null); }
export function saveReadiness(record) {
  const full = { version: 2, when: Date.now(), ...record };
  writeStorage(LS_READINESS, full);
  writeStorage("skate_last_check", { answers: record.answers, light: record.light, when: full.when });
  return full;
}
export function loadLastCheck() { return readStorage("skate_last_check", null); }

/* ============================================================================
   Journey / XP / rank
   XP: a completed training session earns 40 + 10·moves; Sunday recovery = 0.
   Level costs rise gently; ranks are skating-themed bands over levels.
   ============================================================================ */
export const RANKS = [
  { min: 1,  name: "First Glide" },
  { min: 3,  name: "Snowflake" },
  { min: 5,  name: "Frost Spinner" },
  { min: 8,  name: "Edge Dancer" },
  { min: 12, name: "Axel Rising" },
  { min: 16, name: "Ice Star" },
  { min: 21, name: "Rink Royalty" }
];
export function rankForLevel(level) {
  let r = RANKS[0];
  for (const cand of RANKS) if (level >= cand.min) r = cand;
  return r;
}
export function nextRank(level) {
  return RANKS.find(r => r.min > level) || null;
}
/* XP cost to go from level L to L+1. */
export function levelCost(level) { return 100 + (level - 1) * 20; }

export function xpForSessionEntry(entry) {
  const day = DAYS[entry?.dayKey];
  if (!day || day.spa || day.defaultLight === "recovery") return 0;
  const base = 40 + 10 * countMoves(day);
  // Reward finishing: full base when completed; otherwise scale by how far the
  // athlete got (min 10%). Old rows (no completedFully field) count as complete.
  const frac = entry && entry.completedFully === false
    ? Math.max(0.1, (entry.progressPct || 0) / 100) : 1;
  const cleanBonus = 5 * (entry && entry.cleanLandings || 0);
  return Math.round(base * frac) + cleanBonus;
}

/* Resolve {level, xpIntoLevel, xpToNext, levelPct} from a total XP. */
export function levelFromXp(totalXp) {
  let level = 1, remaining = Math.max(0, totalXp | 0);
  while (remaining >= levelCost(level)) { remaining -= levelCost(level); level++; }
  const cost = levelCost(level);
  return { level, xpIntoLevel: remaining, xpToNext: cost - remaining,
           levelPct: Math.round((remaining / cost) * 100) };
}

const JOURNEY_DEFAULT = { xp: 0, prizesWon: [], pendingDraws: 0, seeded: false };
export function loadJourney() { return { ...JOURNEY_DEFAULT, ...readStorage(LS_JOURNEY, {}) }; }
export function saveJourney(j) { writeStorage(LS_JOURNEY, j); }

/* One-time idempotent seeding: if journey has never been seeded, award XP for
   every session already in history so nothing the athlete earned is lost. */
export function seedJourneyOnce() {
  const j = loadJourney();
  if (j.seeded) return j;
  const earned = loadSessions().reduce((sum, s) => sum + xpForSessionEntry(s), 0);
  const seeded = { ...j, xp: (j.xp || 0) + earned, seeded: true };
  saveJourney(seeded);
  return seeded;
}

/* Award XP for a just-completed session; returns {journey, leveledUp, from, to}. */
export function awardSessionXp(entry) {
  const before = loadJourney();
  const fromLvl = levelFromXp(before.xp).level;
  const gained = xpForSessionEntry(entry);
  const after = { ...before, xp: (before.xp || 0) + gained };
  const toLvl = levelFromXp(after.xp).level;
  if (toLvl > fromLvl) after.pendingDraws = (after.pendingDraws || 0) + (toLvl - fromLvl);
  saveJourney(after);
  return { journey: after, leveledUp: toLvl > fromLvl, from: fromLvl, to: toLvl, gained };
}

/* Claim one prize from a level-up draw: store it and spend a pending draw. */
export function claimPrize(label) {
  const j = loadJourney();
  j.prizesWon = j.prizesWon || [];
  j.prizesWon.push({ label, when: Date.now(), redeemed: false });
  j.pendingDraws = Math.max(0, (j.pendingDraws || 0) - 1);
  saveJourney(j);
  return j;
}
export function redeemPrize(idx) {
  const j = loadJourney();
  if (j.prizesWon && j.prizesWon[idx]) { j.prizesWon[idx].redeemed = true; saveJourney(j); }
  return j;
}

/* ---- lightweight event log + quiz results ---- */
const LS_QUIZ = "skate_quiz_v1";
export function logEvent(type, data) {
  try {
    const all = readStorage(LS_EVENTS, []);
    all.push({ t: Date.now(), iso: new Date().toISOString(), type, ...(data || {}) });
    writeStorage(LS_EVENTS, all.slice(-1500));
  } catch {}
}
/* Record a quiz run. `items` (optional) is [{move, ok}] so we can track which
   moves the athlete misses over time (feeds the parent watch-list). */
export function recordQuizResult(correct, total, items) {
  const q = readStorage(LS_QUIZ, { runs: [], bestPct: 0, byMove: {} });
  const pct = total ? Math.round((correct / total) * 100) : 0;
  q.runs = (q.runs || []).concat({ when: Date.now(), correct, total, pct }).slice(-50);
  q.bestPct = Math.max(q.bestPct || 0, pct);
  q.byMove = q.byMove || {};
  (items || []).forEach(it => {
    const rec = q.byMove[it.move] || { seen: 0, missed: 0 };
    rec.seen++; if (!it.ok) rec.missed++;
    q.byMove[it.move] = rec;
  });
  writeStorage(LS_QUIZ, q);
  logEvent("quiz_complete", { correct, total, pct });
  return q;
}

/* Parent watch-list: moves the athlete tends to land wobbly or miss on the quiz,
   scored (wobbly counts double) and sorted. */
export function movesToWatch(limit = 5) {
  const wobbly = {};
  loadSessions().forEach(s => Object.entries(s.landings || {}).forEach(([m, g]) => { wobbly[m] = (wobbly[m] || 0) + (g.wobbly || 0); }));
  const byMove = (readStorage(LS_QUIZ, {}).byMove) || {};
  const score = {};
  Object.entries(wobbly).forEach(([m, w]) => { score[m] = (score[m] || 0) + w * 2; });
  Object.entries(byMove).forEach(([m, v]) => { score[m] = (score[m] || 0) + (v.missed || 0); });
  return Object.entries(score).filter(([, v]) => v > 0).sort((a, b) => b[1] - a[1]).slice(0, limit)
    .map(([move]) => ({ move, wobbly: wobbly[move] || 0, missed: (byMove[move] || {}).missed || 0 }));
}

/* Count of forced-easy days (red/recovery/pain) in the last 7 calendar days. */
export function easyDaysLast7() {
  const cutoff = localDateKey(new Date(Date.now() - 7 * DAY_MS));
  const days = new Set();
  loadSessions().forEach(s => { if (sessionDay(s) >= cutoff && (s.pain || s.light === "red" || s.light === "recovery")) days.add(sessionDay(s)); });
  return days.size;
}

/* Full journey view-state used by Today + Progress. */
export function journeyState() {
  const j = loadJourney();
  const lv = levelFromXp(j.xp);
  const rank = rankForLevel(lv.level);
  const nr = nextRank(lv.level);
  return {
    xp: j.xp, level: lv.level, levelPct: lv.levelPct,
    xpIntoLevel: lv.xpIntoLevel, xpToNext: lv.xpToNext,
    rankName: rank.name,
    nextRankName: nr ? nr.name : "Max rank",
    levelsToNextRank: nr ? nr.min - lv.level : 0,
    prizesWon: j.prizesWon || [], pendingDraws: j.pendingDraws || 0
  };
}

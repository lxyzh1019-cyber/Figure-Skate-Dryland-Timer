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

export function mondayOfThisWeek() {
  const d = new Date(); d.setHours(0, 0, 0, 0);
  const dow = d.getDay();                 // 0=Sun..6=Sat
  d.setDate(d.getDate() + (dow === 0 ? -6 : 1 - dow));
  return d;
}
export function thisWeekSessions() {
  const monday = mondayOfThisWeek();
  return loadSessions().filter(s => s.isoDate && new Date(s.isoDate) >= monday);
}

/* Longest run of consecutive calendar days with >=1 session. */
export function longestStreak(sessions = loadSessions()) {
  const days = [...new Set(sessions.map(s => (s.isoDate || "").slice(0, 10)).filter(Boolean))].sort();
  let best = 0, run = 0, prev = null;
  days.forEach(d => {
    if (prev && Math.round((new Date(d) - new Date(prev)) / DAY_MS) === 1) run++; else run = 1;
    prev = d; if (run > best) best = run;
  });
  return best;
}
/* Current streak anchored to today/yesterday. */
export function currentStreak(sessions = loadSessions()) {
  const days = [...new Set(sessions.map(s => (s.isoDate || "").slice(0, 10)).filter(Boolean))].sort();
  if (!days.length) return 0;
  let cur = new Date(days[days.length - 1]);
  const today = new Date(); today.setHours(0, 0, 0, 0);
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
  return 40 + 10 * countMoves(day);
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

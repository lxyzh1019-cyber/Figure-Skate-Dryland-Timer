/* ============================================================
   STORE — localStorage persistence, settings, session log,
   events, journey (XP/levels/prizes) and one-time migration.
   Local-first; Firestore mirroring happens in the engine.
   ============================================================ */

import { DAY_MS, mondayOfThisWeek, todayISODate, edmontonISO } from "./util.js";
import { DAYS, PRIZE_POOL, levelCost } from "./data.js";

/* ---- keys (unchanged from the old app unless noted) ---- */
export const SETTINGS_KEY     = "skateTrainingSettingsV2";
export const PROGRESS_KEY     = "skateTrainingProgressV2";
export const SKIP_HISTORY_KEY = "skateTrainingSkipHistoryV2";
export const ENGAGE_KEY       = "skateEngagementPickV2";
export const LS_READINESS     = "skate_readiness";      // v2 schema (4-Q + body map)
export const LS_DAYPROG       = "skate_day_progress";
export const LS_LEARNING      = "skate_learning_records";
export const LS_LADDER        = "skate_ladder_rungs";
export const LS_QUIZ          = "skate_quiz_v1";
export const LS_GATE          = "skate_gate_state";
export const LS_SESSIONS      = "skate_sessions_v2";
export const LS_TRACKER       = "skate_tracker_v2";
export const LS_EVENTS        = "skate_events_v1";
export const LS_PRLOG         = "skate_pr_log";
export const LS_JOURNEY       = "skate_journey_v1";     // NEW: xp / level / prizes

const SKIP_RETENTION_MS  = 7 * 24 * 60 * 60 * 1000;
const EVENT_RETENTION_MS = 120 * 24 * 60 * 60 * 1000; // 120 days
const EVENT_CAP = 1500;

export function readStorage(key, fallback) {
  try { const v = localStorage.getItem(key); return v !== null ? JSON.parse(v) : fallback; }
  catch { return fallback; }
}
export function writeStorage(key, value) {
  try { localStorage.setItem(key, JSON.stringify(value)); } catch {}
}

/* ---- settings ---- */
export const DEFAULT_SETTINGS = {
  // Default to effort/process praise (Dweck-aligned) rather than trait hype;
  // the louder "fun" persona stays available as an opt-in in Grown-up settings.
  voiceStyle: "encouraging",
  exerciseRestSeconds: 5,
  roundRestSeconds: 25,
  sectionRestSeconds: 30,   // NEW (block break; old app hardcoded 8s)
  secondsPerRep: 3,
  coachVoiceOn: true,       // NEW: design's 🎧 toggle gates ALL coach audio
  athleteName: "Jenn",      // NEW: editable in Grown-up Settings
  prizePool: null,          // NEW: null = default PRIZE_POOL
  cloudMirror: true         // NEW: privacy — mirror completed sessions to Firestore
};

export let settings = loadSettings();

export function loadSettings() {
  return { ...DEFAULT_SETTINGS, ...readStorage(SETTINGS_KEY, {}) };
}
export function saveSettings() {
  writeStorage(SETTINGS_KEY, settings);
}
export function updateSettings(patch) {
  Object.assign(settings, patch);
  saveSettings();
}
export function activePrizePool() {
  const pool = settings.prizePool;
  return Array.isArray(pool) && pool.length ? pool : PRIZE_POOL;
}

export const MIN_REST = 3;
export function configuredExerciseRest() {
  const v = Number(settings.exerciseRestSeconds);
  return Math.min(120, Math.max(MIN_REST, Number.isFinite(v) ? Math.round(v) : DEFAULT_SETTINGS.exerciseRestSeconds));
}
export function configuredRoundRest() {
  const v = Number(settings.roundRestSeconds);
  return Math.min(180, Math.max(10, Number.isFinite(v) ? Math.round(v) : DEFAULT_SETTINGS.roundRestSeconds));
}
export function configuredSectionRest() {
  const v = Number(settings.sectionRestSeconds);
  return Math.min(90, Math.max(5, Number.isFinite(v) ? Math.round(v) : DEFAULT_SETTINGS.sectionRestSeconds));
}

/* ---- sessions log (source of truth for streaks/progress/analytics) ---- */
export function loadSessions() { return readStorage(LS_SESSIONS, []); }
export function saveSession(entry) {
  const all = loadSessions();
  all.push(entry);
  writeStorage(LS_SESSIONS, all);
}
/* Patch the most recent session record (mood / reflection / pr live
   alongside lightResult — closes the readiness→outcome gap). */
export function patchLastSession(patch) {
  const all = loadSessions();
  if (!all.length) return;
  all[all.length - 1] = { ...all[all.length - 1], ...patch };
  writeStorage(LS_SESSIONS, all);
}
export function thisWeekSessions() {
  const monday = mondayOfThisWeek();
  return loadSessions().filter(s => new Date(s.isoDate) >= monday);
}

export function daysAgoCount(sessions, days) {
  const cutoff = Date.now() - days * DAY_MS;
  return sessions.filter(s => s.isoDate && new Date(s.isoDate).getTime() >= cutoff);
}
export function sumSecs(sessions) { return sessions.reduce((a, s) => a + (s.durationSecs || 0), 0); }

// Longest run of consecutive calendar days with ≥1 completed session.
export function longestStreak(sessions) {
  const days = [...new Set(sessions.map(s => edmontonISO(s.isoDate)).filter(Boolean))].sort();
  let best = 0, run = 0, prev = null;
  days.forEach(d => {
    if (prev && Math.round((new Date(d) - new Date(prev)) / DAY_MS) === 1) run++;
    else run = 1;
    prev = d; if (run > best) best = run;
  });
  return best;
}
// Current streak anchored to today/yesterday (Edmonton). Compares date
// STRINGS — Date objects here would mix UTC-parsed and local clocks and
// break the streak every morning.
export function currentStreak(sessions) {
  const days = [...new Set(sessions.map(s => edmontonISO(s.isoDate)).filter(Boolean))].sort();
  if (!days.length) return 0;
  const today = todayISODate();
  const y = new Date(today + "T12:00:00Z");
  y.setUTCDate(y.getUTCDate() - 1);
  const yesterday = y.toISOString().slice(0, 10);
  const last = days[days.length - 1];
  if (last !== today && last !== yesterday) return 0;
  // Streak "freeze": a single rest/missed day between active days does NOT break
  // the run (a gap of 1 or 2 calendar days both continue it). This stops the
  // streak from punishing a recovery day — which would otherwise pressure a kid
  // to train while sore just to keep the flame, defeating the readiness system.
  let streak = 1;
  let cur = new Date(last + "T12:00:00Z");
  for (let i = days.length - 2; i >= 0; i--) {
    const prev = new Date(days[i] + "T12:00:00Z");
    const gap = Math.round((cur - prev) / DAY_MS);
    if (gap >= 1 && gap <= 2) { streak++; cur = prev; } else break;
  }
  return streak;
}

/* ---- skip history ---- */
function pruneSkipHistory(items) {
  const cutoff = Date.now() - SKIP_RETENTION_MS;
  return (items || []).filter(item => item.createdAt >= cutoff);
}
export function loadSkipHistory() {
  const cleaned = pruneSkipHistory(readStorage(SKIP_HISTORY_KEY, []));
  writeStorage(SKIP_HISTORY_KEY, cleaned);
  return cleaned;
}
export function addSkipRecord(record) {
  const all = pruneSkipHistory(readStorage(SKIP_HISTORY_KEY, []));
  all.push(record);
  writeStorage(SKIP_HISTORY_KEY, all);
}

/* ---- analytics event stream ---- */
export function loadEvents() { return readStorage(LS_EVENTS, []); }
// Lightweight behavioural instrumentation. Never throws, never blocks a session.
export function logEvent(type, data) {
  try {
    const cutoff = Date.now() - EVENT_RETENTION_MS;
    let all = loadEvents().filter(e => (e.t || 0) >= cutoff);
    all.push({ t: Date.now(), iso: new Date().toISOString(), type, ...(data || {}) });
    if (all.length > EVENT_CAP) all = all.slice(all.length - EVENT_CAP);
    writeStorage(LS_EVENTS, all);
  } catch {}
}

/* ---- readiness (v2: 4-Q + body map) ---- */
export function loadReadiness() {
  const r = readStorage(LS_READINESS, null);
  return r && r.version === 2 ? r : null;   // old 8-Q payloads are ignored
}
export function saveReadiness(check) {
  writeStorage(LS_READINESS, { version: 2, when: Date.now(), ...check });
}

/* ---- day progress (same-day resume; No-Debt: partials never carry over) ---- */
function dayProgressKey(dayKey) { return `${dayKey}|${todayISODate()}`; }
export function loadDayProgress(dayKey) {
  const all = readStorage(LS_DAYPROG, {});
  return all[dayProgressKey(dayKey)] || null;
}
export function saveDayProgress(dayKey, p) {
  const all = readStorage(LS_DAYPROG, {});
  const today = todayISODate();
  Object.keys(all).forEach(k => { if (!k.endsWith("|" + today)) delete all[k]; });
  all[dayProgressKey(dayKey)] = p;
  writeStorage(LS_DAYPROG, all);
}
export function clearDayProgress(dayKey) {
  const all = readStorage(LS_DAYPROG, {});
  delete all[dayProgressKey(dayKey)];
  writeStorage(LS_DAYPROG, all);
}

/* ---- valgus gate ---- */
export function loadGate() { return readStorage(LS_GATE, { unlocked: false, cleanCount: 0 }); }
export function saveGate(g) { writeStorage(LS_GATE, g); }
export function gateLocked() { return !loadGate().unlocked; }

/* ---- Independence Ladder ---- */
export function loadLadderRungs() { return readStorage(LS_LADDER, {}); }
export function saveLadderRungs(r) { writeStorage(LS_LADDER, r); }

/* ---- learning records + quiz ---- */
export function loadLearning() { return readStorage(LS_LEARNING, []); }
export function saveLearning(l) { writeStorage(LS_LEARNING, l); }
/* Quiz blob. `items` is the per-MOVE mastery record the grown-up analytics
   reads. `qLedger` is the per-QUESTION XP ledger added alongside it: a move
   can be asked three ways (cue / watch-out / fix), so per-move records cannot
   tell "knows the cue" from "knows the fix" and are too coarse to price XP.
   `lastPaidISO` marks the day's one XP-paying deck. Old blobs are normalized
   on read, so a kid's existing mastery history survives untouched. */
export function loadQuiz() {
  const q = readStorage(LS_QUIZ, null) || {};
  return {
    items: q.items || {},
    results: q.results || [],
    streak: q.streak || 0,
    qLedger: q.qLedger || {},
    lastPaidISO: q.lastPaidISO || null,
    dayISO: q.dayISO || null,
    dayXp: q.dayXp || 0,
    ...(q._legacy ? { _legacy: q._legacy } : {})
  };
}
export function saveQuiz(q) { writeStorage(LS_QUIZ, q); }

/* ---- quiz XP economy ----------------------------------------------------
   XP pays for LEARNING, not for repetition. Three rules together:

   1. One paying deck per calendar day (`lastPaidISO`). Every later deck the
      same day is free practice worth 0 XP — still fully playable, and it never
      touches the ledger, so practising can't spend tomorrow's budget.
   2. Each QUESTION pays at most once, ever: +10 the first time it is
      attempted, +25 the first time it is answered correctly. A question first
      seen and missed still pays its +25 later, when it is finally learned.
   3. A daily ceiling (`QXP_DAILY_CAP`) across ALL quiz XP — the deck and the
      Coach's Quiz share it — so even a day full of brand-new questions stays
      well under one training session. Questions are paid whole or not at all:
      once the day's budget can't cover the next one, its ledger entry is left
      untouched and it is still worth full value tomorrow.

   Why: the old rule was `score*25 + answered*10` per deck, with no cap, no
   cooldown and no memory. Because the deck reveals the correct answer after
   every pick, one honest pass taught the answers and every replay after that
   was a guaranteed 8/8 = 280 XP — roughly 370 XP per minute of tapping, or a
   level every two minutes, which is more than a whole training session. Worse,
   `answered*10` paid out even when every answer was wrong, so it rewarded
   tapping rather than knowing.

   Because the bank is finite, these rules make the quiz's LIFETIME yield
   finite and knowable (87 questions × 35 = 3,045 XP), spread over at least 29
   days by rules 1 and 3. Training stays the only open-ended way up. */
export const QXP_ATTEMPT = 10;   // once per question, first time attempted
export const QXP_CORRECT = 25;   // once per question, first time correct
/* Three brand-new questions a day (3 × 35). A full training day pays 180–275,
   so the quiz can never out-earn getting on the mat. */
export const QXP_DAILY_CAP = 105;

export function quizQuestionKey(move, kind) { return move + "|" + kind; }

/* Quiz XP already banked today, across the deck and the Coach's Quiz. */
export function quizXpToday(quiz) {
  const q = quiz || loadQuiz();
  return q.dayISO === todayISODate() ? (q.dayXp || 0) : 0;
}
export function quizXpLeftToday(quiz) {
  return Math.max(0, QXP_DAILY_CAP - quizXpToday(quiz));
}

/* Price one answered question against the ledger and bank the XP it earns.
   Returns what it paid and why, so the caller can say so on screen. Callers
   are responsible for the once-a-day deck rule; the ledger itself only ever
   pays for something new, and only while the day's budget covers it whole. */
export function payQuizQuestion(key, correct, quiz) {
  const q = quiz || loadQuiz();
  const rec = q.qLedger[key] || { attempted: false, mastered: false };
  const wouldPay = (rec.attempted ? 0 : QXP_ATTEMPT) + (!rec.mastered && correct ? QXP_CORRECT : 0);
  // Nothing new to pay for: the question is spent, not capped.
  if (!wouldPay) return { xp: 0, firstSeen: false, newlyMastered: false, capped: false };
  // Over the day's ceiling: leave the ledger alone so the question keeps its
  // full value for tomorrow.
  if (wouldPay > quizXpLeftToday(q)) return { xp: 0, firstSeen: false, newlyMastered: false, capped: true };

  const firstSeen = !rec.attempted;
  const newlyMastered = !rec.mastered && !!correct;
  const spentToday = quizXpToday(q);   // read BEFORE rolling dayISO to today
  rec.attempted = true;
  if (newlyMastered) rec.mastered = true;
  q.qLedger[key] = rec;
  q.dayISO = todayISODate();
  q.dayXp = spentToday + wouldPay;
  if (!quiz) saveQuiz(q);        // caller-owned blobs are saved by the caller
  return { xp: wouldPay, firstSeen, newlyMastered, capped: false };
}

/* Every move the app can ask about, de-duplicated across the week. */
let _movePoolCache = null;
export function movePool() {
  if (_movePoolCache) return _movePoolCache;
  const seen = {}, pool = [];
  Object.values(DAYS).forEach(day => {
    const blocks = day.blocks || {}; const rec = day.recovery || [];
    [].concat(...Object.values(blocks), day.prepMenu || [], rec).forEach(ex => {
      if (!ex || !ex.name || seen[ex.name]) return; seen[ex.name] = true;
      pool.push({ name: ex.name, cue: ex.cue || "", watch: ex.parentWatch || "", fix: ex.redFlag || "", block: ex.block || "" });
    });
  });
  _movePoolCache = pool; return pool;
}

/* Every askable question: one per (move, kind) that actually has content. */
export function questionBank() {
  const bank = [];
  movePool().forEach(m => {
    if (m.cue) bank.push([m, "cue"]);
    if (m.watch) bank.push([m, "watch"]);
    if (m.fix) bank.push([m, "fix"]);
  });
  return bank;
}

/* Has today's one paying deck already been completed? */
export function quizPaidToday(quiz) {
  return (quiz || loadQuiz()).lastPaidISO === todayISODate();
}

/* Mastery + remaining-XP snapshot over the whole bank. Feeds the kid's
   "moves mastered" goal and the grown-up's quiz card. */
export function quizBankStatus(quiz) {
  const led = (quiz || loadQuiz()).qLedger || {};
  const bank = questionBank();
  let mastered = 0, xpLeft = 0;
  bank.forEach(([m, k]) => {
    const rec = led[quizQuestionKey(m.name, k)] || {};
    if (rec.mastered) mastered++; else xpLeft += QXP_CORRECT;
    if (!rec.attempted) xpLeft += QXP_ATTEMPT;
  });
  return { total: bank.length, mastered, left: bank.length - mastered, xpLeft,
           xpTotal: bank.length * (QXP_ATTEMPT + QXP_CORRECT) };
}

/* ---- PR log ---- */
export function loadPrLog() { return readStorage(LS_PRLOG, []); }
export function addPrLog(entry) {
  const all = loadPrLog();
  all.push(entry);
  writeStorage(LS_PRLOG, all.slice(-60));
}

/* ---- 4-week tracker (PR board) ---- */
export function loadTracker() {
  const raw = readStorage(LS_TRACKER, {});
  return {
    _startISO: raw._startISO,
    week1: raw.week1 || {}, week2: raw.week2 || {},
    week3: raw.week3 || {}, week4: raw.week4 || {}
  };
}
export function saveTracker(t) { writeStorage(LS_TRACKER, t); }
export function getCurrentTrackerWeek() {
  const t = loadTracker();
  if (!t._startISO) {
    t._startISO = new Date().toISOString();
    saveTracker(t);
  }
  const start = new Date(t._startISO);
  const days = Math.floor((new Date() - start) / DAY_MS);
  return Math.min(4, Math.max(1, Math.floor(days / 7) + 1));
}

/* ---- weekly engagement pick (Peer Challenge / Role Flip) ---- */
export function weekKeyFor(date) {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  const dow = d.getDay();
  const diff = dow === 0 ? 1 : 1 - dow;  // upcoming/this Monday
  d.setDate(d.getDate() + diff);
  return d.toISOString().slice(0, 10);
}
export function activeEngagement(date) {
  const all = readStorage(ENGAGE_KEY, {});
  return all[weekKeyFor(date || new Date())] || null;
}
export function setEngagementPick(systemKey) {
  const all = readStorage(ENGAGE_KEY, {});
  const monday = new Date();
  monday.setDate(monday.getDate() + 1);   // picking on Sunday applies to the coming week
  all[weekKeyFor(monday)] = systemKey;
  writeStorage(ENGAGE_KEY, all);
}

/* ============================================================
   JOURNEY — XP, level, rank, prizes. XP, prizes, and ranks.
   XP rules: session complete = (moves×10 + 40) × rounds factor
   (spa = 0); quiz pays for first-time learning only — see the
   quiz XP economy above.
   ============================================================ */

export function loadJourney() {
  return readStorage(LS_JOURNEY, null);
}
export function saveJourney(j) { writeStorage(LS_JOURNEY, j); }

/* Effort multiplier for the rounds actually trained. A red-light 1-round day
   and a full green 3-round day used to pay exactly the same — the round count
   never reached the XP at all — so showing up paid as well as working. A
   1-round day is now worth half a 3-round day:

     1 round ×0.5   2 rounds ×0.75   3 rounds ×1.0 (unchanged)

   The full-day value is the anchor here (unlike the swim app, which anchors on
   the 1-round day and doubles full days): this ladder's climb to Eternal Edge
   is already paced for a December summit at the current rate, and raising the
   full-day rate would pull the whole ladder forward by months.

   Only records written by this version (xpVersion 3) are scaled. Legacy rows
   keep the flat value they were awarded, so a cloud restore of an old
   red-light session re-awards what it originally paid instead of halving it. */
export const XP_VERSION = 3;
export function roundsFactor(entry) {
  if (!entry || entry.xpVersion !== XP_VERSION) return 1;
  const rounds = Math.min(3, Math.max(1, entry.roundsDone || 1));
  return 0.25 + rounds * 0.25;   // 1 → 0.5, 2 → 0.75, 3 → 1.0
}

export function xpForSession(entry) {
  if (entry.sessionType === "spa" || entry.session === "spa" || entry.spa) return 0;
  // Legacy V2 rows mark recovery days via light/lightResult instead of spa.
  if (entry.light === "recovery" || entry.lightResult === "recovery") return 0;
  const moves = (entry.perExercise && entry.perExercise.length) ||
                entry.movesDone || entry.moves || 6;
  // Skate-specific bonus: +5 XP per clean frozen landing (kept from V2 so
  // historical seeding and new sessions reward the same thing). Landings are
  // already counted once per round, so the rounds factor must not scale them
  // a second time.
  const cleanBonus = 5 * (entry.cleanLandings || 0);
  return Math.round((moves * 10 + 40) * roundsFactor(entry)) + cleanBonus;
}

/* Level for a cumulative XP total, plus progress into the current level. */
export function levelFromXp(xp) {
  let level = 1, rem = xp;
  while (rem >= levelCost(level)) { rem -= levelCost(level); level++; }
  return { level, xpIntoLevel: rem, nextCost: levelCost(level) };
}

/* Add XP; returns { journey, leveledUp, levelsGained }. */
export function addXp(amount) {
  const j = loadJourney() || { xp: 0, prizesWon: [], pendingDraws: 0 };
  const before = levelFromXp(j.xp).level;
  j.xp = Math.max(0, (j.xp || 0) + amount);
  const after = levelFromXp(j.xp).level;
  const gained = Math.max(0, after - before);
  if (gained > 0) j.pendingDraws = (j.pendingDraws || 0) + gained;
  saveJourney(j);
  return { journey: j, leveledUp: gained > 0, levelsGained: gained };
}

export function pendingDrawCount() {
  const j = loadJourney();
  return j ? Math.max(0, j.pendingDraws || 0) : 0;
}

export function addPrize(prize) {
  const j = loadJourney() || { xp: 0, prizesWon: [], pendingDraws: 0 };
  j.prizesWon = [{ ...prize, date: todayISODate(), redeemed: false, id: Date.now() }, ...(j.prizesWon || [])];
  j.pendingDraws = Math.max(0, (j.pendingDraws || 0) - 1);
  saveJourney(j);
  return j;
}
export function redeemPrize(id) {
  const j = loadJourney();
  if (!j) return null;
  j.prizesWon = (j.prizesWon || []).map(p => p.id === id ? { ...p, redeemed: !p.redeemed } : p);
  saveJourney(j);
  return j;
}

/* One-time idempotent seeding + legacy V2 upgrades. If the journey key is
   absent, walk the existing session history and award XP retroactively —
   nothing the kid earned ever vanishes. An EXISTING journey is never
   re-seeded (that would rewrite earned XP); it is only normalized. */
export function migrate() {
  // merge any new default settings keys into the saved blob
  settings = loadSettings();
  // Legacy prize pools were plain strings; the prize UI needs {icon,label}.
  if (Array.isArray(settings.prizePool)) {
    settings.prizePool = settings.prizePool.map(p =>
      typeof p === "string" ? { icon: "🎁", label: p } : p);
  }
  // testMode was a V2 setting; practice mode is now a per-launch choice.
  delete settings.testMode;
  saveSettings();
  try { localStorage.removeItem("skate_last_check"); } catch {}

  const j = loadJourney();
  if (j == null) {
    const xp = loadSessions().reduce((sum, s) => sum + xpForSession(s), 0);
    saveJourney({ xp, prizesWon: [], pendingDraws: 0, seededAt: Date.now() });
  } else if (Array.isArray(j.prizesWon) && j.prizesWon.some(p => p.id == null)) {
    // Old prize records carried only {label, when}; redeemPrize is id-based.
    j.prizesWon = j.prizesWon.map((p, i) => ({
      icon: p.icon || "🎁", label: p.label || String(p),
      date: p.date || (p.when ? String(p.when).slice(0, 10) : todayISODate()),
      redeemed: !!p.redeemed, id: p.id != null ? p.id : (p.when || "legacy-" + i)
    }));
    saveJourney(j);
  }

  // Legacy quiz blob {runs, bestPct, byMove} → {items, results, streak}.
  const q = readStorage(LS_QUIZ, null);
  if (q && q.runs && !q.results) {
    const items = {};
    Object.entries(q.byMove || {}).forEach(([move, rec]) => {
      const seen = rec.seen || 0, wrong = rec.missed || 0;
      items[move] = { right: Math.max(0, seen - wrong), wrong, seen };
    });
    const results = (q.runs || []).map(r => ({ t: r.when || Date.now(), score: r.correct || 0, total: r.total || 0 })).slice(-40);
    saveQuiz({ items, results, streak: 0, _legacy: q });
  }
}

/* ============================================================
   STORE — localStorage persistence, settings, session log,
   events, journey (XP/levels/prizes) and one-time migration.
   Local-first; Firestore mirroring happens in the engine.
   ============================================================ */

import { DAY_MS, mondayOfThisWeek, todayISODate, edmontonISO } from "./util.js";
import { DAYS, PRIZE_POOL, levelCost, LADDER, RANK_LORE } from "./data.js";

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

/* A full localStorage is silent by default: setItem throws, the old empty
   catch dropped it, and the app happily said "Training complete" over a
   session that was never recorded. Now a failed write frees the expendable
   analytics blobs, retries once, and — if it still fails — tells the app so a
   grown-up sees a banner instead of losing work invisibly. */
const EXPENDABLE_KEYS = [LS_EVENTS, SKIP_HISTORY_KEY, LS_PRLOG];
let _storageErrorHandler = null;
let _lastStorageError = null;
export function onStorageError(fn) { _storageErrorHandler = fn; }
export function lastStorageError() { return _lastStorageError; }

function reportStorageError(key, error) {
  _lastStorageError = { key, message: String(error && error.message || error), at: Date.now() };
  console.error("Storage write failed:", key, error);
  try { if (_storageErrorHandler) _storageErrorHandler(_lastStorageError); } catch {}
}

/* Drop analytics-only keys to make room. Never touches sessions, XP or prizes.
   Returns true only if something was actually removed. */
function freeSpace(protectKey) {
  let freed = false;
  EXPENDABLE_KEYS.forEach(k => {
    if (k === protectKey) return;
    try {
      if (localStorage.getItem(k) !== null) { localStorage.removeItem(k); freed = true; }
    } catch {}
  });
  return freed;
}

/* Returns whether the value actually reached storage. */
export function writeStorage(key, value) {
  let str;
  try { str = JSON.stringify(value); }
  catch (e) { reportStorageError(key, e); return false; }
  try { localStorage.setItem(key, str); return true; }
  catch (e) {
    if (freeSpace(key)) {
      try { localStorage.setItem(key, str); return true; } catch { /* still full */ }
    }
    reportStorageError(key, e);
    return false;
  }
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
  cloudMirror: true,        // NEW: privacy — mirror completed sessions to Firestore
  // Try-it mode sits in Grown-up Settings beside the coach voice and the rest
  // steppers, so it has to survive a reload like they do. It used to live only
  // in memory: a grown-up switched it on, the page reloaded, and it was
  // silently off again — the next run counted for real.
  practiceMode: false
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
   2. Each QUESTION pays at most once, ever: +5 the first time it is attempted,
      +25 the first time it is answered correctly. The two together are exactly
      one day's budget, so a brand-new question answered right pays in full. A question first
      seen and missed still pays its +25 later, when it is finally learned.
   3. A daily ceiling (`QXP_DAILY_CAP`) across ALL quiz XP — the deck and the
      Coach's Quiz share it — so even a day full of brand-new questions stays
      far under the LIGHTEST training day, not just under a full one. Questions are paid whole or not at all:
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
export const QXP_ATTEMPT = 5;    // once per question, first time attempted
export const QXP_CORRECT = 25;   // once per question, first time correct
/* One brand-new question a day (5 + 25). The lightest real training day — one
   round, or a mini — pays 180 XP before landings, so the day's whole quiz
   budget is a sixth of it. The cap is deliberately measured against the EASY
   day, not the full one: those are the days a kid is most tempted to tap
   through a quiz instead of training, and they must still be worth far more
   than it. At the old 105 the quiz could out-earn a light session outright. */
export const QXP_DAILY_CAP = 30;

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

/* Ranks the skater has actually reached, as quiz topics. Her rank stories are
   the best-read text in the app and nothing ever asked her about them; now the
   ladder itself teaches. Locked ranks are excluded on purpose — asking about a
   chapter she hasn't unlocked would spoil the mystery card AND quiz her on
   something she has never been shown. The pool therefore GROWS as she climbs,
   which is the point. */
export function rankPool(level) {
  const lvl = Number.isFinite(level) ? level : levelFromXp((loadJourney() || {}).xp || 0).level;
  return LADDER.filter(r => r.level <= lvl).map(r => {
    const lore = RANK_LORE[r.name] || {};
    return {
      name: "Rank: " + r.name,      // ledger key space of its own, never a move
      rank: r.name, icon: r.icon, block: "story",
      skill: lore.skate || "", fact: lore.fact || "", chapter: lore.chapter || ""
    };
  });
}

/* Every askable question: one per (topic, kind) that actually has content —
   the moves asked three ways, plus the unlocked rank stories asked two. */
export function questionBank(level) {
  const bank = [];
  movePool().forEach(m => {
    if (m.cue) bank.push([m, "cue"]);
    if (m.watch) bank.push([m, "watch"]);
    if (m.fix) bank.push([m, "fix"]);
  });
  rankPool(level).forEach(r => {
    if (r.skill) bank.push([r, "story"]);
    if (r.fact) bank.push([r, "fact"]);
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
  const bank = questionBank();   // unlocked ranks only, so this grows with her
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

/* A session pays a flat rate for the rounds actually trained. The old rule
   (moves × 10 + 40, ignoring rounds) meant a red-light 1-round day paid the
   same as a full green 3-round day — showing up paid as well as working — and
   the brief factor version still made the day's XP wobble with the move count
   of that weekday, for no reason a kid could see. A 1-round day is worth half
   a 3-round day:

     1 round 180 XP   2 rounds 270 XP   3 rounds 360 XP

   Matches the swim app exactly, so both sisters' apps price a training day the
   same way.

   A mini session is one shortened round, so it is priced as a 1-round day
   however the traffic light was set — otherwise "mini on a green day" would be
   the cheapest full-price session in the app.

   Only records written by this version are priced this way. Legacy rows keep
   the old formula, so a cloud restore re-awards what a session originally paid
   instead of re-pricing history. */
export const XP_VERSION = 4;
export const SESSION_XP = { 1: 180, 2: 270, 3: 360 };

export function sessionRounds(entry) {
  if (entry && entry.mini) return 1;
  return Math.min(3, Math.max(1, (entry && entry.roundsDone) || 1));
}

export function xpForSession(entry) {
  if (entry.sessionType === "spa" || entry.session === "spa" || entry.spa) return 0;
  // Legacy V2 rows mark recovery days via light/lightResult instead of spa.
  if (entry.light === "recovery" || entry.lightResult === "recovery") return 0;
  // Skate-specific bonus: +5 XP per clean frozen landing (kept from V2 so
  // historical seeding and new sessions reward the same thing). It rides on top
  // of the flat rate — it is the one part of the score that rewards HOW the
  // session went, not just that it happened.
  const cleanBonus = 5 * (entry.cleanLandings || 0);
  if (entry.xpVersion !== XP_VERSION) {
    const moves = (entry.perExercise && entry.perExercise.length) ||
                  entry.movesDone || entry.moves || 6;
    return moves * 10 + 40 + cleanBonus;           // legacy rows, unchanged
  }
  return SESSION_XP[sessionRounds(entry)] + cleanBonus;
}

/* XP a stored record is worth. Prefers what was actually awarded at the time;
   falls back to the formula (halved for an ended-early session, matching
   finalize()) for records restored from the cloud or written before xpEarned
   existed. */
export function sessionXp(entry) {
  if (Number.isFinite(entry && entry.xpEarned)) return Math.max(0, entry.xpEarned);
  const full = xpForSession(entry || {});
  return entry && entry.completedFully === false ? Math.round(full / 2) : full;
}

/* Level for a cumulative XP total, plus progress into the current level. */
export function levelFromXp(xp) {
  let level = 1, rem = xp;
  while (rem >= levelCost(level)) { rem -= levelCost(level); level++; }
  return { level, xpIntoLevel: rem, nextCost: levelCost(level) };
}

/* ---- prize draws --------------------------------------------------------
   A level-up grants ONE envelope draw, once, for good. The old rule kept a
   mutable `pendingDraws` counter that every path was free to add to, and four
   of them handed out prizes the skater had not trained for:

     1. a cloud restore or backup import replayed years of XP through addXp(),
        and the level jump from 1 to 21 minted TWENTY draws in one boot;
     2. rebuildJourneyXp() did the same on the second device;
     3. merges took max(local, cloud) of the counter, so claiming three draws
        and then syncing with a device that still read three handed them back;
     4. re-importing your own backup file after claiming did the same, on
        demand, as many times as you liked.

   Draws are now DERIVED from two facts that can only ever move up, so no
   replay of history can invent one:

       pending  =  drawsEarned  -  prizes already in the wallet

   `drawsEarned` only grows when the skater crosses a level boundary she has
   never crossed before (`drawLevel` is the high-water mark), and the wallet
   already unions by id across devices — so a prize claimed anywhere counts
   as claimed everywhere. Both halves merge by max, which makes every restore,
   import and sync idempotent.

   Backfills — a restore, an import, a rebuild — advance the high-water mark
   without granting anything: that XP was earned on another device, which
   already gave its draws and mirrors the prizes it won. */

/* A single earning action can never cross two level boundaries: the biggest
   session pays 360 + landings and a whole day of quiz is capped at 30, while
   the cheapest level costs 500. So more than one level at a time is always a
   backfill, and only ever one draw is granted. */
export const MAX_DRAWS_PER_AWARD = 1;

/* The bug bounty. The over-granting above ran for a while before it was
   caught, and the skater who caught it was the one holding the inflated
   wallet — so she keeps two envelopes on top of what her level earns rather
   than being trimmed flat to it. Finding the hole is worth something. */
export const PRIZE_BONUS = 2;

/* The most envelopes a skater may have been given by a given level.

   Honest play never comes near it: a level earns one envelope, so a straight
   run sits at level-1, three below the cap. It binds only on a wallet the old
   bug inflated — and it is a STANDING cap, re-applied on every read and every
   write, not a one-time trim. That matters because the journey merges by
   max(local, cloud): a one-time trim would be undone by the first sync with a
   device still holding the inflated count, or by re-importing an old backup.
   As an invariant it simply re-applies, wherever the number came from. */
export function drawCap(level) { return level + PRIZE_BONUS; }

/* Hold drawsEarned to the cap. Only the UNCLAIMED backlog can shrink: prizes
   already in the wallet stay there, because she picked them and may well have
   spent them in the real world. If the wallet alone already exceeds the cap,
   pendingFor() floors at 0 and she simply draws nothing more until her level
   catches up. */
function capDraws(j) {
  const cap = drawCap(levelFromXp(j.xp || 0).level);
  if ((j.drawsEarned || 0) > cap) j.drawsEarned = cap;
  return j;
}

function blankJourney() {
  return { xp: 0, prizesWon: [], drawsEarned: 0, drawLevel: 1 };
}

/* Fill in the derived fields a legacy blob predates, without granting
   anything: whatever was pending at the time is preserved (up to the cap),
   and the level already reached becomes the high-water mark so its history
   can't pay twice. */
function normalizeDraws(j) {
  if (!Array.isArray(j.prizesWon)) j.prizesWon = [];
  if (!Number.isFinite(j.drawsEarned)) {
    j.drawsEarned = j.prizesWon.length + Math.max(0, j.pendingDraws || 0);
  }
  if (!Number.isFinite(j.drawLevel)) j.drawLevel = levelFromXp(j.xp || 0).level;
  return capDraws(j);
}

/* The journey, always present and always normalized. */
function readJourney() {
  return normalizeDraws(loadJourney() || blankJourney());
}

function pendingFor(j) {
  return Math.max(0, (j.drawsEarned || 0) - (j.prizesWon || []).length);
}

/* Save, keeping the legacy `pendingDraws` field as a read-only mirror so an
   older build cached on the same device still reads the right number. Every
   write goes through here, which is what makes the cap an invariant rather
   than a migration: there is no path that can store more than it. */
function persistJourney(j) {
  capDraws(j);
  j.pendingDraws = pendingFor(j);
  saveJourney(j);
  return j;
}

/* Move the high-water mark to the level the XP total now buys. Grants a draw
   for a boundary newly crossed unless this is a backfill. Returns how many
   draws were granted. */
function claimLevelDraws(j, { grant = true } = {}) {
  const level = levelFromXp(j.xp || 0).level;
  if (level <= j.drawLevel) return 0;
  const granted = grant ? Math.min(level - j.drawLevel, MAX_DRAWS_PER_AWARD) : 0;
  j.drawsEarned = (j.drawsEarned || 0) + granted;
  j.drawLevel = level;
  return granted;
}

/* Add XP; returns { journey, leveledUp, levelsGained }. `leveledUp` is what
   puts the "Pick your prize" button on screen, so it means "there is a draw
   to spend", not merely "the number went up" — a backfill moves the level
   without earning an envelope.

   Pass { grantDraws: false } for XP that is being re-derived rather than
   earned (a cloud restore, a backup import). */
export function addXp(amount, { grantDraws = true } = {}) {
  const j = readJourney();
  const before = levelFromXp(j.xp).level;
  j.xp = Math.max(0, (j.xp || 0) + amount);
  const after = levelFromXp(j.xp).level;
  const granted = claimLevelDraws(j, { grant: grantDraws });
  persistJourney(j);
  return { journey: j, leveledUp: granted > 0, levelsGained: Math.max(0, after - before) };
}

/* Record that XP already granted through addXp() came from a session record.
   Keeps the reconcile baseline honest — without this, the next cloud restore
   would see the session log grow and award the same XP a second time. */
export function noteSessionXpAwarded(amount) {
  if (!amount) return;
  const j = readJourney();
  j.sessionXp = (Number.isFinite(j.sessionXp) ? j.sessionXp : 0) + amount;
  persistJourney(j);
}

/* ---- cloud restore ------------------------------------------------------
   The Firestore mirror was write-only: sessions went up and nothing ever read
   them back, so a cleared localStorage wiped everything the kid had earned
   while a full copy sat intact in the cloud. These two functions close that
   loop; js/sync.js calls them once per boot. */

export function sessionKey(s) {
  return String(s && s.isoDate || "") + "|" + String(s && s.dayKey || "");
}
function stripCloudFields(doc) {
  const { id, createdAt, ...entry } = doc || {};
  return entry;
}

/* Additive and idempotent: the cloud can only ADD sessions this device is
   missing. Nothing local is ever overwritten or deleted. Returns how many
   were added. */
export function mergeSessions(incoming) {
  const local = loadSessions();
  const seen = new Set(local.map(sessionKey));
  let added = 0;
  (incoming || []).forEach(doc => {
    const entry = stripCloudFields(doc);
    if (!entry.isoDate) return;
    const key = sessionKey(entry);
    if (seen.has(key)) return;
    seen.add(key);
    local.push(entry);
    added++;
  });
  if (added) {
    local.sort((a, b) => String(a.isoDate).localeCompare(String(b.isoDate)));
    writeStorage(LS_SESSIONS, local);
  }
  return added;
}

/* ---- journey convergence across devices ---------------------------------
   The same skater read level 26 on the iPad and 18 on the desktop. Both were
   honest: only SESSIONS were mirrored, so the wiped desktop rebuilt the
   training XP and nothing else, while the iPad still held years of quiz XP
   earned under the old uncapped rules on top of it.

   The fix is to stop treating XP as a running total that each device
   accumulates privately, and treat it as DERIVED state:

       xp  =  what the training log is worth  +  what the quiz ledger is worth

   Both halves are mirrored, so every device computes the same number without
   anyone having to win an argument about whose total is right. It is also
   idempotent — rebuilding twice changes nothing — and un-farmable, because the
   ledger already pays each question exactly once.

   The level lands on the training number (18 here), which is the one the
   grown-up asked for: XP you can point at a session for. */

/* What the quiz ledger is worth, priced at the current rates. */
export function quizXpFromLedger(quiz) {
  const q = quiz || loadQuiz();
  let xp = 0;
  Object.values(q.qLedger || {}).forEach(rec => {
    if (!rec) return;
    if (rec.attempted) xp += QXP_ATTEMPT;
    if (rec.mastered) xp += QXP_CORRECT;
  });
  return xp;
}

/* Recompute the journey total from its two sources. Prizes already won are
   never touched, and no draw is granted: this is a re-derivation of XP that
   was earned elsewhere, and the device that earned it already paid out its
   envelopes — mergeCloudJourney carries them over. Returns the total. */
export function rebuildJourneyXp() {
  const j = readJourney();
  const fromSessions = loadSessions().reduce((sum, s) => sum + sessionXp(s), 0);
  const fromQuiz = quizXpFromLedger();
  j.sessionXp = fromSessions;
  j.xp = fromSessions + fromQuiz;
  claimLevelDraws(j, { grant: false });
  persistJourney(j);
  return j.xp;
}

/* The half of the journey the session log cannot re-derive: the quiz ledger
   (which prices itself), the prize wallet and the draw ledger. */
export function journeySnapshot() {
  const j = readJourney();
  const q = loadQuiz();
  return {
    kind: "journey",
    prizesWon: j.prizesWon || [],
    drawsEarned: j.drawsEarned || 0,
    drawLevel: j.drawLevel || 1,
    // Derived mirror, for an older build reading this snapshot.
    pendingDraws: pendingFor(j),
    qLedger: q.qLedger || {},
    quizItems: q.items || {},
    updatedAt: Date.now()
  };
}

/* How many draws a snapshot represents. Snapshots written by an older build
   carry only the mutable counter, so reconstruct the total from it. */
function incomingDrawsEarned(snap) {
  if (Number.isFinite(snap && snap.drawsEarned)) return snap.drawsEarned;
  return ((snap && snap.prizesWon) || []).length + Math.max(0, (snap && snap.pendingDraws) || 0);
}

/* Merge a cloud journey snapshot into this device. Everything moves UP: prize
   wallets union by id, and a question mastered anywhere counts as mastered
   everywhere, so the same learning can never be paid for twice. Returns true
   when something changed. */
export function mergeCloudJourney(snap) {
  if (!snap || snap.kind !== "journey") return false;
  let changed = false;

  const j = readJourney();
  const wallet = new Map();
  [...(j.prizesWon || []), ...(snap.prizesWon || [])].forEach(p => {
    if (p && p.id != null && !wallet.has(p.id)) wallet.set(p.id, p);
  });
  if (wallet.size !== (j.prizesWon || []).length) changed = true;
  // Both halves of the draw ledger move UP only, which is what makes a sync
  // idempotent: a stale snapshot can no longer resurrect draws this device has
  // already spent, because the prizes it bought are in the wallet above.
  const earned = Math.max(j.drawsEarned || 0, incomingDrawsEarned(snap));
  if (earned !== (j.drawsEarned || 0)) changed = true;
  j.drawsEarned = earned;
  j.drawLevel = Math.max(j.drawLevel || 1, snap.drawLevel || 1);
  j.prizesWon = [...wallet.values()]
    .sort((a, b) => String(b.date || "").localeCompare(String(a.date || "")));
  persistJourney(j);

  // A question mastered on the iPad must not pay again on the desktop.
  const q = loadQuiz();
  Object.entries(snap.qLedger || {}).forEach(([k, rec]) => {
    const cur = q.qLedger[k] || { attempted: false, mastered: false };
    const next = {
      attempted: !!(cur.attempted || (rec && rec.attempted)),
      mastered: !!(cur.mastered || (rec && rec.mastered))
    };
    if (next.attempted !== cur.attempted || next.mastered !== cur.mastered) changed = true;
    q.qLedger[k] = next;
  });
  Object.entries(snap.quizItems || {}).forEach(([move, rec]) => {
    const cur = q.items[move] || { right: 0, wrong: 0, seen: 0 };
    q.items[move] = {
      right: Math.max(cur.right || 0, (rec && rec.right) || 0),
      wrong: Math.max(cur.wrong || 0, (rec && rec.wrong) || 0),
      seen:  Math.max(cur.seen  || 0, (rec && rec.seen)  || 0)
    };
  });
  saveQuiz(q);
  return changed;
}

/* Keep the XP total consistent with the session log without double-counting
   quiz XP (which has no session record). The journey remembers how much of its
   XP came from sessions; when the log grows behind its back — a cloud restore —
   only the difference is awarded. The first call just establishes the baseline
   and awards nothing.

   The XP is restored; the prize draws are NOT. A log that grows behind the
   app's back is a backfill of training another device already paid for, and
   awarding its level-ups here is what let a wiped phone hand a kid twenty
   envelopes on its first boot. Prizes come back through the wallet merge.
   Returns the XP added. */
export function reconcileJourneyWithSessions() {
  const total = loadSessions().reduce((sum, s) => sum + sessionXp(s), 0);
  const j = readJourney();
  if (!Number.isFinite(j.sessionXp)) {
    j.sessionXp = total;
    persistJourney(j);
    return 0;
  }
  const delta = total - j.sessionXp;
  if (delta <= 0) return 0;
  j.sessionXp = total;
  persistJourney(j);                       // record the new baseline before awarding
  addXp(delta, { grantDraws: false });     // re-reads the journey, so it keeps sessionXp
  return delta;
}

/* ============================================================
   BACKUP — one JSON file holding everything this skater owns
   (XP, prizes, quiz mastery, trackers, settings), so there is a
   recovery path that doesn't depend on the cloud mirror.
   ============================================================ */
export const BACKUP_APP = "skate-with-grace-dryland";
export const BACKUP_SCHEMA = 1;

/* Every key that belongs to the skater. */
export const PROFILE_KEYS = [
  SETTINGS_KEY, PROGRESS_KEY, SKIP_HISTORY_KEY, ENGAGE_KEY, LS_READINESS, LS_DAYPROG,
  LS_LEARNING, LS_LADDER, LS_QUIZ, LS_GATE, LS_SESSIONS, LS_TRACKER, LS_EVENTS,
  LS_PRLOG, LS_JOURNEY
];

/* True when nothing in the saved settings differs from the shipped defaults. */
function isDefaultSettings(saved) {
  if (!saved || typeof saved !== "object") return true;
  return Object.keys(DEFAULT_SETTINGS).every(k =>
    saved[k] === undefined || JSON.stringify(saved[k]) === JSON.stringify(DEFAULT_SETTINGS[k]));
}

export function exportProfileData() {
  const data = {};
  PROFILE_KEYS.forEach(k => {
    const v = readStorage(k, undefined);
    if (v !== undefined) data[k] = v;
  });
  return {
    app: BACKUP_APP, schema: BACKUP_SCHEMA,
    exportedAt: new Date().toISOString(),
    profile: { name: settings.athleteName || "Jenn" },
    data
  };
}

/* Restoring only ADDS: sessions are merged and deduped, the higher XP total
   wins, prize wallets are unioned by id, and every other record fills in only
   where this device has nothing.
   Returns { sessionsAdded, xpAdded, filled: [keys] }. Throws on a file that
   isn't one of ours. */
export function importProfileData(payload) {
  if (!payload || payload.app !== BACKUP_APP || !payload.data || typeof payload.data !== "object") {
    throw new Error("That file isn't a Skate with Grace backup.");
  }
  if (Number(payload.schema) > BACKUP_SCHEMA) {
    throw new Error("That backup was made by a newer version of the app.");
  }
  const d = payload.data;
  const result = { sessionsAdded: 0, xpAdded: 0, filled: [] };

  if (Array.isArray(d[LS_SESSIONS])) result.sessionsAdded = mergeSessions(d[LS_SESSIONS]);

  const inc = d[LS_JOURNEY];
  if (inc && typeof inc === "object") {
    const local = readJourney();
    const wallet = new Map();
    [...(local.prizesWon || []), ...(inc.prizesWon || [])].forEach(p => {
      if (p && !wallet.has(p.id)) wallet.set(p.id, p);
    });
    persistJourney({
      ...inc, ...local,
      xp: Math.max(local.xp || 0, inc.xp || 0),
      // Draws move up only, and the wallet counts the ones already spent — so
      // re-importing the same file after claiming can't hand them out again.
      drawsEarned: Math.max(local.drawsEarned || 0, incomingDrawsEarned(inc)),
      drawLevel: Math.max(local.drawLevel || 1, inc.drawLevel || 1),
      sessionXp: Math.max(
        Number.isFinite(local.sessionXp) ? local.sessionXp : 0,
        Number.isFinite(inc.sessionXp) ? inc.sessionXp : 0
      ),
      prizesWon: [...wallet.values()].sort((a, b) => String(b.date || "").localeCompare(String(a.date || "")))
    });
  }

  PROFILE_KEYS.forEach(k => {
    if (k === LS_SESSIONS || k === LS_JOURNEY || d[k] === undefined) return;
    // Settings are the exception to "fill only what's missing": migrate() always
    // writes them, so they'd never look missing. Untouched defaults count as
    // empty — a fresh device gets her name, rest times and prize pool back, and
    // anything a grown-up has actually changed here still wins.
    if (k === SETTINGS_KEY) {
      if (isDefaultSettings(readStorage(k, null))) { writeStorage(k, d[k]); result.filled.push(k); }
      return;
    }
    if (readStorage(k, null) === null) { writeStorage(k, d[k]); result.filled.push(k); }
  });

  result.xpAdded = reconcileJourneyWithSessions();
  return result;
}

/* How many of a limited prize are still available. A prize with no `qty` is
   unlimited and returns Infinity.

   The count is derived from the wallet rather than kept as its own tally.
   prizesWon is the permanent, id-merged record of every prize ever claimed —
   nothing prunes it — so "six minus the ones she holds" cannot drift from what
   she actually has, and it survives a sync from another device. A separate
   counter would be a second source of truth for the same fact, and the merge
   would have to reconcile the two. */
export function prizeRemaining(prize, journey) {
  if (!prize || prize.qty == null) return Infinity;
  const j = journey !== undefined ? journey : loadJourney();
  const won = ((j && j.prizesWon) || []).filter(p => p.label === prize.label).length;
  return Math.max(0, prize.qty - won);
}

/* The prizes a draw can still deal — a used-up limited prize drops out. */
export function drawablePool() {
  const j = loadJourney();
  const pool = activePrizePool();
  const live = pool.filter(p => prizeRemaining(p, j) > 0);
  // Only reachable if a grown-up trimmed the pool down to limited prizes and
  // the skater exhausted every one. Dealing a spent prize is wrong, but so is
  // handing a kid an empty level-up envelope, so the full pool wins that
  // trade-off — and the Settings list shows "0 left" to explain why.
  return live.length ? live : pool;
}

export function pendingDrawCount() {
  const j = loadJourney();
  return j ? pendingFor(normalizeDraws(j)) : 0;
}

/* Spend one draw on the envelope the skater picked. Returns null — and adds
   nothing — when there is no draw to spend, so a draw overlay left open while
   a sync lands behind it can't mint a prize on its own.

   The id has to be unique: the wallet merges by id across devices, so two
   prizes claimed in the same millisecond used to collapse into one and the
   kid silently LOST one on the next sync. */
export function addPrize(prize) {
  const j = readJourney();
  if (pendingFor(j) < 1) return null;
  const used = new Set(j.prizesWon.map(p => p.id));
  let id = Date.now();
  while (used.has(id)) id++;
  j.prizesWon = [{ ...prize, date: todayISODate(), redeemed: false, id }, ...j.prizesWon];
  return persistJourney(j);
}
/* Toggle a prize between won and used.

   Ids are compared as text on purpose. A prize claimed by this version has a
   numeric id, but migrate() gives the oldest records `p.when || "legacy-" + i`
   — and a record with no timestamp lands on a STRING. The click path can only
   hand an id back as a string (it rides through a data-arg attribute), so a
   strict === against a numeric id needed a Number() coercion, and that
   coercion turned "legacy-1" into NaN: the button rendered, the tap did
   nothing, and a prize she actually won could never be marked used.

   Comparing as text takes both shapes without rewriting a single stored id —
   which matters, because the wallet merges by id across devices. Minting new
   ids for those records would have to invent a timestamp they never had, and
   two devices inventing different ones would show the same prize twice. */
export function redeemPrize(id) {
  const j = loadJourney();
  if (!j) return null;
  j.prizesWon = (j.prizesWon || []).map(p =>
    String(p.id) === String(id) ? { ...p, redeemed: !p.redeemed } : p);
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
    // Backfill quantities onto a pool customized before prizes had them, so a
    // grown-up who had already edited the pool still gets the chore-skip cap
    // instead of an unlimited supply. Matched by label, and only when the
    // entry carries no qty of its own — an explicit quantity is never
    // overwritten.
    const defaultQty = new Map(PRIZE_POOL.filter(p => p.qty != null).map(p => [p.label, p.qty]));
    settings.prizePool = settings.prizePool.map(p =>
      (p && p.qty == null && defaultQty.has(p.label)) ? { ...p, qty: defaultQty.get(p.label) } : p);
  }
  // testMode was a V2 setting; practice mode is now a per-launch choice.
  delete settings.testMode;
  saveSettings();
  try { localStorage.removeItem("skate_last_check"); } catch {}

  const j = loadJourney();
  if (j == null) {
    // Seeding from existing history awards the XP but no envelopes: the
    // sessions were trained before this journey existed, so their level-ups
    // are not new. drawLevel starts at the level that XP already buys.
    const xp = loadSessions().reduce((sum, s) => sum + sessionXp(s), 0);
    saveJourney({ xp, prizesWon: [], drawsEarned: 0, drawLevel: levelFromXp(xp).level,
                  pendingDraws: 0, seededAt: Date.now() });
  } else {
    if (Array.isArray(j.prizesWon) && j.prizesWon.some(p => p.id == null)) {
      // Old prize records carried only {label, when}; redeemPrize is id-based.
      j.prizesWon = j.prizesWon.map((p, i) => ({
        icon: p.icon || "🎁", label: p.label || String(p),
        date: p.date || (p.when ? String(p.when).slice(0, 10) : todayISODate()),
        redeemed: !!p.redeemed, id: p.id != null ? p.id : (p.when || "legacy-" + i)
      }));
    }
    // Give a pre-draw-ledger journey its high-water mark. Anything pending
    // right now stays pending; nothing already earned mints a second time.
    persistJourney(normalizeDraws(j));
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

  // Establish the session-XP baseline BEFORE any cloud restore runs, so a
  // restore awards exactly the XP of the records it actually brings back.
  reconcileJourneyWithSessions();
}

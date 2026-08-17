/* ============================================================
   Smoke tests — run with `npm test` (Node ≥ 18, no dependencies).
   The app has no build step and runs in the browser, so these
   tests stub the few browser globals the ES modules touch at load
   (localStorage / window / document) and then exercise the pure
   logic: streak math, XP, readiness scoring + the pain-gate, quiz
   rotation, and that the view-models render to strings.
   ============================================================ */

globalThis.localStorage = (() => { const m = new Map(); return {
  getItem: k => (m.has(k) ? m.get(k) : null),
  setItem: (k, v) => m.set(k, String(v)),
  removeItem: k => m.delete(k), clear: () => m.clear() }; })();
globalThis.window = {
  speechSynthesis: { getVoices: () => [], speak() {}, cancel() {}, speaking: false, pending: false, set onvoiceschanged(f) {} },
  AudioContext: function () { this.state = "running"; this.currentTime = 0;
    this.createOscillator = () => ({ type: "", frequency: { value: 0 }, connect() {}, start() {}, stop() {} });
    this.createGain = () => ({ gain: { setValueAtTime() {}, exponentialRampToValueAtTime() {} }, connect() {} });
    this.destination = {}; this.resume = () => {}; },
  innerWidth: 1200, innerHeight: 800, addEventListener() {}, fetch: () => Promise.reject(new Error("no net"))
};
globalThis.document = { getElementById: () => null, addEventListener() {}, querySelector: () => null, querySelectorAll: () => [] };

const base = new URL("../js/", import.meta.url).href;
const util   = await import(base + "util.js");
const data   = await import(base + "data.js");
const store  = await import(base + "store.js");
const engine = await import(base + "engine.js");
const rvm    = await import(base + "vm/readiness.js");
const svm    = await import(base + "vm/session.js");
const tvm    = await import(base + "vm/today.js");
const sscreen = await import(base + "screens/session.js");
const rscreen = await import(base + "screens/readiness.js");
const overlays = await import(base + "screens/overlays.js");

let passed = 0;
const ok = (cond, msg) => { if (!cond) throw new Error("FAIL: " + msg); passed++; };

/* --- refTime is single-sourced (engine re-exports util's) --- */
ok(engine.refTime === util.refTime, "engine.refTime === util.refTime");
ok(util.refTime({ driver: "time", work: 22 }) === 22, "refTime time-driver");
ok(util.refTime({ dose: "10 reps/side" }) === 40, "refTime /side heuristic");

/* --- streak math with the recovery-friendly grace --- */
ok(store.currentStreak([]) === 0, "empty streak is 0");
const s = iso => ({ isoDate: iso, completedFully: true });
const d0 = new Date().toISOString();
const d2 = new Date(Date.now() - 2 * 86400000).toISOString();
const d5 = new Date(Date.now() - 5 * 86400000).toISOString();
ok(store.currentStreak([s(d2), s(d0)]) === 2, "1-day gap keeps the streak (grace)");
ok(store.currentStreak([s(d5), s(d0)]) === 1, "a 4-day gap breaks the streak");

/* --- XP --- */
ok(store.xpForSession({ perExercise: [1,2,3,4,5,6] }) === 100, "6 moves = 100 XP");
ok(store.xpForSession({ sessionType: "spa" }) === 0, "spa earns no XP");
ok(store.xpForSession({ perExercise: [1,2,3,4,5,6], cleanLandings: 3 }) === 115, "clean-landing bonus adds +5 each");
ok(store.xpForSession({ moves: 5, light: "recovery" }) === 0, "legacy recovery-light row earns no XP");

/* Rounds trained scale the session's XP — a 1-round day is worth half a
   3-round day, with the full day as the anchor (the ladder's December pacing
   assumes today's full-day rate). Legacy rows keep the flat value they were
   awarded, so a cloud restore can't retroactively halve old sessions. */
const sixMoves = rounds => ({ perExercise: [1,2,3,4,5,6], roundsDone: rounds, xpVersion: store.XP_VERSION });
ok(store.xpForSession(sixMoves(3)) === 100, "3 rounds pay the unchanged full-day value");
ok(store.xpForSession(sixMoves(2)) === 75, "2 rounds pay 0.75x");
ok(store.xpForSession(sixMoves(1)) === 50, "1 round pays half a 3-round day");
ok(store.xpForSession({ perExercise: [1,2,3,4,5,6], roundsDone: 1 }) === 100,
   "a legacy 1-round row is NOT rescaled");
ok(store.xpForSession({ ...sixMoves(1), cleanLandings: 3 }) === 65,
   "landings are counted per round already, so the factor never scales them twice");

/* --- defaults --- */
ok(store.DEFAULT_SETTINGS.voiceStyle === "encouraging", "default voice is process-praise");
ok(store.DEFAULT_SETTINGS.cloudMirror === true, "cloudMirror default on");
ok(store.DEFAULT_SETTINGS.athleteName === "Jenn", "default athlete is Jenn");

/* --- circuits: a jump day builds skate-skill + prep, main repeats by light --- */
const circuits = engine.assembleCircuits("wednesday", "green");
const blocks = circuits.map(c => c.block);
ok(blocks.includes("skateskill"), "power day includes the Skate-Skill block");
ok(blocks.includes("main"), "power day includes the Main block");
const mainC = circuits.find(c => c.block === "main");
ok(mainC.rounds === 3, "green light = 3 main rounds");
ok(engine.assembleCircuits("wednesday", "red").find(c => c.block === "main").rounds === 1, "red light = 1 main round");
const monPrep = engine.assembleCircuits("monday", "green").some(c => c.block === "prep");
ok(monPrep, "a day with a prepMenu inserts the Prep Pair");
ok(mainC.exercises.some(e => e.gate === "valgus"), "jump day main has a valgus-gated landing move");

/* --- jump-fatigue tier-drop rule (pure) --- */
ok(engine.tierDroppedRounds(3, 2, 1) === 2, "2 wobbly in a row drops a round");
ok(engine.tierDroppedRounds(3, 1, 1) === 3, "1 wobbly does not drop");
ok(engine.tierDroppedRounds(2, 2, 2, ) === 2, "never drop below the round in progress");

/* --- migration converts legacy skate blobs without losing XP/prizes --- */
localStorage.clear();
localStorage.setItem("skate_sessions_v2", JSON.stringify([{ dayKey: "wednesday", moves: 6, completedFully: true }]));
localStorage.setItem("skate_journey_v1", JSON.stringify({ xp: 777, prizesWon: [{ label: "Movie night", when: 1700000000000 }], pendingDraws: 0 }));
localStorage.setItem("skate_quiz_v1", JSON.stringify({ runs: [{ when: 1, correct: 2, total: 3 }], bestPct: 66, byMove: { "Box Jump → Stick": { seen: 3, missed: 1 } } }));
store.migrate();
ok(store.loadJourney().xp === 777, "existing journey XP is never re-seeded");
ok(store.loadJourney().prizesWon[0].id != null, "legacy prizes gain an id for redeem");
const migQuiz = store.loadQuiz();
ok(Array.isArray(migQuiz.results) && migQuiz.results.length === 1, "legacy quiz runs convert to results[]");
ok(migQuiz.items["Box Jump → Stick"] && migQuiz.items["Box Jump → Stick"].wrong === 1, "legacy per-move misses preserved");
localStorage.clear();

/* --- prize pool defaults avoid food / screen-time --- */
const prizeText = data.PRIZE_POOL.map(p => p.label.toLowerCase()).join("|");
ok(!/dinner|dessert|ice ?cream|ipad|screen/.test(prizeText), "no food/screen default prizes");

/* --- traffic-light colour survives to the CTA --- */
ok(data.LIGHT_META.red.btnColor !== data.LIGHT_META.green.btnColor, "red CTA differs from green");
ok(data.LIGHT_META.green.emoji === "🟢", "unified circle light icons");

/* --- readiness scoring --- */
const scored = rvm.newReadinessFlow("monday", false);
rvm.answerQuestion(scored, "q_pain", "yes");
["q_sleep", "q_light", "q_ready"].forEach(q => rvm.answerQuestion(scored, q, "yes"));
ok(scored.light === "green", "all-good readiness → green");

/* --- pain-gate: level 3 requires a grown-up confirm; level 2 does not --- */
const r3 = rvm.newReadinessFlow("monday", false);
rvm.answerQuestion(r3, "q_pain", "no");
ok(r3.step === "bodyArea", "sore answer routes to body check");
rvm.setZoneSev(r3, 4, 3);
let html = rscreen.readinessScreen(rvm.buildReadinessVM(r3, true));
ok(/rGrownupOk/.test(html) && /disabled/.test(html), "sev3 gate rendered + CTA disabled");
rvm.confirmGrownup(r3);
ok(!/disabled/.test(rscreen.readinessScreen(rvm.buildReadinessVM(r3, true))), "CTA enables after confirm");
const r2 = rvm.newReadinessFlow("monday", false);
rvm.answerQuestion(r2, "q_pain", "no");
rvm.setZoneSev(r2, 6, 2);
ok(!/rGrownupOk/.test(rscreen.readinessScreen(rvm.buildReadinessVM(r2, true))), "sev2 does not gate");

/* --- quiz has a correct option and rotates over the expanded bank --- */
const q = svm.sessionQuizFor("monday");
ok(q && q.opts.some(o => o.ok), "quiz question has a correct answer");

/* --- the rank ladder only ever grows upward -----------------------------
   Every historical threshold must keep its exact level, or a kid's rank
   silently moves backwards on the next release. */
const REQUIRED_RUNGS = [[1, "First Glide"], [3, "Snowflake"], [5, "Frost Spinner"],
  [8, "Edge Dancer"], [12, "Axel Rising"], [16, "Ice Star"], [21, "Rink Royalty"],
  [26, "Crystal Blade"], [31, "Aurora Edge"], [36, "Ice Legend"]];
REQUIRED_RUNGS.forEach(([lvl, name]) => {
  ok(data.LADDER.some(r => r.level === lvl && r.name === name),
     `ladder keeps ${name} at level ${lvl}`);
});
ok(data.levelCost(1) === 100 && data.levelCost(26) === 600,
   "levelCost curve unchanged (100 + (n-1)*20)");
ok(data.MAX_LEVEL === data.LADDER[data.LADDER.length - 1].level, "MAX_LEVEL is the last rung");
ok(data.LADDER.every((r, i, a) => i === 0 || r.level > a[i - 1].level), "ladder levels strictly increase");
data.LADDER.forEach(r => ok(data.RANK_LORE[r.name] && data.RANK_LORE[r.name].story,
  `${r.name} has lore (no blank story card)`));
ok(tvm.buildJourney().atSummit === false, "not at summit at level 1");

/* --- quiz XP cannot be farmed -------------------------------------------
   Regression guard for the old `score*25 + answered*10` rule, which had no
   cap, no cooldown and no memory: because the deck reveals each answer, a
   replay was a guaranteed 280 XP and the ladder could be climbed by tapping. */
const playPerfect = () => {
  const qd = overlays.buildQuizDeck(8);
  qd.qs.forEach((q, i) => { qd.idx = i; overlays.answerQuizDeck(qd, q.opts.findIndex(o => o.ok)); });
  overlays.finishQuizDeck(qd);
  return qd;
};
localStorage.removeItem("skate_quiz_v1");
localStorage.removeItem("skate_journey_v1");
const bank0 = store.quizBankStatus();
ok(bank0.total === 87 && bank0.mastered === 0, "question bank is 87 questions, none mastered");
ok(bank0.xpTotal === 87 * 35, "lifetime quiz XP budget is bank x 35");

const first = playPerfect();
ok(first.wasPaidRound === true && first.xpEarned === store.QXP_DAILY_CAP,
   "the day's paying deck stops at the daily cap");
ok(first.hitDailyCap === true && first.newlyMastered === 3,
   "only the questions the cap paid for are marked mastered");
ok(store.quizXpLeftToday() === 0, "the daily quiz budget is spent");
let sameDay = 0;
for (let i = 0; i < 12; i++) sameDay += playPerfect().xpEarned;
ok(sameDay === 0, "every later deck the same day pays 0 (one paying deck per day)");
ok(store.quizPaidToday() === true, "quizPaidToday flips after the paying deck");
ok(store.quizBankStatus().mastered === 3, "practice replays never advance the mastery ledger");

// A fresh day restores the budget; the questions the cap skipped kept full value.
const nextDay = store.loadQuiz();
nextDay.lastPaidISO = null; nextDay.dayISO = "2020-01-01"; store.saveQuiz(nextDay);
ok(store.quizXpLeftToday() === store.QXP_DAILY_CAP, "the daily budget resets with the date");
const day2 = playPerfect();
ok(day2.xpEarned === store.QXP_DAILY_CAP && store.quizBankStatus().mastered === 6,
   "the next day pays another capped round of brand-new questions");

// New day, but the same questions: already-mastered questions must not re-pay.
const qz = store.loadQuiz();
qz.lastPaidISO = null; qz.dayISO = null; qz.dayXp = 0;
qz.qLedger = Object.fromEntries(store.questionBank()
  .map(([m, k]) => [store.quizQuestionKey(m.name, k), { attempted: true, mastered: true }]));
store.saveQuiz(qz);
ok(playPerfect().xpEarned === 0, "a fully-mastered bank pays nothing, even on a fresh day");

// Wrong answers earn the attempt credit but never the correct credit.
const qz2 = store.loadQuiz();
qz2.lastPaidISO = null; qz2.dayISO = null; qz2.dayXp = 0; qz2.qLedger = {}; store.saveQuiz(qz2);
const wrong = overlays.buildQuizDeck(8);
wrong.qs.forEach((q, i) => { wrong.idx = i; overlays.answerQuizDeck(wrong, q.opts.findIndex(o => !o.ok)); });
overlays.finishQuizDeck(wrong);
ok(wrong.xpEarned === 8 * 10 && wrong.newlyMastered === 0,
   "all-wrong deck pays attempt credit only and masters nothing");
ok(store.quizBankStatus().left === 87, "wrong answers leave every question still claimable");

// The Coach's Quiz at the end of a session prices off the same ledger and
// shares the same daily ceiling.
localStorage.removeItem("skate_quiz_v1");
const coachQ = svm.sessionQuizFor("monday");
ok(coachQ.id, "Coach's Quiz questions carry a stable id for the XP ledger");
const coachKey = store.quizQuestionKey("coach", coachQ.id);
ok(store.payQuizQuestion(coachKey, true).xp === 35, "a new Coach's Quiz answer pays attempt + correct");
ok(store.payQuizQuestion(coachKey, true).xp === 0, "answering it again pays nothing");
localStorage.removeItem("skate_quiz_v1");
ok(store.payQuizQuestion(coachKey, false).xp === 10, "a missed question pays the attempt credit only");
ok(store.payQuizQuestion(coachKey, true).xp === 25, "and pays the rest when it is finally learned");
const spentBlob = store.loadQuiz();
spentBlob.dayISO = new Date().toLocaleDateString("en-CA", { timeZone: "America/Edmonton" });
spentBlob.dayXp = store.QXP_DAILY_CAP; store.saveQuiz(spentBlob);
const cappedPay = store.payQuizQuestion(store.quizQuestionKey("coach", "another"), true);
ok(cappedPay.xp === 0 && cappedPay.capped === true, "the Coach's Quiz respects the shared daily cap");
ok(!store.loadQuiz().qLedger[store.quizQuestionKey("coach", "another")],
   "a capped question is left unspent, worth full value tomorrow");
localStorage.removeItem("skate_quiz_v1");

/* --- view-models + screens render to strings without throwing --- */
const state = { selectedDay: null, expanded: {}, practiceMode: false, nav: "today", weather: null, isWide: true, detailEx: null, detailOverlay: false };
ok(typeof tvm.buildTodayVM(state).dayView === "object", "today VM builds");
ok(typeof sscreen.sessionScreen(svm.buildSessionVM(state)) === "string", "session screen renders");

console.log(`\n✓ smoke tests passed (${passed} assertions)\n`);

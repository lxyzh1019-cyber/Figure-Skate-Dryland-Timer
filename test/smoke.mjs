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
const pvm    = await import(base + "vm/progress.js");
const sscreen = await import(base + "screens/session.js");
const rscreen = await import(base + "screens/readiness.js");
const overlays = await import(base + "screens/overlays.js");

let passed = 0;
const ok = (cond, msg) => { if (!cond) throw new Error("FAIL: " + msg); passed++; };

/* --- refTime is single-sourced (engine re-exports util's) --- */
ok(engine.refTime === util.refTime, "engine.refTime === util.refTime");
ok(util.refTime({ driver: "time", work: 22 }) === 22, "refTime time-driver");
ok(util.refTime({ dose: "10 reps/side" }) === 40, "refTime /side heuristic");

/* --- rep moves carry an authored suggested time ---------------------------
   Rep moves are self-paced (the athlete taps Done), so without an authored
   estSecs the app had to guess from the dose string — and guessed badly:
   "3 × 4s ecc + max clean" is 3 SETS, priced at 3 reps × 3s = 9 seconds, and
   "8/dir/leg" is 32 swings, priced at 8. That is what made a 3-round Saturday
   estimate under 20 minutes against an authored 30–35. estSecs is now
   required on every rep move; this guards new ones. */
const everyEx = [];
Object.entries(data.DAYS).forEach(([dayKey, day]) => {
  Object.values(day.blocks || {}).flat()
    .concat(day.prepMenu || [], day.recoveryHolds || [])
    .forEach(ex => ex && ex.name && everyEx.push([dayKey, ex]));
});
const repMoves = everyEx.filter(([, ex]) => ex.driver === "reps");
ok(repMoves.length > 0, "the plan has rep-driven moves to check");
const missingEst = repMoves.filter(([, ex]) => !(ex.estSecs > 0));
ok(missingEst.length === 0,
   "every rep move has a suggested time — missing: " + missingEst.map(([d, ex]) => d + "/" + ex.name).join(", "));
ok(everyEx.filter(([, ex]) => ex.driver === "time").every(([, ex]) => !ex.estSecs),
   "timed moves carry no estSecs — they run their own countdown");

/* refTime and the session estimate both read the authored value. */
ok(util.refTime({ driver: "reps", estSecs: 150, dose: "3 × 4s ecc + max" }) === 150,
   "refTime prefers the authored estSecs over the dose heuristic");
ok(engine.estimateSessionSecs([{ name: "t", block: "main", rounds: 1,
     exercises: [{ byReps: true, driver: "reps", repsDetail: "3 × 4s ecc + max clean", estSecs: 150 }] }]) === 150,
   "the session estimate uses estSecs, not 3 reps × 3s");

/* The dose-string fallback still runs for anything unauthored, and no longer
   drops the /dir and /leg multipliers ("8/dir/leg" = 8 × 2 dirs × 2 legs). */
const fallback = ex => engine.estimateSessionSecs([{ name: "t", block: "warmup", rounds: 1, exercises: [ex] }]);
ok(fallback({ byReps: true, repsDetail: "8/dir/leg" }) === 8 * 3 * 4, "fallback counts /dir and /leg (×4)");
ok(fallback({ byReps: true, repsDetail: "8/side" }) === 8 * 3 * 2, "fallback counts /side (×2)");
ok(fallback({ byReps: true, repsDetail: "12 · full range" }) === 12 * 3, "fallback leaves a plain rep count alone");

/* The suggested time is shown to the athlete, not just used in the estimate. */
ok(data.exSuggestedTime({ driver: "reps", estSecs: 45 }) === "45s", "suggested time under a minute reads as seconds");
ok(data.exSuggestedTime({ driver: "reps", estSecs: 150 }) === "2:30", "suggested time over a minute reads as m:ss");
ok(data.exSuggestedTime({ driver: "time", work: 30, dose: "30s" }) === "",
   "a timed move has no suggested time — its countdown IS the time");
ok(data.exDoseWithTime({ driver: "reps", estSecs: 60, byReps: true, repsDetail: "8/side", dose: "8/side" }) === "8/side · ~1:00",
   "the plan list shows dose plus its suggested time");

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

/* A session pays a flat rate for the rounds trained — a 1-round day is worth
   half a 3-round day, and the move count no longer moves the number. Matches
   the swim app. Legacy rows keep the old formula, so a cloud restore can't
   re-price history. */
const sess3 = rounds => ({ perExercise: [1,2,3,4,5,6], roundsDone: rounds, xpVersion: store.XP_VERSION });
ok(store.xpForSession(sess3(1)) === 180, "1 round pays 180");
ok(store.xpForSession(sess3(2)) === 270, "2 rounds pay 270");
ok(store.xpForSession(sess3(3)) === 360, "3 rounds pay 360 — a 1-round day is half of it");
ok(store.xpForSession({ ...sess3(3), perExercise: Array(30).fill(1) }) === 360,
   "the move count no longer changes the day's XP");
ok(store.xpForSession({ ...sess3(3), mini: true }) === 180,
   "a mini is one short round, so it is priced as a 1-round day even on green");
ok(store.xpForSession({ perExercise: [1,2,3,4,5,6], roundsDone: 1 }) === 100,
   "a legacy row keeps the old moves x 10 + 40 value");
ok(store.xpForSession({ ...sess3(1), cleanLandings: 3 }) === 195,
   "the clean-landing bonus rides on top of the flat rate");

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

/* --- cloud restore: merge is additive and idempotent, XP is awarded once ----
   The mirror used to be write-only, so a cleared localStorage was permanent
   loss while a full copy sat in Firestore. These guard the way back. */
localStorage.clear();
const rec = (iso, day) => ({ isoDate: iso, dayKey: day, perExercise: [1,2,3,4,5,6], completedFully: true, xpEarned: 100 });
const cloud = [{ id: "abc", createdAt: { seconds: 1 }, ...rec(new Date(Date.now() - 2 * 86400000).toISOString(), "monday") },
               rec(new Date().toISOString(), "tuesday")];
store.migrate();                                   // fresh device: baseline 0
ok(store.loadJourney().xp === 0, "wiped device starts at 0 XP");
ok(store.mergeSessions(cloud) === 2, "restore adds both cloud sessions");
ok(store.loadSessions()[0].id === undefined, "cloud-only fields are stripped");
ok(store.reconcileJourneyWithSessions() === 200, "restored sessions re-award their XP");
ok(store.loadJourney().xp === 200, "XP is back after the restore");
ok(store.mergeSessions(cloud) === 0, "re-running the restore adds nothing");
ok(store.reconcileJourneyWithSessions() === 0, "and awards no XP a second time");
localStorage.clear();

/* --- two devices converge on one level ------------------------------------
   The same skater read level 26 on the iPad and 18 on the desktop, because
   only sessions were mirrored: the wiped desktop rebuilt the training XP while
   the iPad still held years of old uncapped quiz XP on top. XP is now DERIVED
   from the two mirrored sources — training log + quiz ledger — so every device
   computes the same number. */
localStorage.clear();
store.migrate();
store.saveSession({ isoDate: "2026-04-01T10:00:00.000Z", dayKey: "monday", completedFully: true, xpEarned: 300 });
store.addXp(4000);                                  // years of old, uncapped quiz XP
ok(store.loadJourney().xp === 4000, "the device starts with an inflated private total");
ok(store.rebuildJourneyXp() === 300, "rebuilding lands on the training log, not the old total");
ok(store.loadJourney().sessionXp === 300, "and records what the log accounts for");

const qKey = store.quizQuestionKey("Box Jump", "cue");
const oneQuestion = store.QXP_ATTEMPT + store.QXP_CORRECT;   // attempt + correct, once, ever
store.payQuizQuestion(qKey, true);
ok(store.quizXpFromLedger() === oneQuestion, "the ledger prices itself at the current rates");
ok(store.rebuildJourneyXp() === 300 + oneQuestion, "so quiz learning still counts, at its capped value");
ok(store.rebuildJourneyXp() === 300 + oneQuestion, "and rebuilding twice changes nothing");

const snapshot = store.journeySnapshot();
ok(snapshot.kind === "journey" && snapshot.qLedger[qKey], "the snapshot carries the ledger");
ok(snapshot.nonSessionXp === undefined, "no private XP total travels — XP is derived, not shipped");

// Second device: same session log, empty ledger.
localStorage.clear();
store.migrate();
store.saveSession({ isoDate: "2026-04-01T10:00:00.000Z", dayKey: "monday", completedFully: true, xpEarned: 300 });
ok(store.rebuildJourneyXp() === 300, "device 2 starts from the training log alone");
store.mergeCloudJourney(snapshot);
ok(store.rebuildJourneyXp() === 300 + oneQuestion, "after the merge both devices read the same total");
ok(store.payQuizQuestion(qKey, true).xp === 0, "a question mastered elsewhere is already spent here");
ok(store.mergeCloudJourney(snapshot) === false, "merging the same snapshot again changes nothing");
localStorage.clear();

/* --- the rank stories are quiz material too, once unlocked --- */
const bank1 = store.questionBank(1), bank26 = store.questionBank(26);
ok(bank26.length > bank1.length, "the question pool grows as ranks unlock");
ok(store.rankPool(1).length === 1 && store.rankPool(data.MAX_LEVEL).length === data.LADDER.length,
   "only ranks she has reached are askable — locked chapters stay a mystery");
ok(store.rankPool(50).length === data.LADDER.filter(r => r.level <= 50).length,
   "and the pool tracks the ladder as it grows");
ok(store.rankPool(26).every(r => r.name.startsWith("Rank: ")),
   "rank topics have their own ledger key space, never colliding with a move");
const rankQs = bank26.filter(([, k]) => k === "story" || k === "fact");
ok(rankQs.length === store.rankPool(26).length * 2, "each unlocked rank is asked two ways");

/* --- JSON backup / restore: additive, idempotent, and refuses a foreign file --- *//* --- JSON backup / restore: additive, idempotent, and refuses a foreign file --- */
store.migrate();
store.saveSession({ isoDate: "2026-03-01T10:00:00.000Z", dayKey: "monday", perExercise: [1,2,3,4,5,6], completedFully: true, xpEarned: 100 });
store.addXp(100);
store.saveQuiz({ items: { a: 1 }, results: [1], streak: 3, qLedger: {}, lastPaidISO: null });
const backupFile = store.exportProfileData();
ok(backupFile.app === "skate-with-grace-dryland", "backup is stamped with this app");
ok(backupFile.data[store.LS_SESSIONS].length === 1, "backup carries the session log");
ok(backupFile.data[store.LS_QUIZ].streak === 3, "and quiz mastery");
localStorage.clear();
store.migrate();
ok(store.loadSessions().length === 0, "device is empty");
const restored = store.importProfileData(backupFile);
ok(restored.sessionsAdded === 1 && store.loadSessions().length === 1, "restore brings the session log back");
// 200 = the wallet total carried in the file (100) plus the 100 the restored
// session log is worth against this device's fresh zero baseline.
ok(store.loadJourney().xp === 200, "and the XP with it");
const again = store.importProfileData(backupFile);
ok(again.sessionsAdded === 0 && again.xpAdded === 0, "restoring the same file twice changes nothing");
let refused = false;
try { store.importProfileData({ app: "splash-swim-dryland", data: {} }); } catch { refused = true; }
ok(refused, "a backup from the swim app is refused");
localStorage.clear();

/* --- a failed write is reported, never swallowed --- */
let sawError = null;
store.onStorageError(e => { sawError = e; });
const realSetItem = localStorage.setItem;
const realConsoleError = console.error;
localStorage.setItem = () => { throw new Error("QuotaExceededError"); };
console.error = () => {};                    // the failure is the point; don't print it
const wrote = store.writeStorage(store.LS_JOURNEY, { xp: 1 });
localStorage.setItem = realSetItem;
console.error = realConsoleError;
ok(wrote === false, "writeStorage reports the failure instead of returning silently");
ok(sawError && /Quota/.test(sawError.message), "and the app is told, so it can warn a grown-up");
store.onStorageError(null);
localStorage.clear();

/* --- one envelope per level reached, ever --------------------------------
   Draws used to be a mutable counter that any path could add to, and four of
   them handed out prizes nobody trained for: a cloud restore replaying years
   of XP, a rebuild on the second device, a sync that took max(local, cloud)
   after the draws were spent, and re-importing your own backup on demand.
   Draws are derived now — earned minus the wallet — so all four are replays
   that grant nothing. */
localStorage.clear();
store.migrate();
ok(store.addXp(360).leveledUp === false, "one session is not a level yet");
ok(store.addXp(360).leveledUp === true, "the session that crosses the boundary earns the draw");
ok(store.pendingDrawCount() === 1, "and exactly one — a level is one envelope");
ok(store.addPrize({ icon: "🎁", label: "Movie pick" }) !== null, "the draw buys a prize");
ok(store.pendingDrawCount() === 0, "which spends it");
ok(store.addPrize({ icon: "🎁", label: "Again" }) === null &&
   store.loadJourney().prizesWon.length === 1, "a second claim with no draw left is refused");

// A wiped phone rebuilding a long history must not open twenty envelopes.
localStorage.clear();
store.migrate();
for (let i = 0; i < 40; i++) {
  store.saveSession({ isoDate: new Date(Date.now() - i * 86400000).toISOString(),
                      dayKey: "monday", roundsDone: 3, xpVersion: 4, completedFully: true, xpEarned: 360 });
}
store.reconcileJourneyWithSessions();
ok(store.levelFromXp(store.loadJourney().xp).level > 10, "the restored history is worth many levels");
ok(store.pendingDrawCount() === 0, "but a backfill grants no draws — that XP was earned elsewhere");
ok(store.rebuildJourneyXp() > 0 && store.pendingDrawCount() === 0, "and a rebuild grants none either");

// Spent draws stay spent, however the cloud or a backup file argues otherwise.
localStorage.clear();
store.migrate();
store.addXp(2000);
const earnedDraws = store.pendingDrawCount();
const staleSnap = store.journeySnapshot();          // the other device, before the claims
const staleFile = store.exportProfileData();
for (let i = 0; i < earnedDraws; i++) store.addPrize({ icon: "🎁", label: "P" + i });
ok(earnedDraws > 0 && store.loadJourney().prizesWon.length === earnedDraws, "every earned draw is claimed");
const walletIds = store.loadJourney().prizesWon.map(p => p.id);
ok(new Set(walletIds).size === walletIds.length,
   "prizes claimed in the same millisecond keep distinct ids, so the wallet merge can't eat one");
store.mergeCloudJourney(staleSnap);
ok(store.pendingDrawCount() === 0, "a stale cloud snapshot does not resurrect spent draws");
store.importProfileData(staleFile);
ok(store.pendingDrawCount() === 0, "and neither does re-importing your own backup");
ok(store.loadJourney().prizesWon.length === earnedDraws, "the prizes themselves survive both");

// A device that has never seen the journey still inherits the wallet.
const sharedSnap = store.journeySnapshot();
localStorage.clear();
store.migrate();
store.mergeCloudJourney(sharedSnap);
ok(store.loadJourney().prizesWon.length === earnedDraws && store.pendingDrawCount() === 0,
   "the second device gets the prizes, not a fresh set of draws");
// Snapshots written by an older build carry only the counter.
localStorage.clear();
store.migrate();
store.mergeCloudJourney({ kind: "journey", prizesWon: [], pendingDraws: 1 });
ok(store.pendingDrawCount() === 1, "an old-format snapshot still delivers a draw it really owed");
localStorage.clear();

/* --- the draw allowance is capped at level + the bug bounty ---------------
   The over-granting bug ran a while before it was caught, leaving a wallet
   holding more envelopes than the level earns. The skater who found the hole
   keeps two on top of what she earned; the rest of the unclaimed backlog is
   trimmed. It is a STANDING cap, not a one-time migration, because the
   journey merges by max(local, cloud) — a trim that only ran once would be
   undone by the first sync with a device still holding the old count. */
localStorage.clear();
const inflatedWallet = () => {
  localStorage.clear();
  localStorage.setItem("skate_journey_v1", JSON.stringify({ xp: 21600, pendingDraws: 14,
    prizesWon: Array.from({ length: 11 }, (_, i) => ({ id: i + 1, label: "p" + i, date: "2026-01-01", redeemed: i < 6 })) }));
};
inflatedWallet();                                   // level 21, 25 given, 11 claimed
store.migrate();
const capped = store.loadJourney();
ok(store.levelFromXp(capped.xp).level === 21 && store.drawCap(21) === 21 + store.PRIZE_BONUS,
   "the cap is the level plus the bounty");
ok(capped.drawsEarned === 23, "an inflated wallet is trimmed to the cap (25 -> 23)");
ok(capped.prizesWon.length === 11, "every prize she already picked is kept");
ok(capped.prizesWon.filter(p => p.redeemed).length === 6, "including which ones were marked used");
ok(store.pendingDrawCount() === 12, "only the unclaimed backlog shrinks");

// The trim has to survive everything that merges by max().
store.mergeCloudJourney({ kind: "journey", prizesWon: [], pendingDraws: 14, drawsEarned: 25 });
ok(store.loadJourney().drawsEarned === 23, "a stale cloud snapshot cannot re-inflate it");
store.importProfileData({ app: "skate-with-grace-dryland", schema: 1,
                          data: { skate_journey_v1: { xp: 21600, drawsEarned: 25, prizesWon: [] } } });
ok(store.loadJourney().drawsEarned === 23, "nor can re-importing an old backup");
store.migrate();
ok(store.loadJourney().drawsEarned === 23, "and it holds across boots");

// The bounty rides along as she keeps training, rather than being clawed back.
inflatedWallet(); store.migrate();
while (store.pendingDrawCount() > 0) store.addPrize({ icon: "🎁", label: "opened" });
ok(store.loadJourney().prizesWon.length === 23, "she can open the whole trimmed backlog");
store.addXp(1600);
ok(store.pendingDrawCount() === 1 && store.loadJourney().drawsEarned === store.drawCap(22),
   "and the next level still pays, because the cap rises with her");

// Honest play never comes near it: a level earns one envelope, the cap is +2.
localStorage.clear();
store.migrate();
for (let i = 0; i < 40; i++) { if (store.addXp(360).leveledUp) store.addPrize({ icon: "🎁", label: "p" }); }
const honest = store.loadJourney();
ok(honest.drawsEarned < store.drawCap(store.levelFromXp(honest.xp).level),
   "a straight run sits below the cap, so it never binds on honest play");
localStorage.clear();

/* --- Redeem works on every id shape a prize can carry --------------------
   migrate() gives the oldest records `p.when || "legacy-" + i`, so one with no
   timestamp gets a STRING id. The click path hands ids back as strings, and
   the Number() coercion that used to undo that turned "legacy-1" into NaN:
   the button rendered and the tap did nothing. Ids compare as text now. */
localStorage.clear();
localStorage.setItem("skate_journey_v1", JSON.stringify({ xp: 5000, pendingDraws: 0, prizesWon: [
  { label: "Movie night", when: 1700000000000 },   // timestamped -> numeric id
  { label: "Skip a chore" }                        // no timestamp -> "legacy-1"
]}));
store.migrate();
const walletIdShapes = store.loadJourney().prizesWon.map(p => typeof p.id);
ok(walletIdShapes.includes("number") && walletIdShapes.includes("string"),
   "a legacy wallet really does hold both id shapes");
store.loadJourney().prizesWon.forEach(p => {
  pvm.toggleRedeem(String(p.id));                  // exactly what data-arg hands back
  const after = store.loadJourney().prizesWon.find(x => String(x.id) === String(p.id));
  ok(after.redeemed === true, `redeem marks the prize used (id ${JSON.stringify(p.id)})`);
});
pvm.toggleRedeem(String(store.loadJourney().prizesWon[1].id));
ok(store.loadJourney().prizesWon[1].redeemed === false, "and tapping again puts it back");
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
   The rungs are now pinned to the SWIM app's levels, not to this app's old
   ones. Both moved together, deliberately and once, when the level curve became
   shared; from here they must not drift apart again, because the whole point is
   that "level 12" means the same work in both sisters' timers. */
const REQUIRED_RUNGS = [[1, "First Glide"], [3, "Snowflake"], [6, "Frost Spinner"],
  [9, "Edge Dancer"], [12, "Axel Rising"], [15, "Ice Star"], [18, "Rink Royalty"],
  [21, "Crystal Blade"], [24, "Aurora Edge"], [26, "Ice Legend"], [29, "Comet Spiral"],
  [32, "Solstice Flame"], [35, "Eternal Edge"], [38, "Snow Petrel"], [41, "Frost Flower"],
  [44, "Midnight Sun"], [47, "Glacier Heart"], [50, "Winter Sovereign"]];
REQUIRED_RUNGS.forEach(([lvl, name]) => {
  ok(data.LADDER.some(r => r.level === lvl && r.name === name),
     `ladder keeps ${name} at level ${lvl}`);
});
ok(data.LADDER.length === REQUIRED_RUNGS.length, "no rung has been added or dropped");
/* The shared curve, verbatim from the swim app. A level has to cost the same in
   both timers or their numbers stop being comparable. */
ok(data.levelCost(1) === 500 && data.levelCost(9) === 1000 && data.levelCost(18) === 1500,
   "level costs are the shared curve (500/30, 1000/45, 1500/50)");
ok(data.levelCost(26) === 1900 && data.levelCost(50) === 3100, "and match at the top end too");
ok(data.MAX_LEVEL === data.LADDER[data.LADDER.length - 1].level, "MAX_LEVEL is the last rung");
/* The summit has to stay out of reach until January 2027. On the shared curve
   it costs 88,260 XP; a perfect 6-day week at the flat rates is 2,560 including
   landings, so from where she stands (~4,600 XP) plus the whole quiz bank she
   can hold about 55k on Jan 1. */
const cumTo = L => { let t = 0; for (let n = 1; n < L; n++) t += data.levelCost(n); return t; };
ok(cumTo(data.MAX_LEVEL) === 88260, "the summit costs the same as the swim app's");
ok(cumTo(data.MAX_LEVEL) > 55000, "and more than a perfect run to Jan 1 can earn");
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
const BANK = store.questionBank().length;      // 87 moves-questions + the unlocked ranks
ok(BANK === 87 + store.rankPool().length * 2, "the bank is the moves plus the unlocked rank stories");
ok(bank0.total === BANK && bank0.mastered === 0, "nothing is mastered on a fresh device");
ok(bank0.xpTotal === BANK * (store.QXP_ATTEMPT + store.QXP_CORRECT), "lifetime quiz XP budget is bank x question value");

const first = playPerfect();
ok(first.wasPaidRound === true && first.xpEarned === store.QXP_DAILY_CAP,
   "the day's paying deck stops at the daily cap");
ok(first.hitDailyCap === true && first.newlyMastered === 1,
   "only the question the cap paid for is marked mastered");
ok(store.quizXpLeftToday() === 0, "the daily quiz budget is spent");
let sameDay = 0;
for (let i = 0; i < 12; i++) sameDay += playPerfect().xpEarned;
ok(sameDay === 0, "every later deck the same day pays 0 (one paying deck per day)");
ok(store.quizPaidToday() === true, "quizPaidToday flips after the paying deck");
ok(store.quizBankStatus().mastered === 1, "practice replays never advance the mastery ledger");

// A fresh day restores the budget; the questions the cap skipped kept full value.
const nextDay = store.loadQuiz();
nextDay.lastPaidISO = null; nextDay.dayISO = "2020-01-01"; store.saveQuiz(nextDay);
ok(store.quizXpLeftToday() === store.QXP_DAILY_CAP, "the daily budget resets with the date");
const day2 = playPerfect();
ok(day2.xpEarned === store.QXP_DAILY_CAP && store.quizBankStatus().mastered === 2,
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
ok(wrong.xpEarned === 30 && wrong.newlyMastered === 0,
   "all-wrong deck pays attempt credit only (6 x 5, then the cap bites) and masters nothing");
// left vs total, not a captured number: the bank grows as ranks unlock, and
// earlier tests move the level around.
const afterWrong = store.quizBankStatus();
ok(afterWrong.left === afterWrong.total, "wrong answers leave every question still claimable");

// The Coach's Quiz at the end of a session prices off the same ledger and
// shares the same daily ceiling.
localStorage.removeItem("skate_quiz_v1");
const coachQ = svm.sessionQuizFor("monday");
ok(coachQ.id, "Coach's Quiz questions carry a stable id for the XP ledger");
const coachKey = store.quizQuestionKey("coach", coachQ.id);
ok(store.payQuizQuestion(coachKey, true).xp === 30, "a new Coach's Quiz answer pays attempt + correct, exactly one day's budget");
ok(store.payQuizQuestion(coachKey, true).xp === 0, "answering it again pays nothing");
localStorage.removeItem("skate_quiz_v1");
ok(store.payQuizQuestion(coachKey, false).xp === 5, "a missed question pays the attempt credit only");
ok(store.payQuizQuestion(coachKey, true).xp === 25, "and pays the rest when it is finally learned");
const spentBlob = store.loadQuiz();
spentBlob.dayISO = new Date().toLocaleDateString("en-CA", { timeZone: "America/Edmonton" });
spentBlob.dayXp = store.QXP_DAILY_CAP; store.saveQuiz(spentBlob);
const cappedPay = store.payQuizQuestion(store.quizQuestionKey("coach", "another"), true);
ok(cappedPay.xp === 0 && cappedPay.capped === true, "the Coach's Quiz respects the shared daily cap");
ok(!store.loadQuiz().qLedger[store.quizQuestionKey("coach", "another")],
   "a capped question is left unspent, worth full value tomorrow");
localStorage.removeItem("skate_quiz_v1");

/* --- the day card quotes what the session actually earned ------------------
   It used to carry its own copy of the XP formula, so the card and the ladder
   disagreed about the same session the moment the rates changed. */
localStorage.clear();
store.migrate();
const todayKeyForCard = new Date().toLocaleString("en-US", { timeZone: "America/Edmonton", weekday: "long" }).toLowerCase();
store.saveSession({ isoDate: new Date().toISOString(), dayKey: todayKeyForCard, completedFully: true,
                    roundsDone: 3, xpVersion: store.XP_VERSION, cleanLandings: 4, perExercise: Array(19).fill(1) });
const cardVM = tvm.buildTodayVM({ selectedDay: todayKeyForCard, expanded: {}, practiceMode: false, isWide: true });
ok(/\+380 XP earned/.test(cardVM.dayView.earnedXpLabel || ""),
   "a finished 3-round day says +380 — the flat 360 plus its 4 clean landings");
localStorage.clear();

/* --- view-models + screens render to strings without throwing --- */
const state = { selectedDay: null, expanded: {}, practiceMode: false, nav: "today", weather: null, isWide: true, detailEx: null, detailOverlay: false };
ok(typeof tvm.buildTodayVM(state).dayView === "object", "today VM builds");
ok(typeof sscreen.sessionScreen(svm.buildSessionVM(state)) === "string", "session screen renders");

console.log(`\n✓ smoke tests passed (${passed} assertions)\n`);

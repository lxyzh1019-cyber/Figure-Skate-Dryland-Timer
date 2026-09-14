/* ============================================================
   Smoke tests for THIS app's content — run with `npm test`.

   The engine, the rules and the screens are the shared core's, and the
   core's own suites (core/test/*.mjs) run here against this app's content.
   What this file checks is what only this app can get wrong: its plan, its
   ranks, its prizes, its demo links, its readiness copy — and that the
   content satisfies the shape the core builds a session from.
   ============================================================ */
import { store, data, engine, sport, tvm, svm, pvm, gvm, rvm, rscreen, sscreen, util } from "../core/test/harness.mjs";

let passed = 0;
const ok = (cond, msg) => { if (!cond) throw new Error("FAIL: " + msg); passed++; };

/* --- the content satisfies the core's shape -------------------------------
   X() throws at load on a rep dose it cannot read, so simply importing the
   plan proves every dose parses. What is checked here is what a parse cannot:
   that every move counts to something, sits in a known block, and that the
   blocks the light policy names all exist somewhere in the week. */
const allMoves = [];
Object.values(data.DAYS).forEach(day => {
  Object.values(day.blocks || {}).flat().concat(day.prepMenu || [], day.recovery || [])
    .forEach(ex => ex && ex.name && allMoves.push(ex));
});
ok(allMoves.length > 60, "the week has its moves (" + allMoves.length + ")");
const repMoves = allMoves.filter(ex => ex.byReps);
ok(repMoves.length > 15, "many of them are counted in reps (" + repMoves.length + ")");
repMoves.forEach(ex => ok(ex.prescription && ex.prescription.totalReps >= 1 && ex.prescription.segments >= 1,
  "a rep move counts to something: " + ex.name + " · " + ex.repsDetail));
allMoves.filter(ex => !ex.byReps && ex.block !== "recovery").forEach(ex => ok(Number.isFinite(ex.work) && ex.work > 0,
  "a timed move has seconds: " + ex.name));
allMoves.forEach(ex => ok(data.BLOCK_ORDER.includes(ex.block) || ["prep", "recovery"].includes(ex.block),
  "a move sits in a known block: " + ex.name + " → " + ex.block));
const blocksUsed = new Set(allMoves.map(ex => ex.block));
Object.values(data.LIGHT_SESSION_POLICY).flatMap(p => p.blocks).forEach(b =>
  ok(blocksUsed.has(b), "the light policy names a block the plan actually has: " + b));
ok(data.LIGHT_SESSION_POLICY.green.blocks.includes(sport.SKILL_BLOCK)
   && data.LIGHT_SESSION_POLICY.red.blocks.includes(sport.SKILL_BLOCK),
   "the skill block survives every light");
ok(data.BLOCK_META[sport.SKILL_BLOCK] && data.BLOCK_LABEL[sport.SKILL_BLOCK], "the skill block has its label and colour");
ok(allMoves.some(ex => ex[sport.TRANSFER_FIELD]) && allMoves.some(ex => ex.transfer),
   "moves carry what they build for the ice, under the field the core reads");
ok(Object.values(data.DAYS).every(d => d.spa || d[sport.DAY_LOAD_FIELD] != null), "every training day says what the ice load is");

/* --- the rules are the shared ones, by construction ------------------------
   Nothing here is this app's to change; these lines exist so a well-meaning
   edit to the content file cannot quietly reprice a level or a day. */
ok(JSON.stringify(store.SESSION_XP) === JSON.stringify({ 0: 90, 1: 180, 2: 270, 3: 360 }), "a session pays the flat rates: 90 / 180 / 270 / 360");
ok(data.levelCost(1) === 500 && data.levelCost(9) === 1000 && data.levelCost(18) === 1500 && data.levelCost(26) === 1900 && data.levelCost(50) === 3100,
   "level costs are the shared curve (500/30, 1000/45, 1500/50)");
ok(JSON.stringify(data.LIGHT_ROUNDS) === JSON.stringify({ green: 3, yellow: 2, red: 1, recovery: 0 }), "the light sets 3 / 2 / 1 / 0 main rounds");
ok(sport.FEATURES.landingCheck === true, "this app grades landings (the core's landing suite covers the rule)");

/* --- the rank ladder only ever grows upward --------------------------------
   The rungs are pinned to the swim app's levels: both moved together, once,
   when the level curve became shared. "Level 12" means the same work in both
   sisters' timers, and a rung that moved would move a rank already earned. */
const REQUIRED_RUNGS = [[1, "First Glide"], [3, "Snowflake"], [6, "Frost Spinner"],
  [9, "Edge Dancer"], [12, "Axel Rising"], [15, "Ice Star"], [18, "Rink Royalty"],
  [21, "Crystal Blade"], [24, "Aurora Edge"], [26, "Ice Legend"], [29, "Comet Spiral"],
  [32, "Solstice Flame"], [35, "Eternal Edge"], [38, "Snow Petrel"], [41, "Frost Flower"],
  [44, "Midnight Sun"], [47, "Glacier Heart"], [50, "Winter Sovereign"]];
REQUIRED_RUNGS.forEach(([lvl, name]) => ok(data.LADDER.some(r => r.level === lvl && r.name === name), `ladder keeps ${name} at level ${lvl}`));
ok(data.LADDER.length === REQUIRED_RUNGS.length, "no rung has been added or dropped");
ok(data.MAX_LEVEL === data.LADDER[data.LADDER.length - 1].level, "MAX_LEVEL is the last rung");
const cumTo = L => { let t = 0; for (let n = 1; n < L; n++) t += data.levelCost(n); return t; };
ok(cumTo(data.MAX_LEVEL) === 88260, "the summit costs the same as the swim app's");
ok(data.LADDER.every((r, i, a) => i === 0 || r.level > a[i - 1].level), "ladder levels strictly increase");
data.LADDER.forEach(r => ok(data.RANK_LORE[r.name] && data.RANK_LORE[r.name].story && data.RANK_LORE[r.name].chapter
  && data.RANK_LORE[r.name][sport.LORE_TRANSFER_FIELD], `${r.name} has lore, a chapter and what it teaches`));
localStorage.clear(); store.migrate();
ok(tvm.buildJourney().atSummit === false, "not at summit at level 1");
ok(/FROZEN POND/.test(tvm.buildTodayVM({ selectedDay: null, expanded: {}, nav: "today", isWide: true }).journey.chapter),
   "the journey card names the first chapter from the lore");

/* --- the rank stories are quiz material too, once unlocked --- */
const bank1 = store.questionBank(1), bank26 = store.questionBank(26);
ok(bank26.length > bank1.length, "the question pool grows as ranks unlock");
ok(store.rankPool(1).length === 1 && store.rankPool(data.MAX_LEVEL).length === data.LADDER.length,
   "only ranks she has reached are askable — locked chapters stay a mystery");
ok(store.rankPool(26).every(r => r.name.startsWith("Rank: ") && r.skill), "rank topics have their own key space and carry what the rank teaches");
ok(bank26.filter(([, k]) => k === "story" || k === "fact").length === store.rankPool(26).length * 2, "each unlocked rank is asked two ways");
const sq = svm.sessionQuizFor("monday");
ok(sq && sq.opts.some(o => o.ok) && /ice|skat|landing|spin|axis/i.test(sq.q + sq.why), "the Coach's Quiz asks about skating and has a correct answer");

/* --- every demo link names exactly one validated channel ------------------- */
const CHANNEL_NAMES = Object.values(data.COACH_CHANNELS).map(c => c.name).concat(["The Prehab Guys"]);
const channelCount = q => CHANNEL_NAMES.filter(n => q.toLowerCase().includes(n.toLowerCase())).length;
const wrongChannels = allMoves.filter(ex => channelCount(data.videoSearchQuery(ex)) !== 1);
ok(wrongChannels.length === 0, "every demo search names exactly one channel — wrong: "
   + wrongChannels.map(ex => ex.name + " -> " + data.videoSearchQuery(ex)).join(" | "));
ok(/iSk8 Mom Maja$/.test(data.videoSearchQuery({ name: "Axis Micro", block: "skateskill" })), "a skate-skill drill searches the figure-skating channel");
ok(/Tom Merrick$/.test(data.videoSearchQuery({ name: "Calves — foam roller", block: "recovery" })), "recovery work searches the mobility channel");
ok(data.videoSearchUrl({ name: "Bird Dog", block: "main" }).startsWith("https://www.youtube.com/results?search_query="), "the demo link is a YouTube search URL");

/* --- circuits: a jump day builds skate-skill + prep, main repeats by light --- */
localStorage.clear(); store.migrate(); store.saveGate({ unlocked: true, cleanWeeks: [] });
const circuits = engine.assembleCircuits("wednesday", "green");
const blocks = circuits.map(c => c.block);
ok(blocks.includes("skateskill") && blocks.includes("main"), "power day includes Skate-Skill and Main");
ok(circuits.find(c => c.block === "main").rounds === 3, "green light = 3 main rounds");
ok(engine.assembleCircuits("wednesday", "red").find(c => c.block === "main").rounds === 1, "red light = 1 main round");
ok(!engine.assembleCircuits("wednesday", "red").some(c => c.block === "finisher"), "a red day drops the finisher, as the policy says");
ok(engine.assembleCircuits("monday", "green").some(c => c.block === "prep"), "a day with a prepMenu inserts the Prep Pair");
ok(circuits.find(c => c.block === "main").exercises.some(e => e.gate === "valgus"), "jump day main has a valgus-gated landing move");
ok(engine.assembleCircuits("sunday", "recovery").every(c => c.block === "recovery"), "Sunday runs recovery only");
/* the valgus gate: locked keeps every jump at the box jump */
store.saveGate({ unlocked: false, cleanWeeks: [] });
const lockedMain = engine.assembleCircuits("saturday", "green").find(c => c.block === "main").exercises.map(e => e.name);
ok(!lockedMain.some(n => data.VALGUS_PROGRESSIONS.includes(n)) && lockedMain.includes(data.VALGUS_FLOOR),
   "a locked gate swaps the bounds and rotational jumps for the box jump: " + lockedMain.join(", "));
store.saveGate({ unlocked: true, cleanWeeks: [] });

/* --- gear moves get setup time --- */
ok(data.needsSetup({ name: "Spin Board Backspin Hold" }) && data.needsSetup({ name: "Band Pass-Through" }) && data.needsSetup({ name: "Pull-Up (heavy)" }),
   "a spin board, a band and a bar all need setting up");
ok(!data.needsSetup({ name: "Dead Bug" }), "a floor move does not");

/* --- her history reads back under the same keys ---------------------------
   The storage keys are this app's own and frozen; the core reads them
   through sport.js. A journey written by the earlier draw ledger carries its
   high-water level across. */
localStorage.clear();
localStorage.setItem("skate_sessions_v2", JSON.stringify([{ dayKey: "wednesday", isoDate: "2026-08-20T20:00:00.000Z", completedFully: true, roundsDone: 3, xpEarned: 375, xpVersion: 4, durationSecs: 1500 }]));
localStorage.setItem("skate_journey_v1", JSON.stringify({ xp: 4600, sessionXp: 4600, prizesWon: [{ label: "Movie night", when: 1700000000000 }], drawsEarned: 9, drawLevel: 18, pendingDraws: 0 }));
store.migrate();
ok(store.loadSessions().length === 1 && store.loadSessions()[0].xpEarned === 375, "sessions logged before the shared core keep the XP they were stamped with");
ok(store.loadJourney().maxLevelSeen === 18, "the earlier ledger's high-water level is carried into the shared one");
ok(store.loadJourney().prizesWon[0].id != null, "legacy prizes gain an id for redeem");
ok(store.SETTINGS_KEY === "skateTrainingSettingsV2" && store.LS_SESSIONS === "skate_sessions_v2" && store.LS_JOURNEY === "skate_journey_v1", "the keys are the ones her device already holds");
localStorage.clear();

/* --- prize pool defaults avoid food / screen-time --- */
const prizeText = data.PRIZE_POOL.map(p => p.label.toLowerCase()).join("|");
ok(!/dinner|dessert|ice ?cream|ipad|screen/.test(prizeText), "no food/screen default prizes");

/* --- traffic-light colour survives to the CTA --- */
ok(data.LIGHT_META.red.btnColor !== data.LIGHT_META.green.btnColor, "red CTA differs from green");
ok(data.LIGHT_META.green.emoji === "🟢", "unified circle light icons");

/* --- readiness scoring + the pain gate (this app's copy, the core's rule) --- */
store.migrate();
const scored = rvm.newReadinessFlow("monday", false);
rvm.answerQuestion(scored, "q_pain", "yes");
["q_sleep", "q_light", "q_ready"].forEach(q => rvm.answerQuestion(scored, q, "yes"));
ok(scored.light === "green", "all-good readiness → green");
const r3 = rvm.newReadinessFlow("monday", false);
rvm.answerQuestion(r3, "q_pain", "no");
ok(r3.step === "bodyArea", "sore answer routes to body check");
rvm.setZoneSev(r3, 4, 3);
ok(!rvm.mayStartFromReadiness(r3), "severity 3 may not start without a grown-up");
let html = rscreen.readinessScreen(rvm.buildReadinessVM(r3, true));
ok(/rGrownupOk/.test(html) && /hit the ice/.test(html), "sev3 gate rendered, in this app's words");
rvm.confirmGrownup(r3);
ok(rvm.mayStartFromReadiness(r3), "and may once a grown-up has confirmed");
const r2 = rvm.newReadinessFlow("monday", false);
rvm.answerQuestion(r2, "q_pain", "no");
rvm.setZoneSev(r2, 6, 2);
ok(!/rGrownupOk/.test(rscreen.readinessScreen(rvm.buildReadinessVM(r2, true))), "sev2 does not gate");
ok(/skater body map/.test(rscreen.readinessScreen(rvm.buildReadinessVM(r2, true))), "the body map is a skater's");

/* --- view-models + screens render to strings, in this app's voice --- */
const state = { selectedDay: null, expanded: {}, nav: "today", weather: null, isWide: true, detailEx: null, detailOverlay: false };
ok(typeof tvm.buildTodayVM(state).dayView === "object", "today VM builds");
const sessionHtml = sscreen.sessionScreen(svm.buildSessionVM(state));
ok(typeof sessionHtml === "string" && sessionHtml.length > 500, "session screen renders");
const pv = pvm.buildProgressVM({ progressScope: "4w", logScope: "week" });
ok(Array.isArray(pv.rankStory) && pv.rankStory.length === data.LADDER.length, "the rank rail has a card per rung");
ok(typeof gvm.buildGrownupVM({ gsScope: "week", grownupTab: "overview" }).analytics === "object", "grown-up VM builds");
ok(util.refTime === engine.refTime, "refTime is single-sourced (engine re-exports util's)");

console.log(`✓ smoke tests passed (${passed} assertions)`);

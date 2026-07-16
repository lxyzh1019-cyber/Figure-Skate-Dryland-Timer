/* ============================================================================
   main.js — app state, render() dispatcher, event delegation, boot.
   V2 entry point. Screens not yet rebuilt render a graceful placeholder so the
   app never crashes while the rebuild proceeds phase by phase.
   ============================================================================ */
import { LIGHT_ROUNDS, DAYS } from "./data.js";
import { seedJourneyOnce, saveReadiness, loadLastCheck, loadSettings, patchLastSession } from "./store.js";
import { renderToday } from "./screens/today.js";
import { todayKeyNow } from "./vm/today.js";
import { rail, bottomNav, setNavWide } from "./screens/rail.js";
import {
  renderReadiness, freshReadiness, lightFromAnswers, lightFromZones, LIGHTS
} from "./screens/readiness.js";
import { Session } from "./engine.js";
import { renderSession, updateTimer } from "./screens/session.js";
import { renderPrizeDraw, freshPrizeDraw } from "./screens/prizedraw.js";
import { renderQuizDeck, freshQuiz } from "./screens/quizdeck.js";
import { claimPrize, recordQuizResult, redeemPrize, saveSettings, loadSessions } from "./store.js";
import { renderProgress } from "./screens/progress.js";
import { renderGrownup } from "./screens/grownup.js";
import { getWeather } from "./weather.js";

const state = {
  nav: "today",          // today | progress | grownup | session | readiness | quizdeck | prizedraw
  selectedDay: null,     // null → today
  isWide: true,
  readiness: freshReadiness(),
  pendingSession: null,  // { dayKey, light, rounds }
  session: null,         // live Session engine instance
  weather: null,
  __mood: null,
  prizeDraw: null,
  quiz: null,
  grownupTab: "overview",
  libDetail: null,
};

const REST_LIMITS = { exerciseRestSeconds: [0, 30], roundRestSeconds: [5, 60], sectionRestSeconds: [5, 90] };

function downloadCsv() {
  const rows = [["date", "day", "light", "minutes", "completedFully", "endedEarly", "pain", "mood", "xpEarned"]];
  loadSessions().forEach(s => rows.push([
    s.isoDate || "", s.dayKey || "", s.light || "", Math.round((s.durationSecs || 0) / 60),
    s.completedFully ? "yes" : "no", s.endedEarly ? "yes" : "no", s.pain ? "yes" : "no", s.mood || "", s.xpEarned || 0
  ]));
  const csv = rows.map(r => r.map(c => `"${String(c).replace(/"/g, '""')}"`).join(",")).join("\n");
  const blob = new Blob([csv], { type: "text/csv" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url; a.download = "skate-sessions.csv"; document.body.appendChild(a); a.click();
  a.remove(); URL.revokeObjectURL(url);
}

function computeWide() {
  state.isWide = window.innerWidth >= 900 && window.innerWidth > window.innerHeight;
}
function sessionDayKey() { return state.selectedDay || todayKeyNow(); }

/* Placeholder for screens still being rebuilt (keeps navigation working). */
function renderPlaceholder(title, note) {
  return `
  <div style="width:100%;max-width:1242px;margin:0 auto;box-sizing:border-box;padding:18px;">
    <div style="display:flex;flex-wrap:wrap;background:var(--surface);border-radius:30px;box-shadow:0 18px 44px rgba(142,52,83,0.16);overflow:hidden;min-height:520px;">
      ${rail(state.nav)}
      <div style="flex:1;min-width:280px;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:14px;padding:40px;text-align:center;">
        <img src="assets/skate/illo-nice-work.png" alt="" style="height:150px;object-fit:contain;" onerror="this.style.display='none'">
        <div style="font-family:var(--font-display);font-weight:600;font-size:30px;color:var(--rose-700);">${title}</div>
        <div style="font-size:15px;font-weight:700;color:var(--ink-soft);max-width:420px;line-height:1.5;">${note}</div>
        <button type="button" data-action="goToday" class="btn btn-primary" style="padding:14px 28px;font-size:16px;">← Back to Today</button>
      </div>
    </div>
  </div>`;
}

const RAIL_SCREENS = new Set(["today", "progress", "grownup"]);

function render() {
  const app = document.getElementById("app");
  setNavWide(state.isWide);
  let html;
  switch (state.nav) {
    case "today":     html = renderToday(state); break;
    case "readiness": html = renderReadiness(state); break;
    case "session":   html = state.session ? renderSession(state) : renderToday(state); break;
    case "prizedraw": html = state.prizeDraw ? renderPrizeDraw(state) : renderToday(state); break;
    case "quizdeck":  html = state.quiz ? renderQuizDeck(state) : renderToday(state); break;
    case "progress":  html = renderProgress(state); break;
    case "grownup":   html = renderGrownup(state); break;
    default:          html = renderPlaceholder("Coming soon", "This screen is part of a later build phase.");
  }
  // Narrow: use the fixed bottom-nav on the three primary screens.
  const showBottom = !state.isWide && RAIL_SCREENS.has(state.nav);
  if (showBottom) html += bottomNav(state.nav);
  document.body.classList.toggle("has-bottom-nav", showBottom);
  app.innerHTML = html;
}

/* Instantiate + run the session engine for the pending readiness result. */
function startEngine() {
  const ps = state.pendingSession;
  if (!ps) return;
  state.__mood = null;
  state.session = new Session({
    dayKey: ps.dayKey, light: ps.light, settings: loadSettings(),
    onChange: () => { if (state.nav === "session") render(); },
    onTick: (rem, tot) => updateTimer(rem, tot),
    onComplete: () => { if (state.nav === "session") render(); },
  });
  state.nav = "session";
  render();
  state.session.run();
}
function clearSession() {
  if (state.session && !state.session.ended) state.session.endEarly();
  state.session = null; state.__mood = null; state.pendingSession = null;
}

/* ---- readiness helpers ---- */
function readinessFinishFromAnswers() {
  const a = state.readiness.answers;
  const need = ["q_pain", "q_sleep", "q_light", "q_ready"];
  if (need.every(k => a[k] != null) && a.q_pain === "yes") {
    state.readiness.light = lightFromAnswers(a);
    state.readiness.done = true;
    state.readiness.resultSource = "readiness";
  }
}

/* ---- event delegation: one listener resolves data-action ---- */
const ACTIONS = {
  goToday:      () => { clearSession(); state.nav = "today"; state.selectedDay = null; render(); },
  goProgress:   () => { state.nav = "progress"; render(); },
  goGrownup:    () => { state.nav = "grownup"; render(); },
  selectDay:    (el) => { state.selectedDay = el.getAttribute("data-day"); render(); },
  backToToday:  () => { state.selectedDay = null; render(); },
  startSession: () => { state.readiness = freshReadiness(); state.nav = "readiness"; render(); },
  startQuizDeck:() => { state.quiz = freshQuiz(8); state.nav = "quizdeck"; render(); },
  exitQuizDeck: () => { state.quiz = null; state.nav = "today"; render(); },
  openPrizeDraw:() => { state.prizeDraw = freshPrizeDraw(); state.nav = "prizedraw"; render(); },

  // ---- quiz deck ----
  quizPick: (el) => {
    const q = state.quiz; if (!q || q.answered) return;
    q.picked = +el.getAttribute("data-i");
    q.answered = true;
    if (q.picked === q.items[q.idx].correct) q.score++;
    render();
  },
  quizNext: () => {
    const q = state.quiz; if (!q) return;
    q.idx++; q.answered = false; q.picked = null;
    if (q.idx >= q.items.length && !q.logged) { recordQuizResult(q.score, q.items.length); q.logged = true; }
    render();
  },

  // ---- prize draw ----
  prizeReveal: (el) => {
    const pd = state.prizeDraw; if (!pd || pd.revealed != null) return;
    pd.revealed = +el.getAttribute("data-i");
    claimPrize(pd.options[pd.revealed]);
    render();
  },
  prizeRedeem: (el) => { redeemPrize(+el.getAttribute("data-i")); render(); },

  // ---- grown-up zone ----
  guTab:         (el) => { state.grownupTab = el.getAttribute("data-tab"); state.libDetail = null; render(); },
  guToggle:      (el) => { const k = el.getAttribute("data-key"); const s = loadSettings(); saveSettings({ [k]: !s[k] }); render(); },
  guVoiceStyle:  (el) => { saveSettings({ voiceStyle: el.getAttribute("data-style") }); render(); },
  guStep:        (el) => {
    const k = el.getAttribute("data-key"), delta = +el.getAttribute("data-delta");
    const [lo, hi] = REST_LIMITS[k] || [0, 120];
    const cur = loadSettings()[k] || 0;
    saveSettings({ [k]: Math.max(lo, Math.min(hi, cur + delta)) });
    render();
  },
  guPrizeRemove: (el) => { const i = +el.getAttribute("data-i"); const pool = [...(loadSettings().prizePool || [])]; pool.splice(i, 1); saveSettings({ prizePool: pool }); render(); },
  guPrizeAdd:    () => {
    const inp = document.querySelector("[data-set-prize]");
    const v = inp && inp.value.trim();
    if (!v) return;
    saveSettings({ prizePool: [...(loadSettings().prizePool || []), v] }); render();
  },
  guExportCsv:   () => { try { downloadCsv(); } catch (e) { console.warn("csv export failed", e); } },
  guLibOpen:     (el) => { state.libDetail = el.getAttribute("data-name"); render(); },
  guLibClose:    (el, e) => { if (e.target.closest("[data-stop]")) return; state.libDetail = null; render(); },

  // ---- readiness ----
  rdyAnswer: (el) => {
    const q = el.getAttribute("data-q"), val = el.getAttribute("data-val");
    state.readiness.answers[q] = val;
    if (q === "q_pain" && val === "no") { state.readiness.step = "bodyArea"; state.readiness.done = false; }
    else readinessFinishFromAnswers();
    render();
  },
  rdySameYesterday: () => {
    const prev = loadLastCheck();
    if (!prev) return;
    if (prev.answers && prev.answers.q_pain === "no") {
      // soreness must be re-checked today, not silently reused
      state.readiness = { ...freshReadiness(), answers: { ...prev.answers, q_pain: "no" }, step: "bodyArea" };
    } else {
      state.readiness = { ...freshReadiness(), answers: { ...(prev.answers || {}) }, light: prev.light || "green", done: true };
    }
    render();
  },
  rdyView:      (el) => { state.readiness.view = el.getAttribute("data-view"); render(); },
  rdyBack:      () => { state.readiness.step = "questions"; state.readiness.pendingZone = null; render(); },
  rdyPickZone:  (el) => { state.readiness.pendingZone = el.getAttribute("data-zone"); render(); },
  rdyClosePopup:(el, e) => { if (e.target.closest("[data-stop]")) return; state.readiness.pendingZone = null; render(); },
  rdySetSev:    (el) => {
    const zone = el.getAttribute("data-zone"), sev = +el.getAttribute("data-sev");
    const zs = state.readiness.zoneSev;
    if (sev) zs[zone] = sev; else delete zs[zone];
    const { worst, light } = lightFromZones(zs);
    state.readiness.light = light;
    state.readiness.resultSource = worst ? "bodycheck" : "readiness";
    state.readiness.pendingZone = null;
    state.readiness.done = Object.keys(zs).length > 0;
    render();
  },
  rdyAllFine:   () => { state.readiness.light = "green"; state.readiness.done = true; state.readiness.resultSource = "readiness"; render(); },
  rdyOverride:  (el) => { state.readiness.light = el.getAttribute("data-light"); state.readiness.overridden = true; render(); },
  rdyStart:     () => {
    const r = state.readiness, dayKey = sessionDayKey();
    saveReadiness({ answers: r.answers, zoneSev: r.zoneSev, light: r.light, overridden: r.overridden, resultSource: r.resultSource });
    state.pendingSession = { dayKey, light: r.light, rounds: LIGHT_ROUNDS[r.light] };
    startEngine();
  },

  // ---- session controls (delegate to the live engine) ----
  sessPause:      () => { state.session && state.session.togglePause(); },
  sessSkip:       () => { state.session && state.session.skip(); },
  sessTapDone:    () => { state.session && state.session.tapDone(); },
  sessStop:       () => { state.session && state.session.requestStop(); },
  sessResumeStop: () => { state.session && state.session.resumeFromStop(); },
  sessEndStop:    () => { state.session && state.session.endFromStop(); },
  sessLandingClean:  () => { state.session && state.session.gradeLanding("clean"); },
  sessLandingWobbly: () => { state.session && state.session.gradeLanding("wobbly"); },
  sessEnd:        () => { state.session && state.session.endEarly(); },
  sessMood:       (el) => {
    state.__mood = el.getAttribute("data-mood");
    patchLastSession({ mood: state.__mood });
    render();
  },
};

document.addEventListener("click", (e) => {
  const el = e.target.closest("[data-action]");
  if (!el) return;
  const fn = ACTIONS[el.getAttribute("data-action")];
  if (fn) { e.preventDefault(); fn(el, e); }
});

/* Text inputs (Settings name, add-prize) commit on change/blur. */
document.addEventListener("change", (e) => {
  const el = e.target.closest("[data-set]");
  if (el) { saveSettings({ [el.getAttribute("data-set")]: el.value }); }
});

window.addEventListener("resize", () => { const was = state.isWide; computeWide(); if (was !== state.isWide) render(); });

/* ---- boot ---- */
function boot() {
  computeWide();
  try { seedJourneyOnce(); } catch (err) { console.warn("journey seed skipped:", err); }
  render();
  // Best-effort weather; re-render Today when it arrives (offline → stays null).
  getWeather().then(w => { if (w) { state.weather = w; if (state.nav === "today") render(); } }).catch(() => {});
}
boot();

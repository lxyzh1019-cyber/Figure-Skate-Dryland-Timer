/* ============================================================================
   main.js — app state, render() dispatcher, event delegation, boot.
   V2 entry point. Screens not yet rebuilt render a graceful placeholder so the
   app never crashes while the rebuild proceeds phase by phase.
   ============================================================================ */
import { LIGHT_ROUNDS, DAYS } from "./data.js";
import { seedJourneyOnce, saveReadiness, loadLastCheck, loadSettings, patchLastSession } from "./store.js";
import { renderToday } from "./screens/today.js";
import { todayKeyNow } from "./vm/today.js";
import { rail } from "./screens/rail.js";
import {
  renderReadiness, freshReadiness, lightFromAnswers, lightFromZones, LIGHTS
} from "./screens/readiness.js";
import { Session } from "./engine.js";
import { renderSession, updateTimer } from "./screens/session.js";

const state = {
  nav: "today",          // today | progress | grownup | session | readiness | quizdeck | prizedraw
  selectedDay: null,     // null → today
  isWide: true,
  readiness: freshReadiness(),
  pendingSession: null,  // { dayKey, light, rounds }
  session: null,         // live Session engine instance
  __mood: null,
};

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

function render() {
  const app = document.getElementById("app");
  let html;
  switch (state.nav) {
    case "today":     html = renderToday(state); break;
    case "readiness": html = renderReadiness(state); break;
    case "session":   html = state.session ? renderSession(state) : renderToday(state); break;
    case "progress":  html = renderPlaceholder("Your Progress 🏅", "Streaks, prizes, milestones and your training log arrive in the next build phase."); break;
    case "grownup":   html = renderPlaceholder("Grown-up Zone 🧑", "Overview, analytics, library, settings and coaching tools land in a later phase."); break;
    case "quizdeck":  html = renderPlaceholder("Quiz Deck 🧠", "The full 8-move quiz deck arrives in a later build phase."); break;
    default:          html = renderPlaceholder("Coming soon", "This screen is part of a later build phase.");
  }
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
  startQuizDeck:() => { state.nav = "quizdeck"; render(); }, // full deck lands in Phase 4

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

window.addEventListener("resize", () => { const was = state.isWide; computeWide(); if (was !== state.isWide) render(); });

/* ---- boot ---- */
function boot() {
  computeWide();
  try { seedJourneyOnce(); } catch (err) { console.warn("journey seed skipped:", err); }
  render();
}
boot();

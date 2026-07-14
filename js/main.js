/* ============================================================================
   main.js — app state, render() dispatcher, event delegation, boot.
   V2 entry point. Screens not yet rebuilt render a graceful placeholder so the
   app never crashes while the rebuild proceeds phase by phase.
   ============================================================================ */
import { LIGHT_ROUNDS, DAYS } from "./data.js";
import { seedJourneyOnce, saveReadiness, loadLastCheck } from "./store.js";
import { renderToday } from "./screens/today.js";
import { todayKeyNow } from "./vm/today.js";
import { rail } from "./screens/rail.js";
import {
  renderReadiness, freshReadiness, lightFromAnswers, lightFromZones, LIGHTS
} from "./screens/readiness.js";

const state = {
  nav: "today",          // today | progress | grownup | session | readiness | quizdeck | prizedraw
  selectedDay: null,     // null → today
  isWide: true,
  readiness: freshReadiness(),
  pendingSession: null,  // { dayKey, light, rounds }
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

function sessionPlaceholderNote() {
  const ps = state.pendingSession;
  if (!ps) return "The timer, coach cues and round flow are being wired to the new design next.";
  const L = LIGHTS[ps.light];
  const day = DAYS[ps.dayKey];
  return `Readiness set <b>${L.emoji} ${L.label}</b> for <b>${day.title}</b> — ` +
    `${ps.rounds === 0 ? "recovery circuit" : ps.rounds + " main round" + (ps.rounds > 1 ? "s" : "")}. ` +
    `The live timer, coach cues and round flow arrive in Phase 3.`;
}

function render() {
  const app = document.getElementById("app");
  let html;
  switch (state.nav) {
    case "today":     html = renderToday(state); break;
    case "readiness": html = renderReadiness(state); break;
    case "progress":  html = renderPlaceholder("Your Progress 🏅", "Streaks, prizes, milestones and your training log arrive in the next build phase."); break;
    case "grownup":   html = renderPlaceholder("Grown-up Zone 🧑", "Overview, analytics, library, settings and coaching tools land in a later phase."); break;
    case "session":   html = renderPlaceholder("Session player ⛸️", sessionPlaceholderNote()); break;
    case "quizdeck":  html = renderPlaceholder("Quiz Deck 🧠", "The full 8-move quiz deck arrives in a later build phase."); break;
    default:          html = renderPlaceholder("Coming soon", "This screen is part of a later build phase.");
  }
  app.innerHTML = html;
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
  goToday:      () => { state.nav = "today"; state.selectedDay = null; render(); },
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
    state.nav = "session";
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

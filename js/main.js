/* ============================================================================
   main.js — app state, render() dispatcher, event delegation, boot.
   V2 entry point. Screens not yet rebuilt render a graceful placeholder so the
   app never crashes while the rebuild proceeds phase by phase.
   ============================================================================ */
import { seedJourneyOnce } from "./store.js";
import { renderToday } from "./screens/today.js";
import { rail } from "./screens/rail.js";

const state = {
  nav: "today",          // today | progress | grownup | session | readiness | quizdeck | prizedraw
  selectedDay: null,     // null → today
  isWide: true,
};

function computeWide() {
  state.isWide = window.innerWidth >= 900 && window.innerWidth > window.innerHeight;
}

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
    case "today":    html = renderToday(state); break;
    case "progress": html = renderPlaceholder("Your Progress 🏅", "Streaks, prizes, milestones and your training log arrive in the next build phase."); break;
    case "grownup":  html = renderPlaceholder("Grown-up Zone 🧑", "Overview, analytics, library, settings and coaching tools land in a later phase."); break;
    case "session":  html = renderPlaceholder("Session player ⛸️", "The timer, coach cues and round flow are being wired to the new design next."); break;
    case "quizdeck": html = renderPlaceholder("Quiz Deck 🧠", "The full 8-move quiz deck arrives in a later build phase."); break;
    default:         html = renderPlaceholder("Coming soon", "This screen is part of a later build phase.");
  }
  app.innerHTML = html;
}

/* ---- event delegation: one listener resolves data-action ---- */
const ACTIONS = {
  goToday:      () => { state.nav = "today"; state.selectedDay = null; render(); },
  goProgress:   () => { state.nav = "progress"; render(); },
  goGrownup:    () => { state.nav = "grownup"; render(); },
  selectDay:    (el) => { state.selectedDay = el.getAttribute("data-day"); render(); },
  backToToday:  () => { state.selectedDay = null; render(); },
  startSession: () => { state.nav = "session"; render(); },
  startQuizDeck:() => { state.nav = "quizdeck"; render(); }, // full deck lands in Phase 4
};

document.addEventListener("click", (e) => {
  const el = e.target.closest("[data-action]");
  if (!el) return;
  const fn = ACTIONS[el.getAttribute("data-action")];
  if (fn) { e.preventDefault(); fn(el); }
});

window.addEventListener("resize", () => { const was = state.isWide; computeWide(); if (was !== state.isWide) render(); });

/* ---- boot ---- */
function boot() {
  computeWide();
  try { seedJourneyOnce(); } catch (err) { console.warn("journey seed skipped:", err); }
  render();
}
boot();

/* ============================================================================
   screens/today.js — renders the Today (Landing) screen from the VM.
   Transcribed from "Skate Timer - Landing.dc.html" (Today screen): left rail,
   center column (greeting, week strip, stat chips, Quiz Deck launch, Journey
   map hero), right day-detail pane + Start CTA. Handlers use data-action so
   main.js can delegate. Wide + narrow share one markup (flex-wrap stacks it).
   ============================================================================ */
import { buildTodayVM } from "../vm/today.js";
import { rail } from "./rail.js";

const ILLO_WELCOME = "assets/skate/illo-welcome.png";

function weekCell(d) {
  const bg = d.isSelected ? "var(--rose-500)" : (d.isToday ? "var(--rose-100)" : "var(--surface)");
  const fg = d.isSelected ? "#fff" : "var(--ink)";
  const border = d.isSelected ? "var(--rose-500)" : "var(--hairline)";
  const labelColor = d.isSelected ? "rgba(255,255,255,0.85)" : "var(--ink-soft)";
  const iconWrap = `width:34px;height:34px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:16px;` +
    (d.status === "done"
      ? "background:var(--rose-500);color:#fff;"
      : (d.isSelected ? "background:rgba(255,255,255,0.22);" : "background:var(--surface-2);"));
  return `
    <button type="button" data-action="selectDay" data-day="${d.key}"
      style="display:flex;flex-direction:column;align-items:center;gap:5px;padding:9px 4px;border-radius:16px;
             background:${bg};color:${fg};border:2px solid ${border};cursor:pointer;font-family:inherit;">
      <div style="font-size:11px;font-weight:900;letter-spacing:0.04em;color:${labelColor};text-transform:uppercase;">${d.short}</div>
      <div style="${iconWrap}">${d.icon}</div>
      <div style="font-size:12px;font-weight:800;color:${d.isSelected ? 'rgba(255,255,255,0.85)' : 'var(--ink-soft)'};">${d.date}</div>
    </button>`;
}

function statChip(s) {
  return `
    <div style="flex:1;display:flex;flex-direction:column;align-items:center;justify-content:center;text-align:center;gap:2px;
                background:var(--surface);border:2px solid var(--hairline);border-radius:var(--radius-pill);padding:10px 12px;min-width:0;">
      <div style="display:flex;align-items:center;justify-content:center;gap:6px;">
        <span style="font-size:18px;line-height:1;">${s.icon}</span>
        <span style="font-family:var(--font-display);font-weight:600;font-size:18px;color:${s.color};line-height:1;">${s.value}</span>
      </div>
      <span style="font-size:13px;font-weight:800;color:var(--ink-soft);">${s.label}</span>
    </div>`;
}

/* Code-generated watercolor Journey hero (deep berry → blush → gold), no image dependency. */
function journeyHero(j) {
  const pct = Math.max(4, j.levelPct);
  return `
  <div data-action="goProgress" style="flex:1;min-height:260px;position:relative;border-radius:26px;overflow:hidden;cursor:pointer;
       box-shadow:var(--shadow-lift);background:#A8496A;transition:transform .2s var(--ease-out);">
    <svg viewBox="0 0 400 600" preserveAspectRatio="none" aria-hidden="true" style="position:absolute;inset:0;width:100%;height:100%;">
      <defs>
        <linearGradient id="mapGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stop-color="#7A2E48"></stop><stop offset="34%" stop-color="#A8496A"></stop>
          <stop offset="64%" stop-color="#D98BA6"></stop><stop offset="86%" stop-color="#F6D9E1"></stop>
          <stop offset="100%" stop-color="#F9E4C8"></stop>
        </linearGradient>
        <filter id="mapBlur" x="-60%" y="-60%" width="220%" height="220%"><feGaussianBlur stdDeviation="60"></feGaussianBlur></filter>
      </defs>
      <rect x="0" y="0" width="400" height="600" fill="url(#mapGrad)"></rect>
      <g filter="url(#mapBlur)" opacity="0.5">
        <ellipse cx="90" cy="120" rx="140" ry="100" fill="#6E2A44"></ellipse>
        <ellipse cx="320" cy="300" rx="150" ry="110" fill="#C25671"></ellipse>
        <ellipse cx="120" cy="470" rx="150" ry="110" fill="#F2D9A6"></ellipse>
      </g>
    </svg>
    <div style="position:absolute;inset:0;background:linear-gradient(180deg,rgba(142,52,83,0.5),rgba(142,52,83,0.05) 45%,transparent);pointer-events:none;"></div>
    <div style="position:relative;z-index:2;padding:18px 22px;color:#fff;display:flex;flex-direction:column;height:100%;box-sizing:border-box;">
      <div style="font-size:12px;font-weight:900;letter-spacing:0.08em;opacity:0.9;">THE SKATING JOURNEY</div>
      <div style="font-family:var(--font-display);font-weight:600;font-size:22px;line-height:1.2;margin:4px 0 10px;">
        LVL ${j.level} · ${j.rankName}</div>
      <div style="height:9px;background:rgba(255,255,255,0.28);border-radius:9px;overflow:hidden;">
        <div style="width:${pct}%;height:100%;background:var(--gold);border-radius:9px;"></div>
      </div>
      <div style="font-size:13px;font-weight:800;margin-top:8px;opacity:0.95;">
        ${j.xpToNext} XP to ${j.nextRankName === 'Max rank' ? 'the top' : ('LVL ' + (j.level + 1))}</div>
      <div style="margin-top:auto;display:flex;align-items:center;gap:8px;font-size:13px;font-weight:800;opacity:0.9;">
        <span>🗺️ See your whole journey</span><span style="font-size:18px;">›</span>
      </div>
    </div>
  </div>`;
}

function dayDetailPane(v) {
  const dv = v.dayView;
  const gear = dv.equipment.map(e =>
    `<span style="display:inline-flex;align-items:center;gap:6px;background:rgba(255,255,255,0.18);border-radius:var(--radius-pill);padding:7px 14px;font-size:13px;font-weight:800;">🎒 ${e}</span>`
  ).join("");
  return `
  <div style="width:452px;max-width:100%;flex-shrink:0;margin:14px;border-radius:26px;
       background:linear-gradient(165deg,var(--rose-300),var(--rose-500) 60%,var(--rose-600));color:#fff;
       display:flex;flex-direction:column;position:relative;overflow:hidden;box-sizing:border-box;">
    <div style="padding:24px 26px;display:flex;flex-direction:column;gap:14px;flex:1;">
      <div style="display:flex;align-items:center;justify-content:space-between;gap:10px;">
        <span style="background:rgba(255,255,255,0.22);border-radius:var(--radius-pill);padding:6px 14px;font-size:11px;font-weight:900;letter-spacing:0.08em;">${dv.badgeLabel}</span>
        <div style="display:flex;align-items:center;gap:8px;">
          ${v.weather ? `<span style="display:inline-flex;align-items:center;gap:5px;background:rgba(255,255,255,0.28);border-radius:var(--radius-pill);padding:6px 12px;font-size:13px;font-weight:900;" title="${v.weather.caption}">${v.weather.icon} ${v.weather.temp}°</span>` : ""}
          ${dv.isRecovery ? '<span style="font-size:24px;">💤</span>' : '<span style="font-size:24px;">⛸️</span>'}
        </div>
      </div>
      ${dv.showBackToToday ? `<button type="button" data-action="backToToday" style="align-self:flex-start;background:none;border:none;color:rgba(255,255,255,0.9);font-size:13px;font-weight:800;text-decoration:underline;cursor:pointer;padding:0;">← Back to today</button>` : ""}
      <div style="font-family:var(--font-display);font-weight:600;font-size:34px;line-height:1.05;">${dv.title}</div>
      <div style="font-size:14px;font-weight:700;opacity:0.92;line-height:1.35;">${dv.subtitle}</div>
      <div style="display:flex;gap:10px;flex-wrap:wrap;">
        <span style="display:inline-flex;align-items:center;gap:6px;background:rgba(255,255,255,0.18);border-radius:var(--radius-pill);padding:7px 14px;font-size:13px;font-weight:800;">⏱ ${dv.mins} min</span>
        <span style="display:inline-flex;align-items:center;gap:6px;background:rgba(255,255,255,0.18);border-radius:var(--radius-pill);padding:7px 14px;font-size:13px;font-weight:800;">⚡ ${dv.movesLabel}</span>
      </div>
      <div style="display:flex;gap:8px;flex-wrap:wrap;">${gear}</div>
      <div style="font-family:var(--font-hand);font-weight:700;font-size:22px;line-height:1.2;margin-top:2px;">“${dv.mantra}”</div>
      <div style="margin-top:auto;display:flex;flex-direction:column;gap:10px;">
        <button type="button" data-action="startSession" style="min-height:58px;border:none;border-radius:var(--radius-pill);
          background:var(--gold);color:var(--sun-ink);font-family:var(--font-display);font-weight:600;font-size:20px;cursor:pointer;
          box-shadow:0 5px 0 var(--sun-deep);">${dv.ctaLabel} →</button>
      </div>
    </div>
  </div>`;
}

export function renderToday(state) {
  const v = buildTodayVM(state);
  return `
  <div style="width:100%;max-width:1242px;margin:0 auto;box-sizing:border-box;padding:18px;">
    <div style="display:flex;flex-wrap:wrap;background:var(--surface);border-radius:30px;box-shadow:0 18px 44px rgba(142,52,83,0.16);overflow:hidden;min-height:760px;">
      ${rail("today")}
      <!-- CENTER -->
      <div style="flex:1;min-width:300px;padding:24px 26px;display:flex;flex-direction:column;gap:16px;">
        <div style="display:flex;align-items:flex-start;justify-content:space-between;gap:14px;">
          <div>
            <div style="display:flex;align-items:center;gap:10px;">
              <div style="font-family:var(--font-display);font-weight:600;font-size:38px;line-height:1;color:var(--ink);">Hi, ${v.athleteName}!</div>
              <span style="font-size:28px;">⛸️</span>
            </div>
            <div style="font-family:var(--font-hand);font-weight:700;font-size:22px;color:var(--rose-700);margin-top:4px;">Ready to take the ice?</div>
          </div>
          <img src="${ILLO_WELCOME}" alt="" aria-hidden="true" style="height:92px;object-fit:contain;flex-shrink:0;"
               onerror="this.style.display='none'">
        </div>

        <div>
          <div style="display:flex;align-items:baseline;justify-content:space-between;margin-bottom:10px;">
            <span style="font-family:var(--font-display);font-weight:600;font-size:20px;color:var(--ink);">This week</span>
            <span style="font-size:13px;font-weight:800;color:var(--ink-soft);">${v.dateLine}</span>
          </div>
          <div style="display:grid;grid-template-columns:repeat(7,1fr);gap:8px;">
            ${v.week.map(weekCell).join("")}
          </div>
          <div style="display:flex;gap:14px;margin-top:11px;flex-wrap:wrap;">
            ${v.legend.map(l => `<div style="display:flex;align-items:center;gap:6px;"><span>${l.icon}</span><span style="font-size:13px;font-weight:800;color:var(--ink-soft);">${l.label}</span></div>`).join("")}
          </div>
        </div>

        <div style="display:flex;gap:10px;">${v.statChips.map(statChip).join("")}</div>

        <!-- Extras row — secondary; the day-pane Start button is the sole primary CTA -->
        <div>
          <div class="micro-label" style="margin-bottom:8px;">Extras</div>
          <div style="display:flex;gap:10px;flex-wrap:wrap;">
            ${v.journey.pendingDraws > 0 ? `
            <button type="button" data-action="openPrizeDraw" style="flex:1;min-width:150px;display:flex;align-items:center;gap:10px;background:var(--gold-soft);border:2px solid var(--gold);border-radius:var(--radius-lg);padding:11px 13px;cursor:pointer;font-family:inherit;text-align:left;">
              <span style="width:36px;height:36px;border-radius:50%;background:#fff;display:flex;align-items:center;justify-content:center;font-size:19px;flex-shrink:0;">🎁</span>
              <div style="min-width:0;"><div style="font-weight:900;font-size:15px;color:var(--sun-ink);">Open your prize</div>
              <div style="font-size:12px;font-weight:700;color:var(--ink-soft);">You leveled up!</div></div>
            </button>` : ""}
            <button type="button" data-action="startQuizDeck" style="flex:1;min-width:150px;display:flex;align-items:center;gap:10px;background:var(--rose-50);border:2px solid var(--lilac);border-radius:var(--radius-lg);padding:11px 13px;cursor:pointer;font-family:inherit;text-align:left;">
              <span style="width:36px;height:36px;border-radius:50%;background:#fff;display:flex;align-items:center;justify-content:center;font-size:19px;flex-shrink:0;">🧠</span>
              <div style="min-width:0;"><div style="font-weight:900;font-size:15px;color:var(--ink);">Quiz Deck</div>
              <div style="font-size:12px;font-weight:700;color:var(--ink-soft);">Test your moves</div></div>
            </button>
          </div>
        </div>

        ${journeyHero(v.journey)}
      </div>
      ${dayDetailPane(v)}
    </div>
  </div>`;
}

/* ============================================================================
   screens/grownup.js — Grown-up Zone, 5 tabs:
   Overview · Analytics · Library · Settings · Coaching.
   Reads real history; Settings controls persist to skateTrainingSettingsV2 and
   take effect in the next session. Driven by state.grownupTab (+ state.libDetail).
   ============================================================================ */
import { DAYS, STANDING_RULES, COACH_CHANNELS, ENGAGEMENT_SYSTEMS, TOP7, DAY_KEYS } from "../data.js";
import { loadSessions, loadSettings, thisWeekSessions, currentStreak, longestStreak, movesToWatch, easyDaysLast7 } from "../store.js";
import { rail } from "./rail.js";

const TABS = [
  { key: "overview",  label: "Overview",  icon: "📋" },
  { key: "analytics", label: "Analytics", icon: "📈" },
  { key: "library",   label: "Library",   icon: "📚" },
  { key: "settings",  label: "Settings",  icon: "⚙️" },
  { key: "coaching",  label: "Coaching",  icon: "🧭" }
];

function tabBar(active) {
  return `<div data-tab-scroll style="display:flex;gap:8px;overflow-x:auto;padding-bottom:6px;margin-bottom:18px;">
    ${TABS.map(t => `<button type="button" data-action="guTab" data-tab="${t.key}" style="flex-shrink:0;display:flex;align-items:center;gap:6px;border-radius:var(--radius-pill);padding:10px 18px;font-family:inherit;font-weight:900;font-size:14px;cursor:pointer;border:2px solid ${t.key === active ? "var(--rose-500)" : "var(--hairline)"};background:${t.key === active ? "var(--rose-500)" : "var(--surface)"};color:${t.key === active ? "#fff" : "var(--ink)"};">${t.icon} ${t.label}</button>`).join("")}
  </div>`;
}

function card(title, inner) {
  return `<div style="background:var(--surface);border:1.5px solid var(--hairline);border-radius:var(--radius-xl);padding:18px;box-shadow:var(--shadow-soft);margin-bottom:16px;">
    ${title ? `<div class="micro-label" style="margin-bottom:12px;">${title}</div>` : ""}${inner}</div>`;
}

/* ---- Overview ---- */
function overviewTab() {
  const all = loadSessions();
  const week = thisWeekSessions();
  const planned = 6; // Mon–Sat training days
  const adherence = Math.min(100, Math.round((week.filter(s => DAYS[s.dayKey] && !DAYS[s.dayKey].spa).length / planned) * 100));
  const painFlags = all.filter(s => s.pain || s.light === "red" || s.light === "recovery").slice(-5).reverse();
  const skipTotal = all.reduce((a, s) => a + (s.skipped || 0), 0);
  const easy = easyDaysLast7();
  const watch = movesToWatch(5);
  return `
    ${easy >= 2 ? `<div style="display:flex;align-items:center;gap:12px;background:var(--gold-soft);border:2px solid var(--gold);border-radius:var(--radius-lg);padding:14px 16px;margin-bottom:16px;">
      <span style="font-size:24px;">💛</span>
      <div style="font-weight:800;color:var(--ink);line-height:1.4;">${easy} easy/rest days in the last week — worth a gentle check-in about how ${loadSettings().athleteName} is feeling.</div></div>` : ""}
    ${card("This week", `
      <div style="display:flex;gap:20px;flex-wrap:wrap;">
        <div><div style="font-family:var(--font-display);font-size:34px;font-weight:600;color:var(--rose-600);">${week.length}/${planned}</div><div style="font-size:13px;font-weight:800;color:var(--ink-soft);">sessions done</div></div>
        <div style="flex:1;min-width:160px;"><div style="display:flex;justify-content:space-between;"><span class="micro-label">Adherence</span><span style="font-weight:900;color:var(--rose-600);">${adherence}%</span></div>
          <div style="height:10px;background:var(--surface-2);border-radius:8px;overflow:hidden;margin-top:6px;"><div style="width:${adherence}%;height:100%;background:var(--rose-500);"></div></div></div>
        <div><div style="font-family:var(--font-display);font-size:34px;font-weight:600;color:var(--coral-deep,#D99A2E);">${currentStreak()}</div><div style="font-size:13px;font-weight:800;color:var(--ink-soft);">day streak</div></div>
      </div>`)}
    ${card("⚠ Body flags (recent easy / stopped days)", painFlags.length
      ? painFlags.map(s => `<div style="display:flex;align-items:center;gap:10px;padding:8px 0;border-bottom:1px solid var(--hairline);"><span style="font-size:18px;">${s.pain ? "🛑" : s.light === "recovery" ? "🧊" : "🔴"}</span><div style="flex:1;"><b>${(DAYS[s.dayKey] || {}).title || s.dayKey}</b> · ${s.isoDate ? new Date(s.isoDate).toLocaleDateString() : ""}</div><span style="font-size:12px;font-weight:800;color:var(--ink-soft);">${s.pain ? "pain flag" : s.light}</span></div>`).join("")
      : `<div style="font-size:14px;font-weight:700;color:var(--ink-soft);">No pain flags or forced-easy days recently. 👍</div>`)}
    ${card("👀 Moves to watch", watch.length
      ? watch.map(w => `<div style="display:flex;align-items:center;gap:10px;padding:8px 0;border-bottom:1px solid var(--hairline);">
          <span style="flex:1;font-weight:800;color:var(--ink);">${w.move}</span>
          ${w.wobbly ? `<span style="font-size:12px;font-weight:800;color:var(--coral-deep,#D99A2E);">${w.wobbly} wobbly landing${w.wobbly === 1 ? "" : "s"}</span>` : ""}
          ${w.missed ? `<span style="font-size:12px;font-weight:800;color:var(--stop-ink);">${w.missed} quiz miss${w.missed === 1 ? "" : "es"}</span>` : ""}
        </div>`).join("")
      : `<div style="font-size:14px;font-weight:700;color:var(--ink-soft);">Nothing standing out — clean landings and solid quiz answers. 👍</div>`)}
    ${card("Totals", `<div style="display:flex;gap:24px;flex-wrap:wrap;font-weight:800;color:var(--ink);">
      <div>🏅 <b>${all.length}</b> sessions</div><div>🔥 best streak <b>${longestStreak()}</b></div><div>⏭ <b>${skipTotal}</b> skips</div></div>`)}
  `;
}

/* ---- Analytics ---- */
function analyticsTab() {
  const all = loadSessions();
  const byLight = { green: 0, yellow: 0, red: 0, recovery: 0 };
  all.forEach(s => { if (byLight[s.light] != null) byLight[s.light]++; });
  const totalMin = Math.round(all.reduce((a, s) => a + (s.durationSecs || 0) / 60, 0));
  const avgMin = all.length ? Math.round(totalMin / all.length) : 0;
  // Simple acute:chronic workload ratio (last 7d minutes vs avg weekly over 28d).
  const now = Date.now(), DAY = 86400000;
  const load = (days) => all.filter(s => s.isoDate && now - new Date(s.isoDate).getTime() <= days * DAY).reduce((a, s) => a + (s.durationSecs || 0) / 60, 0);
  const acute = load(7), chronic = load(28) / 4;
  const acwr = chronic > 0 ? (acute / chronic).toFixed(2) : "—";
  const acwrColor = acwr === "—" ? "var(--ink-soft)" : (acwr > 1.5 ? "var(--stop)" : acwr < 0.8 ? "var(--gold)" : "var(--mint)");
  const lightRow = ["green", "yellow", "red", "recovery"].map(k => {
    const c = { green: "var(--mint)", yellow: "var(--gold)", red: "var(--stop)", recovery: "var(--lilac)" }[k];
    const pct = all.length ? Math.round((byLight[k] / all.length) * 100) : 0;
    return `<div style="margin-bottom:8px;"><div style="display:flex;justify-content:space-between;font-size:13px;font-weight:800;"><span style="text-transform:capitalize;">${k}</span><span>${byLight[k]} (${pct}%)</span></div><div style="height:8px;background:var(--surface-2);border-radius:8px;overflow:hidden;"><div style="width:${pct}%;height:100%;background:${c};"></div></div></div>`;
  }).join("");
  return `
    ${all.length ? "" : card("", `<div style="font-size:14px;font-weight:700;color:var(--ink-soft);">No data yet — analytics fill in after the first few sessions.</div>`)}
    ${card("Key numbers", `<div style="display:flex;gap:24px;flex-wrap:wrap;font-weight:800;">
      <div><div style="font-family:var(--font-display);font-size:28px;color:var(--rose-600);">${all.length}</div>sessions</div>
      <div><div style="font-family:var(--font-display);font-size:28px;color:var(--rose-600);">${totalMin}</div>total min</div>
      <div><div style="font-family:var(--font-display);font-size:28px;color:var(--rose-600);">${avgMin}</div>avg min</div>
      <div><div style="font-family:var(--font-display);font-size:28px;color:${acwrColor};">${acwr}</div>ACWR (7d:28d)</div></div>
      <div style="font-size:12px;font-weight:700;color:var(--ink-soft);margin-top:8px;">ACWR sweet spot ~0.8–1.3. High = ramping fast; low = tapering.</div>`)}
    ${card("Readiness mix", lightRow)}
    ${card("Export", `<button type="button" data-action="guExportCsv" class="btn btn-primary" style="padding:12px 22px;font-size:15px;">⬇ Download session CSV</button>`)}
  `;
}

/* ---- Library ---- */
function uniqueMoves() {
  const seen = new Map();
  DAY_KEYS.forEach(k => {
    const d = DAYS[k];
    Object.values(d.blocks || {}).forEach(arr => (arr || []).forEach(ex => { if (!seen.has(ex.name)) seen.set(ex.name, ex); }));
    (d.recoveryHolds || []).forEach(ex => { if (!seen.has(ex.name)) seen.set(ex.name, ex); });
  });
  return [...seen.values()];
}
function libraryTab(state) {
  const moves = uniqueMoves();
  const detail = state.libDetail ? moves.find(m => m.name === state.libDetail) : null;
  const grid = moves.map(m => `
    <button type="button" data-action="guLibOpen" data-name="${m.name.replace(/"/g, "&quot;")}" style="text-align:left;background:var(--surface);border:2px solid var(--hairline);border-radius:var(--radius-md);padding:14px;cursor:pointer;font-family:inherit;display:flex;flex-direction:column;gap:4px;">
      <div style="font-weight:800;font-size:15px;color:var(--ink);">${m.name}</div>
      <div style="font-size:12px;font-weight:700;color:var(--ink-soft);">${m.swimTransfer || m.block}</div>
    </button>`).join("");
  const modal = detail ? `
    <div data-action="guLibClose" style="position:absolute;inset:0;z-index:20;background:rgba(142,52,83,0.5);display:flex;align-items:center;justify-content:center;padding:24px;">
      <div data-stop="1" style="background:var(--surface);border-radius:var(--radius-xl);box-shadow:var(--shadow-float);max-width:520px;width:100%;padding:24px;">
        <div style="display:flex;justify-content:space-between;align-items:flex-start;gap:12px;">
          <div style="font-family:var(--font-display);font-weight:600;font-size:24px;color:var(--ink);">${detail.name}</div>
          <button type="button" data-action="guLibClose" style="width:32px;height:32px;border-radius:50%;border:none;background:var(--surface-2);cursor:pointer;font-weight:900;">✕</button>
        </div>
        <div style="font-size:13px;font-weight:800;color:var(--ink-soft);margin:4px 0 14px;">${detail.dose || ""}</div>
        ${detail.cue ? `<div style="background:var(--rose-50);border-radius:var(--radius-md);padding:12px 14px;margin-bottom:10px;"><div class="micro-label" style="color:var(--rose-600);margin-bottom:4px;">Coach cue</div><div style="font-weight:700;color:var(--ink);line-height:1.4;">${detail.cue}</div></div>` : ""}
        ${detail.parentWatch ? `<div style="background:var(--gold-soft);border-radius:var(--radius-md);padding:12px 14px;margin-bottom:10px;"><div class="micro-label" style="color:var(--sun-ink);margin-bottom:4px;">👀 Watch for</div><div style="font-weight:700;color:var(--ink);line-height:1.4;">${detail.parentWatch}${detail.redFlag ? ` · 🔧 ${detail.redFlag}` : ""}</div></div>` : ""}
        ${detail.swimTransfer ? `<div style="font-size:13px;font-weight:800;color:var(--ink-soft);margin-bottom:12px;">→ On the ice: ${detail.swimTransfer}</div>` : ""}
        <a href="https://www.youtube.com/results?search_query=${encodeURIComponent(detail.searchableName || detail.name)}" target="_blank" rel="noopener" style="display:inline-flex;align-items:center;gap:8px;text-decoration:none;background:var(--rose-500);color:#fff;font-weight:900;border-radius:var(--radius-pill);padding:12px 20px;">▶ Watch how-to</a>
      </div>
    </div>` : "";
  return `<div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(180px,1fr));gap:10px;">${grid}</div>${modal}`;
}

/* ---- Settings ---- */
function stepper(label, key, val, unit) {
  return `<div style="display:flex;align-items:center;justify-content:space-between;padding:10px 0;border-bottom:1px solid var(--hairline);">
    <span style="font-weight:800;color:var(--ink);">${label}</span>
    <div style="display:flex;align-items:center;gap:10px;">
      <button type="button" data-action="guStep" data-key="${key}" data-delta="-1" style="width:34px;height:34px;border-radius:50%;border:2px solid var(--border-strong);background:var(--surface);cursor:pointer;font-weight:900;">−</button>
      <span style="min-width:56px;text-align:center;font-weight:900;color:var(--rose-600);">${val}${unit}</span>
      <button type="button" data-action="guStep" data-key="${key}" data-delta="1" style="width:34px;height:34px;border-radius:50%;border:2px solid var(--border-strong);background:var(--surface);cursor:pointer;font-weight:900;">+</button>
    </div></div>`;
}
function toggle(label, key, on) {
  return `<div style="display:flex;align-items:center;justify-content:space-between;padding:10px 0;border-bottom:1px solid var(--hairline);">
    <span style="font-weight:800;color:var(--ink);">${label}</span>
    <button type="button" data-action="guToggle" data-key="${key}" style="width:54px;height:30px;border-radius:var(--radius-pill);border:none;cursor:pointer;background:${on ? "var(--rose-500)" : "var(--surface-2)"};position:relative;transition:background .2s;">
      <span style="position:absolute;top:3px;left:${on ? "27px" : "3px"};width:24px;height:24px;border-radius:50%;background:#fff;transition:left .2s;box-shadow:0 1px 3px rgba(0,0,0,0.2);"></span></button></div>`;
}
function settingsTab() {
  const s = loadSettings();
  const styles = ["calm", "warm", "peppy"];
  return `
    ${card("Athlete", `<div style="display:flex;align-items:center;justify-content:space-between;gap:12px;">
      <span style="font-weight:800;">Name</span>
      <input type="text" data-set="athleteName" value="${(s.athleteName || "").replace(/"/g, "&quot;")}" style="border:2px solid var(--border-strong);border-radius:var(--radius-pill);padding:8px 16px;font-family:inherit;font-weight:800;color:var(--ink);max-width:200px;"></div>`)}
    ${card("Coach voice", `
      ${toggle("Coach voice on", "coachVoiceOn", s.coachVoiceOn)}
      <div style="display:flex;align-items:center;justify-content:space-between;padding:10px 0;">
        <span style="font-weight:800;">Voice style</span>
        <div style="display:flex;gap:6px;">${styles.map(v => `<button type="button" data-action="guVoiceStyle" data-style="${v}" style="border-radius:var(--radius-pill);padding:8px 14px;font-weight:900;font-size:13px;cursor:pointer;border:2px solid ${s.voiceStyle === v ? "var(--rose-500)" : "var(--hairline)"};background:${s.voiceStyle === v ? "var(--rose-500)" : "var(--surface)"};color:${s.voiceStyle === v ? "#fff" : "var(--ink)"};text-transform:capitalize;">${v}</button>`).join("")}</div>
      </div>`)}
    ${card("Rest timing", `
      ${stepper("Between exercises", "exerciseRestSeconds", s.exerciseRestSeconds, "s")}
      ${stepper("Between rounds", "roundRestSeconds", s.roundRestSeconds, "s")}
      ${stepper("Between blocks", "sectionRestSeconds", s.sectionRestSeconds, "s")}`)}
    ${card("Practice mode", `${toggle("Practice (nothing is recorded)", "testMode", s.testMode)}`)}
    ${card("Prize pool", `<div style="display:flex;flex-wrap:wrap;gap:8px;margin-bottom:10px;">
      ${(s.prizePool || []).map((pz, i) => `<span style="display:inline-flex;align-items:center;gap:6px;background:var(--rose-100);border-radius:var(--radius-pill);padding:7px 12px;font-weight:800;font-size:13px;color:var(--rose-700);">${pz}<button type="button" data-action="guPrizeRemove" data-i="${i}" style="border:none;background:none;cursor:pointer;color:var(--rose-600);font-weight:900;">✕</button></span>`).join("")}</div>
      <div style="display:flex;gap:8px;"><input type="text" data-set-prize placeholder="Add a prize…" style="flex:1;border:2px solid var(--border-strong);border-radius:var(--radius-pill);padding:8px 16px;font-family:inherit;">
      <button type="button" data-action="guPrizeAdd" class="btn btn-primary" style="padding:8px 18px;">Add</button></div>`)}
  `;
}

/* ---- Coaching ---- */
function coachingTab() {
  return `
    ${card("Standing rules & quality gates", `<ul style="margin:0;padding-left:20px;line-height:1.6;font-weight:600;color:var(--ink);">${STANDING_RULES.map(r => `<li style="margin-bottom:6px;">${r}</li>`).join("")}</ul>`)}
    ${card("Independence ladder — top moves", `<div style="display:flex;flex-wrap:wrap;gap:8px;">${TOP7.map(t => `<span style="background:var(--rose-50);border:2px solid var(--rose-200);border-radius:var(--radius-pill);padding:7px 14px;font-weight:800;font-size:13px;color:var(--rose-700);">${t}</span>`).join("")}</div>`)}
    ${card("Weekly engagement systems", Object.values(ENGAGEMENT_SYSTEMS).map(e => `<div style="margin-bottom:10px;"><div style="font-weight:900;color:var(--ink);">${e.label}</div><div style="font-size:14px;font-weight:600;color:var(--ink-soft);line-height:1.4;">${e.desc}</div></div>`).join(""))}
    ${card("Coach channels", Object.values(COACH_CHANNELS).map(c => `<div style="display:flex;justify-content:space-between;padding:8px 0;border-bottom:1px solid var(--hairline);"><span style="font-weight:800;">${c.label}</span><a href="${c.url}" target="_blank" rel="noopener" style="font-weight:800;">${c.name} ↗</a></div>`).join(""))}
  `;
}

export function renderGrownup(state) {
  const tab = state.grownupTab || "overview";
  let body;
  switch (tab) {
    case "analytics": body = analyticsTab(); break;
    case "library":   body = libraryTab(state); break;
    case "settings":  body = settingsTab(); break;
    case "coaching":  body = coachingTab(); break;
    default:          body = overviewTab();
  }
  return `
  <div style="width:100%;max-width:1242px;margin:0 auto;box-sizing:border-box;padding:18px;">
    <div style="position:relative;display:flex;background:var(--surface);border-radius:30px;box-shadow:0 18px 44px rgba(142,52,83,0.16);overflow:hidden;min-height:760px;">
      ${rail("grownup")}
      <div style="flex:1;min-width:280px;padding:24px 26px;overflow-y:auto;">
        <div style="font-family:var(--font-display);font-weight:600;font-size:30px;color:var(--ink);margin-bottom:16px;">Grown-up Zone 🧑</div>
        ${tabBar(tab)}
        ${body}
      </div>
    </div>
  </div>`;
}

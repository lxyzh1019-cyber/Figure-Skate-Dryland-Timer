/* ============================================================================
   screens/session.js — session player rendered from engine.snapshot().
   Full re-render on phase change; per-second timer updates are targeted DOM
   writes (see updateTimer). Styled in the Skate with Grace system.
   ============================================================================ */
const RING_R = 92;
const RING_C = 2 * Math.PI * RING_R;

function fmt(s) { s = Math.max(0, s | 0); return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`; }

/* Targeted per-second update — no full re-render (avoids flicker + TTS races). */
export function updateTimer(remaining, total) {
  const t = document.getElementById("sess-remaining");
  if (t) t.textContent = String(Math.max(0, remaining | 0));
  const ring = document.getElementById("sess-ring");
  if (ring && total > 0) ring.style.strokeDashoffset = String(RING_C * (1 - remaining / total));
}

function timerRing(remaining, total, color = "var(--rose-500)") {
  const off = total > 0 ? RING_C * (1 - remaining / total) : 0;
  return `
    <svg viewBox="0 0 220 220" style="width:220px;height:220px;transform:rotate(-90deg);">
      <circle cx="110" cy="110" r="${RING_R}" fill="none" stroke="var(--surface-2)" stroke-width="16"/>
      <circle id="sess-ring" cx="110" cy="110" r="${RING_R}" fill="none" stroke="${color}" stroke-width="16"
        stroke-linecap="round" stroke-dasharray="${RING_C}" stroke-dashoffset="${off}"
        style="transition:stroke-dashoffset 1s linear;"/>
    </svg>`;
}

function controls(snap) {
  return `
    <div style="display:flex;gap:12px;justify-content:center;flex-wrap:wrap;margin-top:22px;">
      <button type="button" data-action="sessPause" class="btn" style="background:var(--surface);color:var(--rose-600);border:2px solid var(--border-strong);padding:14px 24px;font-size:16px;">
        ${snap.paused ? "▶ Resume" : "⏸ Pause"}</button>
      <button type="button" data-action="sessSkip" class="btn" style="background:var(--surface);color:var(--rose-600);border:2px solid var(--border-strong);padding:14px 24px;font-size:16px;">⏭ Skip</button>
      <button type="button" data-action="sessStop" class="btn" style="background:var(--stop);color:#fff;padding:14px 24px;font-size:16px;">■ Stop</button>
    </div>`;
}

function cueCard(ex, side) {
  if (!ex) return "";
  const chips = [];
  if (ex.cue) chips.push(`<div style="background:var(--rose-50);border-radius:var(--radius-md);padding:12px 14px;"><div class="micro-label" style="color:var(--rose-600);margin-bottom:4px;">Coach cue</div><div style="font-size:16px;font-weight:700;color:var(--ink);line-height:1.4;">${ex.cue}</div></div>`);
  if (ex.parentWatch) chips.push(`<div style="background:var(--gold-soft);border-radius:var(--radius-md);padding:12px 14px;"><div class="micro-label" style="color:var(--sun-ink);margin-bottom:4px;">👀 Watch for</div><div style="font-size:15px;font-weight:700;color:var(--ink);line-height:1.4;">${ex.parentWatch}${ex.redFlag ? ` · <span style="color:var(--ink-soft);">🔧 ${ex.redFlag}</span>` : ""}</div></div>`);
  return `<div style="display:flex;flex-direction:column;gap:10px;max-width:460px;margin:0 auto;">${chips.join("")}</div>`;
}

function exercisePhase(snap) {
  const ex = snap.ex, timed = ex.driver === "time" || ex.work != null;
  const gateBadge = ex.gate === "valgus"
    ? `<div style="display:inline-flex;align-items:center;gap:6px;background:var(--stop-wash);color:var(--stop-ink);border-radius:var(--radius-pill);padding:6px 14px;font-size:12px;font-weight:900;margin-top:8px;">⚠ Land &amp; freeze — knee over toe</div>` : "";
  return `
    <div style="display:flex;flex-direction:column;align-items:center;text-align:center;gap:12px;">
      <div style="display:flex;align-items:center;gap:10px;flex-wrap:wrap;justify-content:center;">
        <span style="background:var(--rose-100);color:var(--rose-700);border-radius:var(--radius-pill);padding:6px 14px;font-size:12px;font-weight:900;letter-spacing:0.05em;text-transform:uppercase;">${snap.blockLabel}${snap.rounds > 1 ? ` · Round ${snap.round}/${snap.rounds}` : ""}</span>
        ${snap.side ? `<span style="background:var(--lilac);color:#fff;border-radius:var(--radius-pill);padding:6px 14px;font-size:12px;font-weight:900;">${snap.side} side</span>` : ""}
      </div>
      <div style="font-family:var(--font-display);font-weight:600;font-size:30px;color:var(--ink);line-height:1.1;">${ex.name}</div>
      <div style="font-size:14px;font-weight:800;color:var(--ink-soft);">${ex.dose || ""}</div>
      ${gateBadge}
      <div style="position:relative;display:flex;align-items:center;justify-content:center;">
        ${timed ? timerRing(snap.remaining, snap.total) : timerRing(1, 1, "var(--gold)")}
        <div style="position:absolute;inset:0;display:flex;flex-direction:column;align-items:center;justify-content:center;">
          ${timed
            ? `<div style="font-family:var(--font-display);font-weight:600;font-size:56px;color:var(--rose-600);line-height:1;"><span id="sess-remaining">${snap.remaining}</span></div><div class="micro-label">seconds</div>`
            : `<div style="font-size:34px;">🖐️</div><div style="font-size:13px;font-weight:800;color:var(--ink-soft);max-width:150px;">Tap when you're done</div>`}
        </div>
      </div>
      ${timed ? "" : `<button type="button" data-action="sessTapDone" class="btn btn-primary" style="padding:14px 34px;font-size:18px;">Done ✓</button>`}
      ${cueCard(ex, snap.side)}
      ${controls(snap)}
    </div>`;
}

function restPhase(snap, title, sub, emoji) {
  return `
    <div style="display:flex;flex-direction:column;align-items:center;text-align:center;gap:14px;">
      <div style="font-size:52px;">${emoji}</div>
      <div style="font-family:var(--font-display);font-weight:600;font-size:30px;color:var(--rose-700);">${title}</div>
      ${sub ? `<div style="font-size:15px;font-weight:700;color:var(--ink-soft);">${sub}</div>` : ""}
      <div style="position:relative;display:flex;align-items:center;justify-content:center;">
        ${timerRing(snap.remaining, snap.total, "var(--gold)")}
        <div style="position:absolute;inset:0;display:flex;align-items:center;justify-content:center;">
          <div style="font-family:var(--font-display);font-weight:600;font-size:52px;color:var(--sun-ink);"><span id="sess-remaining">${snap.remaining}</span></div>
        </div>
      </div>
      ${controls(snap)}
    </div>`;
}

function roundRest(snap) {
  const dots = Array.from({ length: snap.rounds }, (_, i) =>
    `<span style="width:14px;height:14px;border-radius:50%;background:${i < snap.round ? "var(--rose-500)" : "var(--surface-2)"};"></span>`).join("");
  return `
    <div style="display:flex;flex-direction:column;align-items:center;text-align:center;gap:14px;">
      <img src="assets/skate/illo-nice-work.png" alt="" style="height:120px;object-fit:contain;" onerror="this.style.display='none'">
      <div style="font-family:var(--font-display);font-weight:600;font-size:30px;color:var(--rose-700);">Great round!</div>
      <div style="display:flex;gap:8px;">${dots}</div>
      ${snap.intentWord ? `<div style="font-family:var(--font-hand);font-size:22px;font-weight:700;color:var(--rose-700);">This round, think: <b>${snap.intentWord}</b></div>` : ""}
      <div style="position:relative;display:flex;align-items:center;justify-content:center;">
        ${timerRing(snap.remaining, snap.total, "var(--gold)")}
        <div style="position:absolute;inset:0;display:flex;align-items:center;justify-content:center;">
          <div style="font-family:var(--font-display);font-weight:600;font-size:52px;color:var(--sun-ink);"><span id="sess-remaining">${snap.remaining}</span></div>
        </div>
      </div>
      ${controls(snap)}
    </div>`;
}

function stopOverlay() {
  return `
    <div style="position:absolute;inset:0;z-index:20;background:var(--stop-wash);display:flex;flex-direction:column;align-items:center;justify-content:center;gap:16px;padding:40px;text-align:center;">
      <img src="assets/skate/illo-take-a-breath.png" alt="" style="height:150px;object-fit:contain;" onerror="this.style.display='none'">
      <div style="font-family:var(--font-display);font-weight:600;font-size:32px;color:var(--stop-ink);">Stopped. Good call.</div>
      <div style="font-size:16px;font-weight:700;color:var(--ink);line-height:1.5;max-width:460px;">If something hurts — sharp pain, pinching, or numbness — <b>tell a grown-up right now</b>. Your body matters more than any streak.</div>
      <div style="display:flex;gap:14px;flex-wrap:wrap;justify-content:center;">
        <button type="button" data-action="sessResumeStop" class="btn btn-primary" style="padding:16px 26px;font-size:16px;">I'm okay — keep going</button>
        <button type="button" data-action="sessEndStop" class="btn" style="background:var(--surface);color:var(--stop-ink);border:2px solid var(--stop);padding:16px 26px;font-size:16px;">End session</button>
      </div>
    </div>`;
}

const MOODS = [
  { key: "strong", emoji: "💪", label: "Strong" },
  { key: "good",   emoji: "😊", label: "Good" },
  { key: "tough",  emoji: "😮‍💨", label: "Tough" }
];

export function renderComplete(state, complete) {
  const c = complete, e = c.entry;
  const xp = c.xp;
  const mins = Math.max(1, Math.round(e.durationSecs / 60));
  return `
  <div style="width:100%;max-width:1242px;margin:0 auto;box-sizing:border-box;padding:18px;">
    <div style="background:var(--rose-50);border-radius:30px;box-shadow:0 18px 44px rgba(142,52,83,0.16);padding:40px;display:flex;flex-direction:column;align-items:center;text-align:center;gap:16px;min-height:600px;justify-content:center;">
      <img src="assets/skate/illo-nice-work.png" alt="" style="height:180px;object-fit:contain;" onerror="this.style.display='none'">
      <div style="font-family:var(--font-script);font-weight:700;font-size:44px;color:var(--rose-700);line-height:1;">${c.completedFully ? "Session Complete!" : "Good work today!"}</div>
      ${c.mantra ? `<div style="font-family:var(--font-hand);font-size:24px;font-weight:700;color:var(--rose-600);">“${c.mantra}”</div>` : ""}
      <div style="font-size:16px;font-weight:800;color:var(--ink-soft);">${state.__dayTitle || ""} · ${mins} min${e.endedEarly ? " · ended early" : ""}</div>
      ${xp && xp.gained ? `<div style="display:flex;flex-direction:column;align-items:center;gap:6px;background:var(--surface);border:2px solid var(--gold);border-radius:var(--radius-lg);padding:14px 22px;">
        <div style="font-family:var(--font-display);font-weight:600;font-size:22px;color:var(--sun-ink);">+${xp.gained} XP ⭐</div>
        ${xp.leveledUp ? `<div style="font-size:14px;font-weight:900;color:var(--rose-600);">🎉 Level up! You reached LVL ${xp.to} — a prize draw is waiting on Progress!</div>` : `<div style="font-size:13px;font-weight:800;color:var(--ink-soft);">Keep it up — every rep counts!</div>`}
      </div>` : ""}
      <div style="display:flex;flex-direction:column;align-items:center;gap:10px;margin-top:4px;">
        <div style="font-family:var(--font-hand);font-size:22px;font-weight:700;color:var(--ink);">How did it feel?</div>
        <div style="display:flex;gap:12px;">
          ${MOODS.map(m => `<button type="button" data-action="sessMood" data-mood="${m.key}" class="btn" style="background:${state.__mood === m.key ? 'var(--rose-500)' : 'var(--surface)'};color:${state.__mood === m.key ? '#fff' : 'var(--ink)'};border:2px solid var(--border-strong);display:flex;flex-direction:column;gap:4px;padding:12px 20px;"><span style="font-size:28px;">${m.emoji}</span><span style="font-size:13px;font-weight:900;">${m.label}</span></button>`).join("")}
        </div>
      </div>
      <div style="display:flex;gap:12px;flex-wrap:wrap;justify-content:center;margin-top:12px;">
        ${xp && xp.leveledUp ? `<button type="button" data-action="openPrizeDraw" class="btn btn-primary" style="padding:16px 30px;font-family:var(--font-display);font-weight:600;font-size:20px;">🎁 Open your prize</button>` : ""}
        <button type="button" data-action="goToday" class="btn btn-go" style="padding:16px 32px;font-family:var(--font-display);font-weight:600;font-size:20px;">🏠 Back to Today</button>
      </div>
    </div>
  </div>`;
}

export function renderSession(state) {
  const eng = state.session;
  if (!eng) return "";
  const snap = eng.snapshot();
  state.__dayTitle = snap.dayTitle;
  if (snap.complete) return renderComplete(state, snap.complete);

  let inner;
  switch (snap.kind) {
    case "exercise":   inner = exercisePhase(snap); break;
    case "sideSwitch": inner = restPhase({ ...snap, remaining: 0, total: 1 }, "Switch sides", snap.ex ? snap.ex.name : "", "🔄"); break;
    case "roundRest":  inner = roundRest(snap); break;
    case "sectionRest":inner = restPhase(snap, "Block done — breathe", snap.next ? "Up next: " + (snap.blockLabel) : "Next block coming up", "🌬️"); break;
    case "exRest":     inner = restPhase(snap, "Rest", snap.next ? "Up next: " + snap.next : "", "💧"); break;
    default:           inner = `<div style="text-align:center;padding:40px;">Getting ready…</div>`;
  }
  return `
  <div style="width:100%;max-width:1242px;margin:0 auto;box-sizing:border-box;padding:18px;">
    <div style="position:relative;background:var(--surface);border-radius:30px;box-shadow:0 18px 44px rgba(142,52,83,0.16);padding:26px;min-height:640px;display:flex;flex-direction:column;">
      <div style="margin-bottom:18px;">
        <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:6px;">
          <span class="micro-label">${snap.dayTitle} · ${fmt(snap.elapsedSecs)}</span>
          <button type="button" data-action="sessEnd" style="background:none;border:none;color:var(--ink-soft);font-weight:800;font-size:13px;cursor:pointer;text-decoration:underline;">End early</button>
        </div>
        <div style="height:8px;background:var(--surface-2);border-radius:8px;overflow:hidden;">
          <div style="width:${snap.progressPct}%;height:100%;background:var(--rose-500);border-radius:8px;transition:width .4s;"></div>
        </div>
      </div>
      <div style="flex:1;display:flex;align-items:center;justify-content:center;">${inner}</div>
      ${snap.stopOverlay ? stopOverlay() : ""}
    </div>
  </div>`;
}

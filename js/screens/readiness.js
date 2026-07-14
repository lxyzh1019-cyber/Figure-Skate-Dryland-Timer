/* ============================================================================
   screens/readiness.js — "Body Check" readiness (V2 Assessment).
   4 yes/no questions → if sore, an inline SVG body map (front/back) with a
   per-zone severity popup → computed traffic-light (grown-up can override) →
   Start CTA. Ported from "Skate Timer - Assessment.dc.html" logic; the body
   map is an inline SVG silhouette (the design PNGs exceed the 256 KiB fetch
   cap), so it works offline with no binary dependency.
   Outcome light drives LIGHT_ROUNDS exactly as the original engine expects.
   ============================================================================ */
import { LIGHT_ROUNDS } from "../data.js";
import { loadSettings, loadLastCheck } from "../store.js";

export const RQS = [
  { id: "q_pain",  text: "Any aches or sore spots today?",             isPain: true, yes: "😊 All good", no: "😣 A bit sore" },
  { id: "q_sleep", text: "How well did you sleep last night?",         yes: "😴 Good",  no: "🥱 Not great" },
  { id: "q_light", text: "How do your muscles feel from last practice?", yes: "💪 Fresh", no: "😮‍💨 Tired" },
  { id: "q_ready", text: "What's your energy like right now?",          yes: "⚡ Full",  no: "💤 Low" }
];

export const SEVERITY = [
  { level: 1, emoji: "🙂", label: "OK",                   color: "var(--mint)",  desc: "Moved normally. Both sides feel similar." },
  { level: 2, emoji: "😐", label: "Tired but controlled", color: "var(--gold)",  desc: "Tired or shaky, but still controlled. Better after 1–2 min rest." },
  { level: 3, emoji: "😟", label: "Changed movement",     color: "var(--coral)", desc: "Limp, lean, twist, shake, or less range. Tell coach or parent." },
  { level: 4, emoji: "🥺", label: "Pain / Stop",          color: "var(--stop)",  desc: "Pain, swelling, numbness or tingling. Stop now." }
];

export const LIGHTS = {
  green:    { emoji: "💚", color: "var(--mint)",  label: "Green Light — Full power!",  desc: "You're good to go! Full 3 rounds. Focus on quality." },
  yellow:   { emoji: "💛", color: "var(--gold)",  label: "Yellow Light — Train smart", desc: "Go easy today — 2 rounds, all quality. Smart skaters listen to their bodies. 💛" },
  red:      { emoji: "🔴", color: "var(--stop)",  label: "Red Light — Protect today",  desc: "Something feels off — 1 easy round. Resting smart is how champions come back stronger. 💙" },
  recovery: { emoji: "🧊", color: "var(--lilac)", label: "Recovery — Rest is training", desc: "Your body needs rest — and rest IS training. Tell a grown-up, then stretch and hydrate. 🧊" }
};

/* Body zones, positioned as %s over an SVG silhouette. group: front | back | shared */
const ZONES = [
  { n: "head",     label: "Head",        view: "both",  x: 38, y: 2,  w: 24, h: 11 },
  { n: "neck",     label: "Neck",        view: "both",  x: 42, y: 13, w: 16, h: 5 },
  { n: "shoulders",label: "Shoulders",   view: "both",  x: 20, y: 18, w: 60, h: 7 },
  { n: "arms",     label: "Arms",        view: "both",  x: 6,  y: 25, w: 20, h: 26 },
  { n: "arms2",    label: "Arms",        view: "both",  x: 74, y: 25, w: 20, h: 26, alias: "arms" },
  { n: "chest",    label: "Chest / Ribs",view: "front", x: 34, y: 25, w: 32, h: 10 },
  { n: "core",     label: "Abs / Core",  view: "front", x: 36, y: 35, w: 28, h: 10 },
  { n: "hip",      label: "Hip / Groin", view: "front", x: 36, y: 45, w: 28, h: 7 },
  { n: "quads",    label: "Quads",       view: "front", x: 30, y: 53, w: 40, h: 16 },
  { n: "shin",     label: "Shin",        view: "front", x: 32, y: 78, w: 36, h: 12 },
  { n: "ankleF",   label: "Ankle / Foot",view: "front", x: 34, y: 90, w: 32, h: 8, alias: "ankle" },
  { n: "upperback",label: "Upper Back",  view: "back",  x: 32, y: 25, w: 36, h: 11 },
  { n: "lowerback",label: "Lower Back",  view: "back",  x: 34, y: 37, w: 32, h: 8 },
  { n: "glutes",   label: "Glutes",      view: "back",  x: 32, y: 46, w: 36, h: 9 },
  { n: "hams",     label: "Hamstrings",  view: "back",  x: 30, y: 56, w: 40, h: 15 },
  { n: "calf",     label: "Calf",        view: "back",  x: 32, y: 78, w: 36, h: 12 },
  { n: "achilles", label: "Achilles",    view: "back",  x: 34, y: 90, w: 32, h: 8 },
  { n: "knees",    label: "Knees",       view: "both",  x: 32, y: 70, w: 36, h: 7 }
];

export function freshReadiness() {
  return { step: "questions", answers: {}, zoneSev: {}, pendingZone: null,
           view: "front", light: "green", overridden: false, done: false, resultSource: "readiness" };
}

/* Compute the light from the 3 non-pain answers (pain === yes path). */
export function lightFromAnswers(a) {
  const yes = ["q_sleep", "q_light", "q_ready"].filter(k => a[k] === "yes").length;
  return yes >= 3 ? "green" : yes === 2 ? "yellow" : yes === 1 ? "red" : "recovery";
}
export function lightFromZones(zoneSev) {
  const vals = Object.values(zoneSev || {});
  const worst = vals.length ? Math.max(...vals) : 0;
  return { worst, light: { 0: "green", 2: "yellow", 3: "red", 4: "recovery" }[worst] || (worst === 1 ? "green" : "green") };
}

/* ---- rendering ---- */
const GRAD = "linear-gradient(165deg,var(--rose-300) 0%,var(--rose-500) 60%,var(--rose-600) 100%)";

function yesNoBtn(on, kind) {
  const active = kind === "yes"
    ? "background:var(--mint);color:#fff;border-color:var(--mint);"
    : "background:var(--stop);color:#fff;border-color:var(--stop);";
  const idle = "background:var(--surface);color:var(--ink);border-color:var(--hairline);";
  return `min-height:48px;padding:0 16px;border-radius:var(--radius-pill);border:2px solid;font-family:inherit;font-weight:900;font-size:15px;cursor:pointer;${on ? active : idle}`;
}

function questionsStep(r, settings) {
  const last = loadLastCheck();
  const cards = RQS.map(q => {
    const val = r.answers[q.id];
    return `
    <div style="background:var(--bg);border:2px solid var(--hairline);border-radius:var(--radius-lg);padding:16px 18px;display:flex;flex-wrap:wrap;align-items:center;justify-content:space-between;gap:12px;">
      <div style="flex:1 1 220px;font-weight:700;font-size:16px;line-height:1.4;color:var(--ink);">${q.text}</div>
      <div style="display:flex;gap:8px;flex-shrink:0;">
        <button type="button" data-action="rdyAnswer" data-q="${q.id}" data-val="yes" style="${yesNoBtn(val === 'yes','yes')}">${q.yes}</button>
        <button type="button" data-action="rdyAnswer" data-q="${q.id}" data-val="no" style="${yesNoBtn(val === 'no','no')}">${q.no}</button>
      </div>
    </div>`;
  }).join("");
  return `
    <div style="display:flex;flex-wrap:wrap;flex:1;">
      <div style="width:320px;flex:1 1 280px;background:${GRAD};color:#fff;padding:26px 28px;display:flex;flex-direction:column;">
        <button type="button" data-action="goToday" style="width:42px;height:42px;border-radius:50%;background:rgba(255,255,255,0.22);border:none;color:#fff;font-size:18px;cursor:pointer;">←</button>
        <img src="assets/skate/illo-welcome.png" style="width:120px;height:120px;object-fit:contain;margin:20px 0 10px;" alt="" onerror="this.style.display='none'">
        <div style="font-family:var(--font-display);font-weight:600;font-size:30px;line-height:1.1;">Body Check ✓</div>
        <div style="font-size:15px;font-weight:700;opacity:0.9;margin-top:8px;line-height:1.4;">A few quick checks before we hit the ice, ${settings.athleteName}!</div>
      </div>
      <div style="flex:2 1 420px;padding:24px 26px;display:flex;flex-direction:column;gap:12px;">
        ${last ? `<button type="button" data-action="rdySameYesterday" style="display:flex;align-items:center;justify-content:center;gap:10px;background:var(--rose-50);border:3px solid var(--rose-300);border-radius:var(--radius-pill);padding:13px 20px;cursor:pointer;font-weight:900;font-size:16px;color:var(--rose-700);min-height:54px;">🔁 Feel the same as yesterday? One tap!</button>` : ""}
        ${cards}
        <div style="text-align:center;font-size:14px;font-weight:700;color:var(--ink-soft);padding-top:4px;">No wrong answers — Coach picks the right workout for today.</div>
        ${r.done ? resultCard(r) : ""}
      </div>
    </div>`;
}

function bodySilhouette() {
  // Simple gender-neutral skater silhouette (fills the 0..100 box vertically).
  return `
    <path d="M50 3 q7 0 7 7 q0 7 -7 8 q-7 -1 -7 -8 q0 -7 7 -7 Z" fill="var(--rose-200)"/>
    <rect x="46" y="15" width="8" height="6" rx="3" fill="var(--rose-200)"/>
    <path d="M30 24 q20 -6 40 0 l-3 26 q-2 4 -6 3 l-4 -22 h-8 l-4 22 q-4 1 -6 -3 Z" fill="var(--rose-200)"/>
    <rect x="14" y="25" width="10" height="26" rx="5" fill="var(--rose-200)"/>
    <rect x="76" y="25" width="10" height="26" rx="5" fill="var(--rose-200)"/>
    <path d="M34 50 h32 l-2 46 q-1 3 -6 3 l-4 -34 h-8 l-4 34 q-5 0 -6 -3 Z" fill="var(--rose-200)"/>`;
}

function zoneButtons(r) {
  return ZONES.filter(z => z.view === r.view || z.view === "both").map(z => {
    const key = z.alias || z.n;
    const sev = r.zoneSev[key];
    const sc = sev ? (SEVERITY.find(s => s.level === sev)?.color || "var(--gold)") : "transparent";
    const fill = sev ? sc : "rgba(194,86,113,0.10)";
    const border = sev ? sc : "var(--rose-300)";
    return `
      <button type="button" data-action="rdyPickZone" data-zone="${key}" aria-label="${z.label}"
        style="position:absolute;left:${z.x}%;top:${z.y}%;width:${z.w}%;height:${z.h}%;border-radius:14px;
               background:${fill};border:2px ${sev ? 'solid' : 'dashed'} ${border};cursor:pointer;padding:0;
               display:flex;align-items:center;justify-content:center;">
        ${sev ? `<span style="width:22px;height:22px;border-radius:50%;background:${sc};color:#fff;font-size:12px;font-weight:900;display:flex;align-items:center;justify-content:center;">${sev}</span>` : ""}
      </button>`;
  }).join("");
}

function bodyMap(r) {
  return `
    <div style="flex:1;min-width:240px;background:var(--bg);border:2px solid var(--hairline);border-radius:22px;padding:14px;display:flex;flex-direction:column;align-items:center;">
      <span style="background:var(--rose-500);color:#fff;font-size:12px;font-weight:900;letter-spacing:0.06em;padding:6px 16px;border-radius:var(--radius-pill);margin-bottom:10px;">${r.view === 'front' ? 'FRONT VIEW' : 'BACK VIEW'}</span>
      <div style="position:relative;width:200px;height:440px;">
        <svg viewBox="0 0 100 100" preserveAspectRatio="none" style="position:absolute;inset:0;width:100%;height:100%;">${bodySilhouette()}</svg>
        ${zoneButtons(r)}
      </div>
      <div style="display:flex;gap:8px;margin-top:12px;">
        <button type="button" data-action="rdyView" data-view="front" style="padding:8px 16px;border-radius:var(--radius-pill);border:2px solid var(--rose-300);cursor:pointer;font-weight:900;font-family:inherit;background:${r.view==='front'?'var(--rose-500)':'var(--surface)'};color:${r.view==='front'?'#fff':'var(--rose-600)'};">Front</button>
        <button type="button" data-action="rdyView" data-view="back" style="padding:8px 16px;border-radius:var(--radius-pill);border:2px solid var(--rose-300);cursor:pointer;font-weight:900;font-family:inherit;background:${r.view==='back'?'var(--rose-500)':'var(--surface)'};color:${r.view==='back'?'#fff':'var(--rose-600)'};">Back</button>
      </div>
    </div>`;
}

function severityPopup(r) {
  if (!r.pendingZone) return "";
  const z = ZONES.find(zz => (zz.alias || zz.n) === r.pendingZone);
  const opts = SEVERITY.map(s => `
    <button type="button" data-action="rdySetSev" data-zone="${r.pendingZone}" data-sev="${s.level}"
      style="display:flex;align-items:center;gap:12px;text-align:left;background:var(--surface);border:2px solid var(--hairline);border-radius:var(--radius-md);padding:12px 14px;cursor:pointer;font-family:inherit;">
      <span style="font-size:26px;">${s.emoji}</span>
      <span style="flex:1;"><span style="display:block;font-weight:900;color:${s.color};">${s.label}</span>
      <span style="font-size:13px;font-weight:700;color:var(--ink-soft);">${s.desc}</span></span>
    </button>`).join("");
  return `
    <div data-action="rdyClosePopup" style="position:absolute;inset:0;z-index:20;background:rgba(142,52,83,0.5);display:flex;align-items:center;justify-content:center;padding:24px;">
      <div data-stop="1" style="background:var(--surface);border-radius:var(--radius-xl);box-shadow:var(--shadow-float);max-width:440px;width:100%;padding:22px;">
        <div style="font-family:var(--font-display);font-weight:600;font-size:22px;color:var(--ink);margin-bottom:6px;">How does your <span style="color:var(--rose-600);">${z ? z.label : "body"}</span> feel?</div>
        <div style="font-size:13px;font-weight:700;color:var(--ink-soft);margin-bottom:14px;">Pick the one that matches best.</div>
        <div style="display:flex;flex-direction:column;gap:8px;">${opts}</div>
        <button type="button" data-action="rdySetSev" data-zone="${r.pendingZone}" data-sev="0" style="margin-top:12px;width:100%;background:none;border:none;color:var(--ink-soft);font-weight:800;cursor:pointer;font-family:inherit;">Actually, it's fine — clear this spot</button>
      </div>
    </div>`;
}

function resultCard(r) {
  const L = LIGHTS[r.light];
  const rounds = LIGHT_ROUNDS[r.light];
  const isStop = r.light === "recovery" && r.resultSource === "bodycheck" && (r.zoneSev && Math.max(0, ...Object.values(r.zoneSev)) === 4);
  const lightOpts = ["green", "yellow", "red", "recovery"].map(k => {
    const on = r.light === k;
    return `<button type="button" data-action="rdyOverride" data-light="${k}"
      style="display:flex;align-items:center;gap:6px;padding:8px 14px;border-radius:var(--radius-pill);border:2px solid ${on ? LIGHTS[k].color : 'var(--hairline)'};cursor:pointer;font-family:inherit;font-weight:800;font-size:13px;background:${on ? LIGHTS[k].color : 'var(--surface)'};color:${on ? '#fff' : 'var(--ink)'};">
      <span>${LIGHTS[k].emoji}</span>${LIGHTS[k].label.split(" — ")[0]}</button>`;
  }).join("");
  return `
    <div style="margin-top:26px;background:var(--surface);border-radius:var(--radius-xl);padding:22px;box-shadow:var(--shadow-lift);border-top:6px solid ${L.color};">
      <div style="display:flex;align-items:center;gap:16px;margin-bottom:14px;">
        <div style="font-size:52px;line-height:1;">${L.emoji}</div>
        <div><div style="font-family:var(--font-display);font-weight:600;font-size:22px;color:${L.color};">${L.label}</div>
        <div style="font-size:14px;font-weight:700;color:var(--ink-soft);margin-top:4px;line-height:1.45;">${L.desc}</div></div>
      </div>
      <div style="background:var(--surface-2);border-radius:var(--radius-lg);padding:14px 16px;margin-bottom:16px;">
        <div class="micro-label" style="margin-bottom:9px;">Coach suggests this light — a grown-up can change it${r.overridden ? " (changed)" : ""}:</div>
        <div style="display:flex;gap:8px;flex-wrap:wrap;">${lightOpts}</div>
      </div>
      ${isStop
        ? `<button type="button" data-action="goToday" style="width:100%;border:none;border-radius:var(--radius-pill);padding:18px;background:var(--stop);color:#fff;font-family:var(--font-display);font-weight:600;font-size:20px;cursor:pointer;box-shadow:0 5px 0 var(--stop-deep);">🛑 Stop — back to Today</button>`
        : `<button type="button" data-action="rdyStart" style="width:100%;border:none;border-radius:var(--radius-pill);padding:18px;background:var(--gold);color:var(--sun-ink);font-family:var(--font-display);font-weight:600;font-size:21px;cursor:pointer;box-shadow:0 5px 0 var(--sun-deep);">${rounds === 0 ? "🧊 Start Recovery" : `💪 Start Training! · ${rounds} round${rounds > 1 ? "s" : ""}`}</button>`}
    </div>`;
}

function bodyAreaStep(r) {
  const anyRated = Object.keys(r.zoneSev).length > 0;
  return `
    <div style="position:relative;flex:1;display:flex;flex-direction:column;padding:24px 26px;box-sizing:border-box;">
      <div style="display:flex;align-items:flex-start;gap:14px;margin-bottom:14px;">
        <button type="button" data-action="rdyBack" style="width:46px;height:46px;border-radius:50%;background:var(--bg);border:2px solid var(--hairline);font-size:20px;color:var(--rose-700);cursor:pointer;flex-shrink:0;">←</button>
        <div style="flex:1;text-align:center;">
          <div style="font-family:var(--font-display);font-weight:600;font-size:28px;color:var(--ink);line-height:1.1;">Where does it feel different?</div>
          <div style="font-size:14px;font-weight:700;color:var(--ink-soft);margin-top:6px;">Tap each spot that feels off — Coach will ask how it feels. Tap again to change it.</div>
        </div>
      </div>
      <div style="display:flex;gap:16px;flex-wrap:wrap;justify-content:center;">${bodyMap(r)}</div>
      ${anyRated ? resultCard(r) : `<div style="text-align:center;font-size:14px;font-weight:800;color:var(--ink-soft);margin-top:18px;">Tap a sore spot to rate it, or ${""}<button type="button" data-action="rdyAllFine" style="background:none;border:none;color:var(--rose-600);font-weight:900;text-decoration:underline;cursor:pointer;font-family:inherit;font-size:14px;">nothing hurts — I'm good</button>.</div>`}
      ${severityPopup(r)}
    </div>`;
}

export function renderReadiness(state) {
  const r = state.readiness;
  const settings = loadSettings();
  const body = r.step === "bodyArea" ? bodyAreaStep(r) : questionsStep(r, settings);
  return `
  <div style="width:100%;max-width:1242px;margin:0 auto;box-sizing:border-box;padding:18px;">
    <div style="display:flex;background:var(--surface);border-radius:30px;box-shadow:0 18px 44px rgba(142,52,83,0.16);overflow:hidden;min-height:640px;">
      ${body}
    </div>
  </div>`;
}

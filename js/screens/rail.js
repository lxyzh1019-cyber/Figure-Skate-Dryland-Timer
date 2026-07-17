/* ============================================================================
   screens/rail.js — left icon navigation rail (Today / Progress / Grown-up).
   Shared by every non-session screen. `active` highlights the current nav.
   ============================================================================ */
const ITEMS = [
  { nav: "today",    action: "goToday",    icon: "🏠", label: "Today" },
  { nav: "progress", action: "goProgress", icon: "📊", label: "Progress" },
  { nav: "grownup",  action: "goGrownup",  icon: "🧑", label: "Grown-up" }
];

/* Nav mode — set by main.js each render. On narrow the left rail collapses
   (returns "") and a fixed bottom-nav is appended instead. */
let _wide = true;
export function setNavWide(w) { _wide = w; }

export function rail(active) {
  if (!_wide) return "";              // narrow → bottom-nav is used instead
  const btns = ITEMS.map(it => {
    const on = it.nav === active;
    const iconWrap = `width:46px;height:46px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:22px;` +
      (on ? "background:#fff;border:2px solid var(--rose-500);box-shadow:0 4px 12px rgba(194,86,113,0.35);" : "background:var(--surface-2);");
    const labelColor = on ? "var(--rose-700)" : "var(--ink-soft)";
    return `
      <button type="button" data-action="${it.action}" aria-label="${it.label}" style="background:none;border:none;cursor:pointer;display:flex;flex-direction:column;align-items:center;gap:5px;font-family:inherit;">
        <div style="${iconWrap}">${it.icon}</div>
        <span style="font-size:11px;font-weight:900;color:${labelColor};">${it.label}</span>
      </button>`;
  }).join("");
  return `
    <div style="width:96px;flex-shrink:0;display:flex;flex-direction:column;align-items:center;padding:22px 0;border-right:2px solid var(--hairline);">
      <div style="flex:1;display:flex;flex-direction:column;justify-content:center;gap:26px;align-items:center;">${btns}</div>
    </div>`;
}

/* Bottom nav for narrow/portrait — same actions, horizontal. */
export function bottomNav(active) {
  const btns = ITEMS.map(it => {
    const on = it.nav === active;
    return `
      <button type="button" data-action="${it.action}" style="flex:1;background:none;border:none;cursor:pointer;display:flex;flex-direction:column;align-items:center;gap:3px;padding:8px 0;font-family:inherit;">
        <span style="font-size:22px;opacity:${on ? 1 : 0.55};">${it.icon}</span>
        <span style="font-size:11px;font-weight:900;color:${on ? 'var(--rose-700)' : 'var(--ink-soft)'};">${it.label}</span>
      </button>`;
  }).join("");
  return `
    <nav style="position:fixed;left:0;right:0;bottom:0;display:flex;background:var(--surface);border-top:2px solid var(--hairline);
         box-shadow:0 -6px 20px rgba(142,52,83,0.08);z-index:30;">${btns}</nav>`;
}

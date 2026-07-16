/* ============================================================================
   screens/prizedraw.js — level-up reward: pick one of three sealed cards.
   The revealed prize is persisted to the journey (skate_journey_v1.prizesWon)
   and shown in the Progress wallet. Driven by state.prizeDraw.
   ============================================================================ */
import { loadSettings } from "../store.js";
import { rail } from "./rail.js";

/* Pick 3 distinct prizes from the (editable) prize pool. */
export function freshPrizeDraw() {
  const pool = [...(loadSettings().prizePool || [])];
  for (let i = pool.length - 1; i > 0; i--) { const j = (Math.random() * (i + 1)) | 0; [pool[i], pool[j]] = [pool[j], pool[i]]; }
  return { options: pool.slice(0, 3), revealed: null };
}

function sealedCard(i) {
  return `
    <button type="button" data-action="prizeReveal" data-i="${i}" aria-label="Sealed prize ${i + 1}"
      style="flex:1;min-width:150px;aspect-ratio:3/4;border-radius:var(--radius-lg);border:none;cursor:pointer;
             background:linear-gradient(160deg,var(--rose-400),var(--rose-600));color:#fff;display:flex;flex-direction:column;
             align-items:center;justify-content:center;gap:10px;box-shadow:var(--shadow-float);font-family:inherit;
             transition:transform .15s var(--ease-out);" onmouseover="this.style.transform='translateY(-4px)'" onmouseout="this.style.transform=''">
      <span style="font-size:52px;">🎁</span>
      <span style="font-weight:900;font-size:15px;letter-spacing:0.04em;">Tap to open</span>
    </button>`;
}

export function renderPrizeDraw(state) {
  const pd = state.prizeDraw;
  const revealed = pd.revealed != null;
  return `
  <div style="width:100%;max-width:1242px;margin:0 auto;box-sizing:border-box;padding:18px;">
    <div style="display:flex;background:var(--rose-50);border-radius:30px;box-shadow:0 18px 44px rgba(142,52,83,0.16);overflow:hidden;min-height:560px;">
      ${rail("progress")}
      <div style="flex:1;min-width:280px;display:flex;flex-direction:column;align-items:center;justify-content:center;text-align:center;gap:20px;padding:40px;">
        <div style="font-family:var(--font-script);font-weight:700;font-size:40px;color:var(--rose-700);line-height:1;">You leveled up! 🎉</div>
        <div style="font-size:16px;font-weight:700;color:var(--ink-soft);max-width:440px;">${revealed ? "Here's your reward — enjoy it, champion!" : "Pick one sealed card to reveal your prize."}</div>
        ${revealed
          ? `<div style="background:var(--surface);border:3px solid var(--gold);border-radius:var(--radius-xl);padding:28px 34px;box-shadow:var(--shadow-float);display:flex;flex-direction:column;align-items:center;gap:10px;max-width:420px;">
               <span style="font-size:56px;">🏆</span>
               <div style="font-family:var(--font-display);font-weight:600;font-size:24px;color:var(--rose-700);">${pd.options[pd.revealed]}</div>
               <div style="font-size:13px;font-weight:800;color:var(--ink-soft);">Saved to your prizes on Progress.</div>
             </div>
             <div style="display:flex;gap:12px;flex-wrap:wrap;justify-content:center;">
               <button type="button" data-action="goProgress" class="btn btn-primary" style="padding:14px 26px;font-size:16px;">See my prizes 🎁</button>
               <button type="button" data-action="goToday" class="btn btn-secondary" style="padding:14px 26px;font-size:16px;">Back to Today</button>
             </div>`
          : `<div style="display:flex;gap:16px;flex-wrap:wrap;justify-content:center;max-width:560px;width:100%;">
               ${pd.options.map((_, i) => sealedCard(i)).join("")}
             </div>`}
      </div>
    </div>
  </div>`;
}

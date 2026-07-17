/* ============================================================================
   screens/progress.js — Progress screen: streak hero + this-week chart, prize
   wallet (redeemable), milestones, rank/journey, and the training log — all
   computed from real localStorage history (skate_sessions_v2 + skate_journey_v1).
   ============================================================================ */
import { DAYS, DAY_KEYS, DAY_SHORT } from "../data.js";
import {
  loadSessions, thisWeekSessions, currentStreak, longestStreak,
  journeyState, mondayOfThisWeek, sessionDay, localDateKey
} from "../store.js";
import { rail } from "./rail.js";

function weekBars() {
  // Bucket this week's minutes by actual calendar day (Mon..Sun), not workout name.
  const monday = mondayOfThisWeek();
  const byDate = {};
  thisWeekSessions().forEach(s => { const k = sessionDay(s); byDate[k] = (byDate[k] || 0) + (s.durationSecs || 0) / 60; });
  const labels = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
  const cells = labels.map((short, i) => {
    const d = new Date(monday); d.setDate(monday.getDate() + i);
    const mins = byDate[localDateKey(d)] || 0;
    return { short, mins, done: mins > 0 };
  });
  const maxMin = Math.max(30, ...cells.map(c => c.mins));
  return cells.map(c => ({ short: c.short, done: c.done, h: Math.max(6, Math.round((c.mins / maxMin) * 100)) }));
}

function milestones() {
  const all = loadSessions();
  const total = all.length;
  const j = journeyState();
  const list = [
    { icon: "🎬", label: "First session", done: total >= 1 },
    { icon: "🖐️", label: "5 sessions", done: total >= 5 },
    { icon: "🔟", label: "10 sessions", done: total >= 10 },
    { icon: "🔥", label: "7-day streak", done: longestStreak() >= 7 },
    { icon: "⭐", label: "Reach LVL 5", done: j.level >= 5 },
    { icon: "🏆", label: "Rank up ×3", done: (j.prizesWon.length + j.pendingDraws) >= 3 }
  ];
  return list;
}

function logRows() {
  const all = [...loadSessions()].reverse().slice(0, 7);
  const lightChip = { green: ["💚", "var(--mint)"], yellow: ["💛", "var(--gold)"], red: ["🔴", "var(--stop)"], recovery: ["🧊", "var(--lilac)"] };
  const moodEmoji = { strong: "💪", good: "😊", tough: "😮‍💨" };
  return all.map(s => {
    const day = DAYS[s.dayKey] || { title: s.dayKey };
    const [le, lc] = lightChip[s.light] || ["⚪", "var(--ink-soft)"];
    const d = s.isoDate ? new Date(s.isoDate) : null;
    const date = d ? d.toLocaleDateString(undefined, { month: "short", day: "numeric" }) : "";
    const mins = Math.max(1, Math.round((s.durationSecs || 0) / 60));
    return { title: day.title, date, mins, lightEmoji: le, lightColor: lc, mood: moodEmoji[s.mood] || "", endedEarly: !!s.endedEarly };
  });
}

export function renderProgress(state) {
  const streak = currentStreak();
  const week = weekBars();
  const weekCount = thisWeekSessions().length;
  const j = journeyState();
  const totalMin = thisWeekSessions().reduce((a, s) => a + (s.durationSecs || 0) / 60, 0);
  const avgMin = weekCount ? Math.round(totalMin / weekCount) : 0;
  const rows = logRows();

  const prizes = j.prizesWon.length
    ? j.prizesWon.map((pz, i) => `
      <div style="display:flex;align-items:center;gap:10px;background:var(--surface);border:2px solid var(--gold);border-radius:var(--radius-md);padding:10px 12px;${pz.redeemed ? "opacity:0.6;" : ""}">
        <span style="font-size:22px;flex-shrink:0;">🎁</span>
        <span style="flex:1;font-size:14px;font-weight:800;color:var(--ink);line-height:1.2;">${pz.label}</span>
        <button type="button" data-action="prizeRedeem" data-i="${i}" ${pz.redeemed ? "disabled" : ""}
          style="border:none;border-radius:var(--radius-pill);padding:7px 14px;font-weight:900;font-size:12px;cursor:${pz.redeemed ? "default" : "pointer"};font-family:inherit;background:${pz.redeemed ? "var(--surface-2)" : "var(--rose-500)"};color:${pz.redeemed ? "var(--ink-soft)" : "#fff"};">${pz.redeemed ? "Redeemed ✓" : "Redeem"}</button>
      </div>`).join("")
    : `<div style="font-size:13px;font-weight:700;color:var(--sun-ink);line-height:1.4;">Level up to earn a prize! Pick a sealed card each time you rank up. 🌟</div>`;

  return `
  <div style="width:100%;max-width:1242px;margin:0 auto;box-sizing:border-box;padding:18px;">
    <div style="display:flex;background:var(--surface);border-radius:30px;box-shadow:0 18px 44px rgba(142,52,83,0.16);overflow:hidden;min-height:760px;">
      ${rail("progress")}
      <div style="flex:1;min-width:280px;padding:24px 26px;overflow-y:auto;display:flex;flex-direction:column;gap:16px;">
        <div style="font-family:var(--font-display);font-weight:600;font-size:32px;color:var(--ink);">Your Progress 🏅</div>

        <!-- streak + week chart + prizes -->
        <div style="display:flex;gap:14px;flex-wrap:wrap;">
          <div style="flex:2;min-width:280px;background:var(--surface);border:1.5px solid var(--hairline);border-radius:var(--radius-xl);padding:18px;box-shadow:var(--shadow-soft);display:flex;align-items:center;gap:18px;">
            <div style="display:flex;flex-direction:column;align-items:center;background:var(--gold-soft);border-radius:20px;padding:12px 16px;flex-shrink:0;">
              <span style="font-size:30px;">🔥</span>
              <span style="font-family:var(--font-display);font-weight:600;font-size:28px;color:var(--coral-deep,#D99A2E);line-height:1;">${streak}</span>
              <span style="font-size:11px;font-weight:900;color:var(--sun-ink);letter-spacing:0.03em;">DAY STREAK</span>
            </div>
            <div style="flex:1;min-width:0;">
              <div style="display:flex;align-items:baseline;justify-content:space-between;margin-bottom:8px;">
                <span class="micro-label">This week</span>
                <span style="font-size:13px;font-weight:800;color:var(--ink-soft);">${weekCount} session${weekCount === 1 ? "" : "s"}${avgMin ? ` · ${avgMin} min avg` : ""}</span>
              </div>
              <div style="display:flex;gap:6px;align-items:flex-end;height:64px;">
                ${week.map(b => `<div style="flex:1;display:flex;flex-direction:column;align-items:center;gap:4px;height:100%;justify-content:flex-end;">
                  <div style="width:100%;height:${b.h}%;border-radius:6px 6px 3px 3px;background:${b.done ? "var(--rose-500)" : "var(--surface-2)"};"></div>
                  <span style="font-size:11px;font-weight:900;color:var(--ink-soft);text-transform:uppercase;">${b.short}</span></div>`).join("")}
              </div>
            </div>
          </div>
          <div style="flex:1;min-width:220px;background:var(--gold-soft);border:2px solid var(--gold);border-radius:var(--radius-xl);padding:16px 18px;box-shadow:var(--shadow-soft);display:flex;flex-direction:column;gap:8px;">
            <div class="micro-label" style="color:var(--sun-ink);">My prizes 🎁</div>
            ${prizes}
            <button type="button" data-action="openPrizeDraw" ${j.pendingDraws > 0 ? "" : "disabled"} style="min-height:40px;margin-top:2px;background:${j.pendingDraws > 0 ? "var(--gold)" : "var(--surface-2)"};color:${j.pendingDraws > 0 ? "var(--sun-ink)" : "var(--ink-soft)"};border:none;border-radius:var(--radius-pill);font-weight:900;font-size:13px;cursor:${j.pendingDraws > 0 ? "pointer" : "default"};font-family:inherit;">${j.pendingDraws > 0 ? "🎉 Open your prize draw" : "Rank up to earn a draw"}</button>
          </div>
        </div>

        <!-- rank / journey -->
        <div style="background:linear-gradient(160deg,var(--rose-500),var(--rose-700));color:#fff;border-radius:var(--radius-xl);padding:18px 20px;box-shadow:var(--shadow-soft);">
          <div style="display:flex;align-items:baseline;justify-content:space-between;flex-wrap:wrap;gap:8px;">
            <div style="font-family:var(--font-display);font-weight:600;font-size:22px;">LVL ${j.level} · ${j.rankName}</div>
            <div style="font-size:13px;font-weight:800;opacity:0.9;">${j.xp} XP total</div>
          </div>
          <div style="height:9px;background:rgba(255,255,255,0.28);border-radius:9px;overflow:hidden;margin:10px 0 6px;">
            <div style="width:${Math.max(4, j.levelPct)}%;height:100%;background:var(--gold);border-radius:9px;"></div>
          </div>
          <div style="font-size:13px;font-weight:800;opacity:0.95;">${j.xpToNext} XP to LVL ${j.level + 1}${j.nextRankName !== "Max rank" ? ` · next rank: ${j.nextRankName}` : ""}</div>
        </div>

        <!-- milestones -->
        <div style="background:var(--surface);border:1.5px solid var(--hairline);border-radius:var(--radius-xl);padding:18px;box-shadow:var(--shadow-soft);">
          <div class="micro-label" style="margin-bottom:14px;">Milestones</div>
          <div style="display:flex;flex-wrap:wrap;gap:8px;">
            ${milestones().map(m => `<div style="display:flex;align-items:center;gap:8px;border-radius:var(--radius-pill);padding:8px 14px;font-weight:800;font-size:13px;${m.done ? "background:var(--rose-100);color:var(--rose-700);border:2px solid var(--rose-300);" : "background:var(--bg);color:var(--ink-faint);border:2px dashed var(--border-strong);"}"><span>${m.done ? m.icon : "🔒"}</span>${m.label}</div>`).join("")}
          </div>
        </div>

        <!-- training log -->
        <div style="background:var(--surface);border:1.5px solid var(--hairline);border-radius:var(--radius-xl);padding:18px;box-shadow:var(--shadow-soft);">
          <div class="micro-label" style="margin-bottom:12px;">Recent sessions</div>
          ${rows.length ? rows.map(r => `
            <div style="display:flex;align-items:center;gap:12px;padding:10px 0;border-bottom:1px solid var(--hairline);">
              <span style="width:34px;height:34px;border-radius:50%;background:var(--surface-2);display:flex;align-items:center;justify-content:center;font-size:16px;flex-shrink:0;">${r.lightEmoji}</span>
              <div style="flex:1;min-width:0;">
                <div style="font-weight:800;font-size:15px;color:var(--ink);">${r.title}${r.endedEarly ? " · ended early" : ""}</div>
                <div style="font-size:12px;font-weight:700;color:var(--ink-soft);">${r.date} · ${r.mins} min</div>
              </div>
              ${r.mood ? `<span style="font-size:20px;">${r.mood}</span>` : ""}
            </div>`).join("")
          : `<div style="font-size:14px;font-weight:700;color:var(--ink-soft);">No sessions yet — your training log fills in as you skate! ⛸️</div>`}
        </div>
      </div>
    </div>
  </div>`;
}

/* ============================================================================
   screens/quizdeck.js — full-screen quiz deck generated from the plan's moves.
   Each question asks which skating skill a move builds (from ex.swimTransfer),
   with distractors drawn from other moves. Results log to skate_quiz_v1 /
   skate_events_v1. Driven by state.quiz.
   ============================================================================ */
import { DAYS } from "../data.js";
import { recordQuizResult } from "../store.js";

function shuffle(a) { a = [...a]; for (let i = a.length - 1; i > 0; i--) { const j = (Math.random() * (i + 1)) | 0; [a[i], a[j]] = [a[j], a[i]]; } return a; }

function allMoves() {
  const seen = new Map();
  Object.values(DAYS).forEach(d => {
    Object.values(d.blocks || {}).forEach(arr => (arr || []).forEach(ex => { if (ex.name && !seen.has(ex.name)) seen.set(ex.name, ex); }));
    (d.recoveryHolds || []).forEach(ex => { if (ex.name && !seen.has(ex.name)) seen.set(ex.name, ex); });
  });
  return [...seen.values()];
}

export function freshQuiz(n = 8) {
  const moves = allMoves().filter(m => m.swimTransfer);
  const skills = [...new Set(moves.map(m => m.swimTransfer))];
  const items = shuffle(moves).slice(0, n).map(m => {
    const distractors = shuffle(skills.filter(s => s !== m.swimTransfer)).slice(0, 2);
    const options = shuffle([m.swimTransfer, ...distractors]);
    return {
      move: m.name,
      question: `What does “${m.name}” help you build?`,
      options,
      correct: options.indexOf(m.swimTransfer),
      why: m.cue || m.swimTransfer
    };
  });
  return { items, idx: 0, score: 0, picked: null, answered: false, logged: false };
}

function optionBtn(q, i, quiz) {
  let bg = "var(--surface)", bd = "var(--hairline)", fg = "var(--ink)";
  if (quiz.answered) {
    if (i === q.correct) { bg = "var(--mint)"; bd = "var(--mint)"; fg = "#fff"; }
    else if (i === quiz.picked) { bg = "var(--stop-wash)"; bd = "var(--stop)"; fg = "var(--stop-ink)"; }
  }
  return `
    <button type="button" data-action="quizPick" data-i="${i}" ${quiz.answered ? "disabled" : ""}
      style="display:flex;align-items:center;gap:12px;text-align:left;background:${bg};border:2px solid ${bd};color:${fg};
             border-radius:var(--radius-md);padding:14px 16px;cursor:${quiz.answered ? "default" : "pointer"};font-family:inherit;font-weight:700;font-size:16px;">
      <span style="width:28px;height:28px;border-radius:50%;background:var(--surface-2);display:inline-flex;align-items:center;justify-content:center;font-weight:900;flex-shrink:0;">${String.fromCharCode(65 + i)}</span>
      <span style="flex:1;">${q.options[i]}</span>
      ${quiz.answered && i === q.correct ? "✓" : (quiz.answered && i === quiz.picked ? "✗" : "")}
    </button>`;
}

export function renderQuizDeck(state) {
  const quiz = state.quiz;
  if (!quiz || !quiz.items.length) return "";
  const done = quiz.idx >= quiz.items.length;

  if (done) {
    const pct = Math.round((quiz.score / quiz.items.length) * 100);
    const cheer = pct >= 80 ? "Amazing! You really know your moves! 🌟" : pct >= 50 ? "Nice work — you're learning fast! 💪" : "Good try — every round teaches you more! 💛";
    return `
    <div style="width:100%;max-width:1242px;margin:0 auto;box-sizing:border-box;padding:18px;">
      <div style="background:var(--rose-50);border-radius:30px;box-shadow:0 18px 44px rgba(142,52,83,0.16);padding:40px;display:flex;flex-direction:column;align-items:center;text-align:center;gap:16px;min-height:520px;justify-content:center;">
        <img src="assets/skate/illo-great-job.png" alt="" style="height:150px;object-fit:contain;" onerror="this.style.display='none'">
        <div style="font-family:var(--font-script);font-weight:700;font-size:40px;color:var(--rose-700);">Quiz Complete!</div>
        <div style="font-family:var(--font-display);font-weight:600;font-size:30px;color:var(--sun-ink);">${quiz.score} / ${quiz.items.length} correct</div>
        <div style="font-size:16px;font-weight:700;color:var(--ink-soft);max-width:400px;">${cheer}</div>
        <div style="display:flex;gap:12px;flex-wrap:wrap;justify-content:center;">
          <button type="button" data-action="startQuizDeck" class="btn btn-primary" style="padding:14px 26px;font-size:16px;">Play again 🔁</button>
          <button type="button" data-action="goToday" class="btn btn-secondary" style="padding:14px 26px;font-size:16px;">Back to Today</button>
        </div>
      </div>
    </div>`;
  }

  const q = quiz.items[quiz.idx];
  return `
  <div style="width:100%;max-width:1242px;margin:0 auto;box-sizing:border-box;padding:18px;">
    <div style="background:var(--surface);border-radius:30px;box-shadow:0 18px 44px rgba(142,52,83,0.16);padding:30px;min-height:520px;display:flex;flex-direction:column;">
      <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:18px;">
        <span class="micro-label">🧠 Quiz Deck · ${quiz.idx + 1} of ${quiz.items.length}</span>
        <button type="button" data-action="exitQuizDeck" style="background:none;border:none;color:var(--ink-soft);font-weight:800;font-size:13px;cursor:pointer;text-decoration:underline;">Exit</button>
      </div>
      <div style="height:8px;background:var(--surface-2);border-radius:8px;overflow:hidden;margin-bottom:24px;">
        <div style="width:${Math.round((quiz.idx / quiz.items.length) * 100)}%;height:100%;background:var(--lilac);border-radius:8px;transition:width .3s;"></div>
      </div>
      <div style="font-family:var(--font-display);font-weight:600;font-size:24px;color:var(--ink);line-height:1.25;margin-bottom:20px;max-width:640px;">${q.question}</div>
      <div style="display:flex;flex-direction:column;gap:10px;max-width:640px;">
        ${q.options.map((_, i) => optionBtn(q, i, quiz)).join("")}
      </div>
      ${quiz.answered ? `
        <div style="margin-top:20px;background:var(--rose-50);border-radius:var(--radius-md);padding:14px 16px;max-width:640px;">
          <div style="font-weight:900;font-size:15px;color:${quiz.picked === q.correct ? "var(--rose-600)" : "var(--stop-ink)"};">${quiz.picked === q.correct ? "✓ Correct!" : "Not quite —"} ${q.options[q.correct]}</div>
          <div style="font-size:14px;font-weight:700;color:var(--ink-soft);margin-top:4px;line-height:1.4;">Coach cue: ${q.why}</div>
        </div>
        <button type="button" data-action="quizNext" class="btn btn-primary" style="margin-top:18px;align-self:flex-start;padding:14px 30px;font-size:16px;">${quiz.idx + 1 >= quiz.items.length ? "See results →" : "Next question →"}</button>
      ` : ""}
    </div>
  </div>`;
}

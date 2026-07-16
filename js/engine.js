/* ============================================================================
   engine.js — async session engine (ported behaviour from the original app).
   Builds the session plan from the day's blocks × traffic-light rounds, then
   runs each phase (timed countdown / rep tap / rests / round breaks / side
   switches) with coach voice + beeps, pause/skip/stop/end, and finalize that
   writes skate_sessions_v2 + awards XP. The engine owns timing/logic only;
   screens/session.js renders from engine.snapshot() and calls the controls.
   ============================================================================ */
import { DAYS, LIGHT_ROUNDS, countMoves, DAY_MANTRA, INTENT_WORDS, adjWork } from "./data.js";
import { saveSession, awardSessionXp, patchLastSession } from "./store.js";
import { speakAndWait, tickBeep, finishBeep, cancelSpeech, primeAudio } from "./audio.js";

export const BLOCK_LABEL = {
  warmup: "Warm-up", coordination: "Coordination", main: "Main Set",
  finisher: "Power / Finisher", swimskill: "Skating Skill", recovery: "Recovery"
};
const BLOCK_ORDER = ["warmup", "coordination", "main", "finisher", "swimskill"];

export class Session {
  constructor({ dayKey, light, settings, onChange, onTick, onComplete }) {
    this.dayKey = dayKey;
    this.light = light;
    this.settings = settings;
    this.onChange = onChange || (() => {});
    this.onTick = onTick || (() => {});
    this.onComplete = onComplete || (() => {});
    this.day = DAYS[dayKey];
    this.mainRounds = Math.max(1, LIGHT_ROUNDS[light] || 1);
    this.startTs = Date.now();

    this.paused = false;
    this.ended = false;
    this.stopOverlay = false;
    this.painFlag = false;
    this.skipped = [];
    this.remaining = 0;
    this.total = 0;
    this.idx = 0;

    this.plan = this._buildPlan();
    this.totalPhases = this.plan.length || 1;
  }

  /* ---- plan ---- */
  _pushExercise(plan, ex, block, round, rounds) {
    if (ex.eachSide) {
      plan.push({ kind: "exercise", ex, block, round, rounds, side: "Left" });
      plan.push({ kind: "sideSwitch", ex });
      plan.push({ kind: "exercise", ex, block, round, rounds, side: "Right" });
    } else {
      plan.push({ kind: "exercise", ex, block, round, rounds });
    }
  }
  _buildPlan() {
    const d = this.day, plan = [];
    const R = this.settings;
    if (d.spa || this.light === "recovery") {
      (d.recoveryHolds || []).forEach((ex, i, arr) => {
        this._pushExercise(plan, ex, "recovery", 1, 1);
        if (i < arr.length - 1) plan.push({ kind: "exRest", secs: R.exerciseRestSeconds, next: arr[i + 1].name });
      });
      return plan;
    }
    const blocks = d.blocks || {};
    BLOCK_ORDER.forEach(bk => {
      const arr = blocks[bk] || [];
      if (!arr.length) return;
      const rounds = bk === "main" ? this.mainRounds : 1;
      for (let r = 1; r <= rounds; r++) {
        arr.forEach((ex, i) => {
          this._pushExercise(plan, ex, bk, r, rounds);
          if (i < arr.length - 1) plan.push({ kind: "exRest", secs: R.exerciseRestSeconds, next: arr[i + 1].name });
        });
        if (bk === "main" && r < rounds) plan.push({ kind: "roundRest", round: r, rounds, secs: R.roundRestSeconds });
      }
      plan.push({ kind: "sectionRest", block: bk, secs: R.sectionRestSeconds });
    });
    while (plan.length && plan[plan.length - 1].kind === "sectionRest") plan.pop();
    return plan;
  }

  /* ---- lifecycle ---- */
  async run() {
    primeAudio();
    for (this.idx = 0; this.idx < this.plan.length && !this.ended;) {
      const ph = this.plan[this.idx];
      this.phase = ph;
      this.onChange();
      let res = "done";
      if (ph.kind === "exercise") {
        await speakAndWait(this._announce(ph));
        if (this.ended) break;
        const timed = ph.ex.driver === "time" || ph.ex.work != null;
        res = timed ? await this._countdown(adjWork(ph.ex.work || 30)) : await this._waitTap();
      } else if (ph.kind === "sideSwitch") {
        this.onChange(); await speakAndWait("Switch sides."); res = "done";
      } else if (ph.kind === "roundRest") {
        this.intentWord = INTENT_WORDS[(ph.round - 1) % INTENT_WORDS.length];
        await speakAndWait("Nice round. Quick breather.");
        res = await this._countdown(ph.secs || 15);
      } else { // exRest | sectionRest
        res = await this._countdown(ph.secs || 8);
      }

      if (this.ended) break;
      if (res === "stop") {
        const decision = await this._handleStop();
        if (decision === "end") { this._finish(false); return; }
        continue; // resume → redo current phase
      }
      if (res === "skip" && ph.kind === "exercise") this.skipped.push(ph.ex.name);
      this.idx++;
    }
    if (!this.ended) this._finish(true);
  }

  _announce(ph) {
    const parts = [];
    if (ph.side) parts.push(ph.side + " side.");
    if (ph.ex.reset) parts.push(ph.ex.reset);
    else parts.push(ph.ex.name);
    if (ph.ex.cue) parts.push(ph.ex.cue);
    return parts.join(" ");
  }

  /* One handle resolves the current step so skip/stop/tap are immediate. */
  _finishStep(result) {
    clearInterval(this._iv);
    const r = this._resolveStep; this._resolveStep = null;
    if (r) r(result);
  }
  _countdown(secs) {
    return new Promise((resolve) => {
      this.total = secs; this.remaining = secs;
      this._resolveStep = resolve;
      this.onTick(this.remaining, this.total);
      clearInterval(this._iv);
      this._iv = setInterval(() => {
        if (this.paused) return;
        this.remaining--;
        if (this.remaining > 0 && this.remaining <= 3) tickBeep();
        this.onTick(this.remaining, this.total);
        if (this.remaining <= 0) { finishBeep(); this._finishStep("done"); }
      }, 1000);
    });
  }
  _waitTap() { return new Promise((resolve) => { this._resolveStep = resolve; }); }
  _handleStop() {
    this.stopOverlay = true; this.onChange();
    return new Promise((resolve) => { this._stopRes = resolve; });
  }

  /* ---- controls (called from screen data-action handlers) ---- */
  pause()  { this.paused = true; this.onChange(); }
  resume() { this.paused = false; this.onChange(); }
  togglePause() { this.paused ? this.resume() : this.pause(); }
  skip()    { if (this._resolveStep) this._finishStep("skip"); }
  tapDone() { if (this._resolveStep) this._finishStep("done"); }
  requestStop() { if (this._resolveStep) this._finishStep("stop"); }
  resumeFromStop() { this.stopOverlay = false; const r = this._stopRes; this._stopRes = null; if (r) r("resume"); this.onChange(); }
  endFromStop()    { this.stopOverlay = false; this.painFlag = true; const r = this._stopRes; this._stopRes = null; if (r) r("end"); }
  endEarly() { this.ended = true; clearInterval(this._iv); cancelSpeech(); this._finish(false); this._finishStep("end"); }

  _finish(completedFully) {
    if (this._finished) return;
    this._finished = true;
    this.ended = true;
    clearInterval(this._iv);
    cancelSpeech();
    const durationSecs = Math.round((Date.now() - this.startTs) / 1000);
    const entry = {
      dayKey: this.dayKey, isoDate: new Date().toISOString(), durationSecs,
      light: this.light, completedFully, endedEarly: !completedFully,
      pain: !!this.painFlag, moves: countMoves(this.day), skipped: this.skipped.length
    };
    let xp = null;
    if (!this.settings.testMode) {
      saveSession(entry);
      xp = awardSessionXp(entry);
      entry.xpEarned = xp.gained;
      patchLastSession({ xpEarned: xp.gained });
      // Best-effort cloud mirror (never blocks; offline-safe).
      import("./firebase.js").then(m => m.fsAddSession && m.fsAddSession(entry)).catch(() => {});
    }
    this.complete = { entry, xp, mantra: this.day.mantra || DAY_MANTRA[this.dayKey], completedFully };
    this.onChange();
    this.onComplete(this.complete);
  }

  /* ---- snapshot for the renderer ---- */
  snapshot() {
    const ph = this.phase || {};
    return {
      dayKey: this.dayKey, dayTitle: this.day.title, light: this.light,
      kind: ph.kind, ex: ph.ex || null, side: ph.side || null,
      block: ph.block || null, blockLabel: BLOCK_LABEL[ph.block] || "",
      round: ph.round || null, rounds: ph.rounds || null,
      next: ph.next || null, intentWord: this.intentWord || null,
      remaining: this.remaining, total: this.total,
      paused: this.paused, stopOverlay: this.stopOverlay,
      ended: this.ended, complete: this.complete || null,
      progressPct: Math.min(100, Math.round((this.idx / this.totalPhases) * 100)),
      elapsedSecs: Math.round((Date.now() - this.startTs) / 1000)
    };
  }
}

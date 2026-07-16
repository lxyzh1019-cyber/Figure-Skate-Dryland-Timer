# ⛸ Jenn · Figure-Skate Dryland Timer (V2)

A no-build web app for figure-skating dryland training, redesigned in the
**"Skate with Grace"** design system (rose/blush palette, Quicksand + Dancing
Script, soft pink UI) and loaded with the **Jenn Skating Dryland 2026.2 (v10)**
plan. Built on the Swimming-Dryland-Timer engine (full feature parity).

## Plan content (2026.2)

6 training days + Sunday recovery, each run as 5 blocks:

**① Warm-up → ② Coordination → ③ Main (traffic-light rounds) → ④ Power/Finisher → ⑤ Skating-Skill (Axis Micro + Spin Board).**

- Mon — Single-Leg + Axis · Tue — Spin + Push/Carry · Wed — POWER A (Jump+Pull+Drive)
- Thu — Single-Leg + Core · Fri — Spin + Push/Carry · Sat — POWER B (Jump+Pull+Drive)
- Sun — Foam Roll + Review (recovery only)

Quality gates baked into the engine: valgus gate (left knee), jump-fatigue
awareness, spin-dizziness stop, never-to-failure pull series, bilateral ankle
gate (right deeper), progressive overload (paused until Week 3).

## Screens & features

- **Today** — greeting + mascot, week strip, streak/level stat chips, Quiz Deck
  launch, Skating-Journey hero (XP/level/rank), day-detail pane + Start CTA.
- **Body Check** (readiness) — 4 questions → interactive body map → severity →
  traffic-light (green 3 / yellow 2 / red 1 / recovery 0 rounds), grown-up override.
- **Session** — timer ring, coach voice cues, timed + rep-tap exercises, rests,
  round breaks, side switches, STOP overlay, Session Complete (mantra, XP, mood).
- **Progress** — streak hero + week chart, prize wallet (redeem), milestones,
  rank card, training log.
- **Prize Draw** — pick 1 of 3 sealed cards on level-up (prizes persisted).
- **Quiz Deck** — 8 questions generated from the plan's moves.
- **Grown-up Zone** — Overview · Analytics (ACWR + CSV) · Library (how-to +
  YouTube) · Settings (name, voice, rests, prize pool, practice) · Coaching.

## Project layout (module split, no build step)

```
index.html            # thin shell: loads css/ + js/main.js (module)
index.legacy.html     # the previous single-file app, kept for reference
css/tokens/*.css       # Skate with Grace design tokens (colors/typography/surfaces)
css/fonts.css          # Quicksand + Dancing Script (Google Fonts)
css/app.css            # token bridge + shell/nav/buttons/keyframes
js/data.js             # DAYS plan + builders + overload helpers
js/store.js            # localStorage + streaks + journey/XP model
js/audio.js            # coach TTS + beeps (gated by the coach-voice toggle)
js/engine.js           # async session engine (Session class)
js/firebase.js         # offline-safe Firestore mirror (jenn_skating_sessions)
js/vm/*.js             # pure view-model builders
js/screens/*.js        # per-screen renderers
js/main.js             # state, render() dispatcher, event delegation, boot
assets/skate/*.png     # mascot illustrations
```

## Run it

No build step — serve statically (ES modules need http, not file://):

```
python3 -m http.server 8000   # then open http://localhost:8000
```

## Persistence

- Browser `localStorage`, namespaced `skate*` / `skate_*` (settings, sessions,
  tracker, readiness, quiz, journey/XP). Keys are unchanged from the previous
  version, so existing history and progress carry over; XP is seeded once from
  past sessions on first V2 boot.
- Cloud history mirrors to Firestore collection `jenn_skating_sessions`
  (best-effort; the app runs fully offline on localStorage if the network is blocked).

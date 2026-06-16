# ⛸ Jenn · Figure-Skate Dryland Timer

A single-file (`index.html`) workout-timer web app for figure-skating dryland.
Built on the Swimming-Dryland-Timer engine (full feature parity) and loaded with
the **Jenn Skating Dryland 2026.2 (v10)** plan.

## Plan content (2026.2)

6 training days + Sunday recovery, each run as 5 blocks:

**① Warm-up → ② Coordination → ③ Main (traffic-light rounds) → ④ Power/Finisher → ⑤ Skating-Skill (Axis Micro + Spin Board).**

- Mon — Single-Leg + Axis · Tue — Spin + Push/Carry · Wed — POWER A (Jump+Pull+Drive)
- Thu — Single-Leg + Core · Fri — Spin + Push/Carry · Sat — POWER B (Jump+Pull+Drive)
- Sun — Foam Roll + Review (recovery only)

Outcome metrics tracked on the PR board: doubles landing ≥9/10, pull-up clean reps,
single-leg eccentric hold, rotational-jump landing grade, layback hold.

Quality gates baked into the engine: valgus gate (left-knee, jumps + box step-up),
jump fatigue tier-drop, spin dizziness stop, never-to-failure pull series, bilateral
ankle gate (right deeper), progressive overload **paused until Week 3**.

## Features

8-question readiness check → traffic-light rounds (🟢 3 / 🟡 2 / 🔴 1 / recovery 0),
voice cues, exercise how-to (YouTube search aliases), independence ladder, quick quiz +
self-correction cards, 4-week PR board, last-7-sessions history, achievements, mood
tracking, test mode, weekly engagement pick.

## Run it

No build step — open `index.html` in a browser, or serve statically:

```
python -m http.server 8000   # then open http://localhost:8000
```

## Persistence

- Browser `localStorage` keys are namespaced `skate*` / `skate_*` (settings, progress,
  skip history, engagement, readiness, learning, ladder, gate, sessions, tracker).
- Cloud history uses Firestore collection `jenn_skating_sessions`.

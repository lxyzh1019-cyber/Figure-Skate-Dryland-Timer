# ⛸ Jenn · Figure-Skate Dryland Timer

A no-build web app for figure-skating dryland training, in the **"Skate with
Grace"** design system (rose/gold palette, Quicksand + Dancing Script) and
loaded with the **Jenn Skating Dryland 2026.2** plan. Built on the
Swimming-Dryland-Timer engine at **full feature parity** — same layered
architecture, same try-it mode, same rich session screen, journey map, quiz
deck, and grown-up analytics — re-themed and re-contented for skating, with two
skating-specific safety features preserved (below).

## Plan content (2026.2)

6 training days + Sunday recovery, each run as up to 5 blocks:

**① Warm-up → ② Coordination → ③ Main (traffic-light rounds) → ④ Finisher → ⑤ Skate-Skill (Axis Micro + Spin Board),** with a **Prep Pair** inserted after Main on the days that carry one.

- Mon — Single-Leg + Axis · Tue — Spin + Push/Carry · Wed — POWER A (Jump+Pull+Drive)
- Thu — Single-Leg + Core · Fri — Spin + Push/Carry · Sat — POWER B (Jump+Pull+Drive)
- Sun — Foam Roll + Review (recovery only)

Quality gates baked into the engine: valgus gate (left knee), spin-dizziness
stop, never-to-failure pull series, bilateral ankle gate (right deeper),
progressive overload (currently paused).

## Skating-specific session features (kept from the original skate app)

- **Landing check** — after every valgus-gated jump the athlete grades the
  landing *clean & frozen* vs *a bit wobbly*, before the rest starts. Grades are
  recorded per move (`entry.landings`) and feed the grown-up watch-list.
- **Jump-fatigue tier-drop** — two wobbly landings in a row automatically remove
  the highest remaining main round (🟢→🟡→🔴, never below the round in
  progress) with a spoken "quality over quantity" cue.

These are layered onto the Swimming engine's flow (greeting, get-ready, intent
word, micro-loop, breath rehearsal, rep voice counting, same-day resume, etc.).

## Screens & features

- **Today** — greeting + mascot, week strip with "catch up" reframing, streak/
  level stat chips, **try-it mode** toggle + "Start Try-It" CTA, 10-min mini
  session, collapsible block list, Quiz Deck launch, scrollable **Skating
  Journey map** (waypoints + "you are here"), state-aware day pane.
- **Body Check** (readiness) — 4 questions → interactive body map → severity →
  traffic-light (green 3 / yellow 2 / red 1 / recovery 0 rounds), pain gate,
  grown-up override.
- **Session** — 2-pane wide layout: exercise timeline, session-time card, tips &
  safety pane, form-photo + timer ring, up-next preview, pace bar, big "Done"
  button, plus the landing-check overlay.
- **Session Complete** — mantra, XP (incl. clean-landing bonus), mood check with
  caring acknowledgments, reflection chips, rotating Coach's Quiz.
- **Progress** — streak hero + week chart, **Ice Story** rank cards (lore +
  locked mystery cards), milestones, training log (Recent / All tabs), prize wallet.
- **Prize Draw** — pick a sealed card on level-up. **Quiz Deck** — questions
  generated from the plan's moves.
- **Grown-up Zone** — Overview · Analytics (Week/Month/All: adherence, ACWR,
  heatmap, load trend, pace, pauses/skips by block, form quality, mood, quiz
  trend, coach narrative, CSV export) · Coaching (valgus gate, Independence
  Ladder, PR tracker, engagement systems) · Move Library · Settings.

## XP model

`moves × 10 + 40` per completed session (half on ended-early, 0 on recovery/spa),
**plus a +5 bonus per clean frozen landing**. Level cost is `100 + (level−1)×20`
(unchanged from the previous version, so the athlete's level never shifts). XP is
seeded once from past sessions on first boot and never re-seeded.

## Project layout (module split, no build step)

```
index.html             # thin shell: loads css/ + js/main.js (module)
css/tokens/*.css        # Skate with Grace design tokens (colors/typography/spacing)
css/fonts.css           # self-hosted Quicksand + Dancing Script (offline-safe)
css/app.css             # shell/nav/buttons/keyframes
js/data.js              # DAYS plan, EXERCISE_HOWTO, ranks/lore, quiz, readiness
js/store.js             # localStorage + streaks + journey/XP + migration
js/audio.js             # coach TTS + beeps (gated by the coach-voice toggle)
js/engine.js            # async session engine (+ landing-check / tier-drop)
js/firebase.js          # offline-safe Firestore mirror (jenn_skating_sessions)
js/vm/*.js              # pure view-model builders (today/session/readiness/progress/grownup)
js/screens/*.js         # per-screen renderers
js/main.js              # state, render() dispatcher, event delegation, boot,
                        #   and the best-effort Red Deer weather chip
test/smoke.mjs          # node smoke tests (no dependencies)
assets/skate/*.png      # mascot illustrations + body maps
assets/fonts/*.woff2    # self-hosted fonts
assets/exercises/       # optional per-move photos: "<Name> - Timer Image.png"
```

Drop-in exercise photos: name them `assets/exercises/<Exercise Name> - Timer
Image.png`; until a photo exists the session shows a "form photo coming soon"
placeholder automatically.

## Run it

No build step — serve statically (ES modules need http, not file://):

```
python3 -m http.server 8000   # then open http://localhost:8000
npm test                      # run the smoke tests
```

## Persistence

- Browser `localStorage`, namespaced `skate*` / `skate_*` (settings, sessions,
  tracker, readiness, quiz, journey/XP). Keys are unchanged from the previous
  version, so existing history and progress carry over; legacy prize and quiz
  records are migrated in place on first boot.
- Cloud history mirrors to Firestore collection `jenn_skating_sessions`
  (best-effort; the app runs fully offline on localStorage if the network is blocked).

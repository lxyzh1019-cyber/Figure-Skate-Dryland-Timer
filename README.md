# ⛸ Jenn · Figure-Skate Dryland Timer

A no-build web app for figure-skating dryland training, in the **"Skate with
Grace"** design system (rose/gold palette, Quicksand + Dancing Script) and
loaded with the **Jenn Skating Dryland 2026.2** plan. It runs on the same
engine as the sibling Swimming Dryland Timer — the *same files*, shared as a
subtree — so a rule is one rule for both athletes, and only the plan, the
ranks, the prizes and the artwork are this app's own.

## Shared core

Everything that does not name the sport lives under `core/`: the session
engine, the store, the XP and prize rules, the grown-up gate, the cloud sync,
the screens, the service worker and the test harness. It is byte-identical in
both repositories. What makes this app *this* app is three things it owns:

- `js/sport.js` — its identity: names, storage keys (unchanged, so history
  carries over), the Firestore collection, the mascot and body-map images,
  the twenty lines of copy that mention ice, and `FEATURES.landingCheck`.
- `js/data.js` — its content: the plan, the ranks and lore, the prizes, the
  readiness copy, the Coach's Quiz. Built with the mechanism in `core/plan.js`.
- `css/tokens/*`, `css/fonts.css`, `assets/`, `index.html`,
  `manifest.webmanifest` and the two-line `sw.js` that configures the shared
  worker — the design system and the shell.

A change to the rules is made once, in the swim repository's `core/`, and
reaches this app with `git subtree pull --prefix=core <swim-repo> core`.

## Plan content (2026.2)

6 training days + Sunday recovery, each run as up to 5 blocks:

**① Warm-up → ② Coordination → ③ Main (traffic-light rounds) → ④ Finisher → ⑤ Skate-Skill (Axis Micro + Spin Board),** with a **Prep Pair** inserted after Main on the days that carry one.

- Mon — Single-Leg + Axis · Tue — Spin + Push/Carry · Wed — POWER A (Jump+Pull+Drive)
- Thu — Single-Leg + Core · Fri — Spin + Push/Carry · Sat — POWER B (Jump+Pull+Drive)
- Sun — Foam Roll + Review (recovery only)

**The light decides the whole session**, not just the round count: green runs
every block with 3 main rounds, yellow drops the prep pair and finisher and
runs 2, red keeps warm-up, main and skate-skill with 1, recovery runs the
recovery circuit only. Same policy as the swim app, block for block.

**Timed vs rep moves.** A timed move carries `work` seconds and runs a
countdown. A rep move is counted by the coach from its structured
`prescription` — sets × reps × sides × directions, tempo, hold — parsed once
from the dose text at load, or written out explicitly beside a dose the
parser cannot read (`"3 × 4s ecc + max clean"`). A dose the parser cannot
read fails at load, never quietly counts to ten.

**Quality gates.** The valgus gate is a ceiling on jump progressions: locked,
every jump stays at *Box Jump → Stick*; unlocked, the bounds, rotational and
single-leg landings run. It unlocks after clean weeks on the gate move and a
parent-verified form check can close it again. Spin-dizziness stop and the
never-to-failure pull series are in the plan's cues.

## Skating-specific session feature

**Landing check + jump-fatigue tier-drop.** After every valgus-gated jump the
athlete grades the landing *clean & frozen* vs *a bit wobbly* before the rest
starts. Two wobbly landings in a row remove the highest remaining main round
(🟢→🟡→🔴, never the round in progress) with a spoken "quality over quantity"
cue, and the day's plan is lowered with it — so XP, the finish screen and a
same-day resume all agree on what the day asked for. Grades are recorded per
move for the grown-up watch-list. The rule lives in the core behind
`FEATURES.landingCheck`; this app turns it on, the swim app leaves it off.
Landings pay nothing extra: a session is priced on the rounds it trained,
exactly as in the swim app.

## Screens & features

- **Today** — greeting + mascot, week strip with *done / partly done / catch
  up*, streak/level chips, GO, **🧪 Explore the moves** (the session screen
  with nothing counting and nothing saved), collapsible block list, Quiz
  Deck, scrollable **Skating Journey map**.
- **Body Check** — 4 questions → body map → severity → traffic light, with
  yesterday shown for reference but never reused, both readings recorded, and
  a grown-up required at severity 3.
- **Session** — the coach counts reps as they are done, shows SET / SIDE / REP
  chips so a muted device is still followable, pauses when the iPad is put
  down, keeps the photo beside the timer, asks before skipping, offers
  "◀ Back a move", spot-checks 2–3 moves and grades every landing. A tap
  during the coach's announcement starts the move; the red STOP asks whether
  something hurts before it costs her anything — a plain "just stopping" is
  paid for the rounds she trained.
- **Session Complete** — one of nine honest states (complete, partial,
  recovery held, safety stop, nothing logged, …), mood, reflection, Coach's Quiz.
- **Progress** — streak, a period board (4 weeks / month / quarter) with
  totals and averages and a per-day XP chart, **Ice Story** rank cards,
  milestones, training log, prize wallet.
- **Grown-up Zone** — behind a PIN or passkey. Overview (watch list,
  overrides, body map over time), Analytics (at a glance, "Is she trying?",
  ACWR, load, pace, skips, mood, quiz, CSV), Form Check (monthly
  parent-verified technique), Coaching, Move Library, Settings (three audio
  switches, voice speed, prize pool, wallet repair, backup & restore).

## XP and reward rules

Identical to the swim app's, from the same file (`core/store.js`,
`core/outcome.js`):

- **Training**: a session pays a flat rate for the rounds actually trained —
  0 rounds 90, 1 round 180, 2 rounds 270, 3 rounds 360; nothing for recovery
  or a pain stop. A short round is paid the fraction she did. **A day pays for
  a day**: two sittings share one ceiling, and a move she skipped is offered
  again the same day.
- **Quiz**: only the day's first deck pays; each question pays at most once
  ever (+5 first attempt, +25 first correct); 30 XP a day across both quizzes.
  The bank asks about every move three ways (cue / watch-out / fix), about every
  unlocked rank two ways, and **about training itself** — attitude, efficiency,
  and why results come from repeating the same movement rather than a similar
  one. Every wrong answer is either true of a different move or something a
  skater her age actually believes, never the silly option; the generator
  refuses to put two answers that say the same thing on one card, or to let the
  right answer give itself away by being the longest. **Two tiers**: recognition
  first, application (that felt wrong — so what do you change?) only once the
  tier-1 question it builds on is mastered. **One card is about today**, built
  from the session she just trained; it renews daily, so it pays a flat +5 once
  a day inside the same ceiling rather than from the finite ledger.
- **Streak**: 75 % of the final light's dose; a finished recovery day holds it.
- **Levels**: `500 + (n−1)×30` to level 8, `1000 + (n−9)×45` to 17,
  `1500 + (n−18)×50` after — frozen, running to level 50 (Winter Sovereign).
- **Prizes**: one envelope per level reached, derived from the high-water
  level and the wallet, never a counter; a draw waits while the day's total is
  unsettled across devices; "✓ Used" is one-way with a five-minute undo; the
  wallet is trimmed oldest-first to what the level earned, and the trim
  survives a sync.

## Run it

No build step — serve statically (ES modules need http, not file://):

```
python3 -m http.server 8000   # then open http://localhost:8000
npm test                      # every suite, in two timezones
```

## Tests

`npm test` runs `core/test/run.mjs`, which runs every suite in its own
process under the default timezone and America/New_York and reports every
failure: the core's action-layer, invariants, integrity, landing-rule and
offline-shell suites against this app's content, and `test/smoke.mjs`, which
checks what only this app can get wrong — its plan, ranks, prizes, demo links
and readiness copy. On a pull request CI also runs
`core/tools/release-check.mjs`: a precached shell file that changed without a
bump of `version` in `sw.js` fails the build.

## Data

- Browser `localStorage`, namespaced `skate*` / `skate_*`. Keys are unchanged
  from the previous version, so existing history and progress carry over; a
  journey written by the earlier draw ledger carries its high-water level
  across on first boot.
- The cloud mirror is Firestore collection `jenn_skating_sessions` (session
  rows, one `journey-<athlete>` doc, one `readiness-<athlete>` doc of abnormal
  checks). The sync is both ways on every boot and only ever additive; the
  journey is merged before it is written, so one device cannot erase the
  other's prizes. The previous global `journey-state` document is still read.
- **Firestore rules** are shared with the swim app: one `firestore.rules`,
  byte-identical in both repositories, naming both collections. Deploy from
  either repo with
  `npx firebase-tools deploy --only firestore:rules --project chore-tracker-a461b`.
  The mirror has no sign-in; the rules confine a misbehaving client, not a
  hostile one, and the app renders every stored string as text.
- A versioned service worker (`core/sw-core.js`, configured by `sw.js`)
  precaches the shell, so an Add-to-Home-Screen launch with no network boots
  and can run a whole workout — bump `version` in `sw.js` on every release.
- **Backup & restore** (Grown-up Zone → Settings): the whole namespace as
  JSON; restoring is additive.

## Project layout

```
index.html              # shell: loads css/ + core/main.js, registers sw.js
core/                   # the shared engine (git subtree; do not edit here)
js/sport.js             # this app's identity: names, keys, images, copy, features
js/data.js              # this app's content: DAYS, ranks/lore, quiz, readiness
css/tokens/*.css        # Skate with Grace design tokens
css/fonts.css           # self-hosted Quicksand + Dancing Script
css/app.css             # shell/nav/buttons/keyframes
sw.js                   # cache prefix + version + the app's own shell files
manifest.webmanifest    # Add to Home Screen
firestore.rules         # shared with the swim app
test/smoke.mjs          # this app's content tests
assets/skate/*.png      # mascot illustrations + body maps
assets/exercises/       # optional per-move photos: "<Name> - Timer Image.png"
```

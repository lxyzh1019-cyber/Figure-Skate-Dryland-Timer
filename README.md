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

**Training (open-ended).** A flat rate for the rounds trained — **1 round 180,
2 rounds 270, 3 rounds 360** (half on ended-early, 0 on recovery/spa), **plus a
+5 bonus per clean frozen landing**, which rides on top because it is the one
part of the score that rewards *how* the session went. An easy day is worth half
a full one, and the number no longer wobbles with the move count of that
weekday. A mini is priced as a 1-round day however the light was set. Matches
the swim app. Sessions logged before this rule keep the value they were awarded.
This is the only uncapped way up the ladder.

**Quiz (capped, pays for learning not repetition).** Three rules, in `store.js`:

1. **One paying deck per calendar day.** Later decks the same day are free
   practice worth 0 XP, clearly labelled as such in the UI.
2. **Each question pays at most once, ever** — `+5` the first time it is
   attempted, `+25` the first time it is answered correctly. A question missed
   on the first look still pays its `+25` when it is finally learned.
3. **A daily ceiling of 30 XP** — exactly one brand-new question — shared by the
   Quiz Deck and the Coach's Quiz. Questions are paid whole or not at all, so
   one the cap skipped is still worth full value tomorrow. The ceiling is
   measured against the *lightest* training day (180 XP), not a full one: easy
   days are exactly when a kid is most tempted to tap through a quiz instead of
   training.

The bank holds 87 move questions (48 moves × cue / watch-out / fix where
content exists) **plus two per rank she has unlocked** — what that rank taught
her, and its one true fact — so the pool grows as she climbs. Locked ranks are
never asked: that would spoil the mystery card and quiz her on a chapter she
has not been shown. The moves alone therefore cap the quiz's **lifetime** yield
at `87 × 30 = 2,610 XP`, spendable over at least 87 days. Paying decks deal unlearned questions first, so
the day's XP isn't wasted on questions the kid already owns. Progress shows as
"moves mastered", and the grown-up Analytics tab reports budget spent vs. total
and XP banked today against the ceiling.

This replaced an unbounded rule (`score × 25 + answered × 10` per deck, no cap,
no cooldown, no memory). Because the deck reveals each answer after the pick, one
honest pass taught the answers and every replay was a guaranteed 8/8 = 280 XP —
about 370 XP/minute of tapping, enough to climb from level 1 to 26 in ~23
minutes. `answered × 10` also paid out on an all-wrong deck, rewarding tapping
over knowing. `test/smoke.mjs` guards all of this.

**Levels.** Cost is the **shared curve**, identical to the swim app's:
`500 + (n−1)×30` to level 8, `1000 + (n−9)×45` to 17, `1500 + (n−18)×50` after
that. A level therefore means the same amount of work in both sisters' timers.
This replaced the old V2 curve (`100 + (level−1)×20`), which was about a third
the price — the one and only time a level has been re-priced here, and it moved
this skater from level 18 to level 8 on the day it shipped. Her XP did not
change; only what a level costs did. The ladder's 18 rungs sit at the same
levels as the swim app's 18, running to **level 50 (Winter Sovereign)** at
88,260 XP — from ~4,600 XP that is roughly March 2027, comfortably past the
January bar; every
historical rung keeps its exact threshold, and a smoke test enforces that so a
kid's rank can never move backwards. XP is seeded once from past sessions on
first boot and never re-seeded.

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
- **The mirror syncs both ways on every boot** (`js/sync.js`), all of it
  additive — nothing is overwritten or deleted on either side:
  1. *pull* — any session this browser is missing is merged into the local log
     and its XP re-awarded, so a cleared or brand-new browser recovers the
     history instead of starting over;
  2. *push* — any session the cloud is missing (uploaded while offline, or
     logged before the mirror existed) is backfilled up;
  3. *journey* — the part the session log cannot re-derive (quiz XP, prize
     wallet, pending draws, the per-question ledger) rides in one `kind:
     "journey"` doc in the same collection, merged upward and republished.
     Without it two devices showed two different levels for the same skater:
     one rebuilt training XP only, the other still held its quiz XP as well.
  Without this the mirror was write-only: `localStorage` is per-browser and
  per-device, and Safari deletes it after ~7 idle days, so everything earned
  vanished from the app while a full copy sat intact in the cloud.
- **Backup & restore** (Grown-up Zone → Settings): downloads the whole
  namespace as JSON — sessions, XP, prizes, quiz mastery, trackers, settings —
  and restores it. Restoring is additive: sessions are merged and deduped, the
  higher XP total wins, prize wallets are unioned, and other records fill in
  only where the device has nothing. This is the recovery path that doesn't
  depend on the network.
- Writes that localStorage rejects (full device) are retried after dropping the
  expendable analytics keys, and if they still fail the app says so in a banner
  — a session that wasn't recorded never reads as saved.

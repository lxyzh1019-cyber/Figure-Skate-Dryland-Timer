# Plan v1 — Back a move keeps done moves — Approved

| Summary |
|---|
| What changes for you: when she goes back to finish an earlier move, the moves she already did in full stay done. After the redo, the timer takes her straight back to where she was. A full move never turns into ½ again. |
| First version |
| Read the plan. Approve it, or tell me what to change. |

## What happens today

"◀ Back a move" goes back one move at a time. Each step back erases the result of the move it passes. To reach A from C, she passes B, so B's full result is erased. After she finishes A, the timer shows B again. When she taps Done to get past B, B is saved as ½ (short).

## What will change (your two answers)

1. Back to where she was. When she goes back, the moves she passes keep their results. After she finishes the move she went back to, the timer skips every move that already has a full result. It goes straight back to C.
2. Keep the best result. If a move is already done in full and she taps Skip or Done early on it, it stays done. A short try or a skip never replaces a full result.

Both apps change the same way, because they share the timer code. Screens keep their look. Only the marks (✓, ½, ⏭), the counts and the next move change.

## What stays the same

- Back is still offered only inside the same block, before the round is counted.
- Back from a move she has not finished yet still works as today: that move starts again.
- XP, streak, Today card, Progress and Grown-up rules stay the same. They read the corrected results.
- A move that was ½ or ⏭ before she went back is shown again, so she can improve it.

## Done when

- The story you sent, played by a test, ends on C with A ✓ and B ✓.
- Skip or Done early on a full move keeps ✓.
- The saved day progress, the finish screen and a resume after closing the app show the same marks.
- All tests pass in both apps.
- You try it on the iPad and see A ✓, B ✓, back on C.

Checked against: hotspot "Move status list" (1 fix round, ½ gave no reason; this keeps its wording) and "Care/recovery day record" (1 fix round; it touched the saved day progress, which this also changes, so its tests run too). No open ledger item conflicts. New hotspot row: "Back a move / rewind", 1 fix round.
Removes/consolidates: the rule "going back erases every result after the target" is replaced by "going back erases only the target move". No other mechanism is added.

## Stages to finish

5 stages: 3 build steps by Claude, then 2 checks (reviewer, then your merge and iPad check)

1. Find the exact lines and write failing tests first (both apps) · Claude · Build · files: shared tests · after: — · level: Complex · size: S · group: A · proof: new tests fail on today's code, with the count written in the record
2. Change Back, the redo path and Skip/Done on full moves (both apps) · Claude · Build · files: shared timer code, shared result code, app version files · after: 1 · level: Complex · size: M · group: A · proof: new tests pass, full suite passes in both apps, scripted run shows A ✓ B ✓ back on C
3. Record, feature list and pull requests · Claude · Build · files: working record, feature list, this plan · after: 2 · level: Routine · size: S · group: A · proof: regression table with no missing items; reviewer verdict before the pull requests
4. Reviewer check before the pull requests · Claude · Check · after: 3
5. Merge both pull requests and try the story on the iPad · You · Check · after: 4

Technical details:
- Cause: `core/engine.js` `rewindTo()` (~1893) truncates `sess.ledger` from `target` and calls `unbankMove` (~1377) on every dropped row; loop resumes at `target` and walks `s+1` (~2144, ~2162). `timedExerciseStatus` (~1032, `DONE_WORK_FRACTION` 0.8) writes `partial` on early Done; Skip writes `skipped` (~3022); row written ~1052-1091 with no guard. `mergeLedgerRows` (`core/outcome.js` ~740) already keeps best per move+round but the row was gone. `canGoBack` ~1879, `goBackExercise` ~3045.
- Fix shape (worker decides details, within the decisions): `rewindTo` drops/unbanks only the target step's row; rows for later steps are kept aside (still banked) with their step index; remember `sess.backFrom` (the step she was on). In the loop, after the redone step, skip each step whose kept row is `done` until `backFrom`; steps whose kept row is `partial`/`skipped` are walked again. Writing a row on a step that already has a `done` row keeps the `done` row (Skip/early Done do not downgrade). Ledger stays one row per reached step in step order so `commitRoundIfDone` (~1116), `exDone`, `exStatus` and resume read it unchanged; check `sess.skipped` step tags.
- Tests: new cases in `core/test/session.mjs` or a new `core/test/back.mjs` registered in `core/test/run.mjs`: (a) A partial, B full, on C, Back ×2, finish A → current step C, B status done, day progress has B; (b) Skip on a done move → stays done; (c) early Done on a done move → stays done; (d) Back from an unfinished move still restarts it (existing `core/test/leadin.mjs:138-146` stays green); (e) resume after (a) shows same marks; (f) finish-screen counts. Fast loop per FEATURES.md `Tests:` lines; full `npm test` once per repo before the PR.
- Both repos: `core/` must be byte-identical. Local `diff -rq core` shows 9 files differing (engine.js identical); stage 1 fetches both, compares on `origin/main`, and stops with a report if they differ there. `sw.js` version bump in both.
- Branches `claude/back-keeps-done` in both repos; one PR each, ready for review, after the reviewer.
- No screen layout change, so no picture-reference stage; marks checked by a scripted run (VM/HTML output).
- Planner helper not available in this session (no `planner` agent type; hook refused `Plan`): plan written by the main session.
- Design decisions to add to the record at stage 3: `- [agreed] after a redo, skip moves done in full and return to where she was — search: back to where she was`; `- [agreed] a full result is never replaced by a skip or short try — search: keep the best result`.

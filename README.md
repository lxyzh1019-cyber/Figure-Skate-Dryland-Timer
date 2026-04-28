# Exercise-Timer

## Local persistence (migration-ready)

The app currently stores state in browser `localStorage`:

- `landTrainingSettingsV1` (voice style + timer settings)
- `landTrainingProgressV1` (manual progress tracker entries)
- `landTrainingSkipHistoryV1` (skipped exercises, auto-pruned to 7 days)

For Firebase migration later, replace the storage helper functions in `index.html`:

- `readStorage` / `writeStorage`
- `loadSettings` / `saveSettings`
- `loadProgressEntries` / `saveProgressEntries`
- `loadSkipHistory` / `saveSkipHistory`
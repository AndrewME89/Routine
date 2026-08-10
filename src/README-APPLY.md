# Nightshift OS UI parity patch

This patch changes presentation only. It does not alter IndexedDB storage, routine logic, meal logic, money logic, settings, or user data.

## Files changed

- `src/App.tsx`
  - responsive desktop/mobile shell
  - grouped navigation (Core / Learning / Life / System)
  - stronger Nightshift OS sidebar treatment using the repo's existing exact design tokens
  - mobile drawer navigation
  - retains every existing route/module and Coming Soon state

- `src/pages/TodayPage.tsx`
  - wider Nightshift OS dashboard canvas
  - stronger operational-day header/time treatment
  - redesigned dashboard-mode selector
  - redesigned Now & Next card
  - routine summary counts
  - cleaner timeline hierarchy and status controls
  - preserves all existing data/behaviour

## Apply with Git

From the root of `AndrewME89/Routine`:

```bash
git switch -c agent/match-nightshift-os-ui
git apply nightshift-ui-parity.patch
npm ci
npm run build
git add src/App.tsx src/pages/TodayPage.tsx
git commit -m "Match Nightshift OS UI shell"
git push -u origin agent/match-nightshift-os-ui
```

Then open a pull request into `main`.

## Or replace the files directly

The `replacement-files/` folder contains complete replacements for both changed source files.

## Why this is not already pushed

The connected GitHub integration can read the repository, but GitHub returned HTTP 403 (`Resource not accessible by integration`) for branch/tree creation. The workspace also does not have `gh` installed, so a safe branch/PR push is unavailable from this session.

# Nightshift OS (web)

A client-side-only rebuild of Nightshift OS, for `AndrewME89/Routine` on GitHub Pages.

**This first slice is: the operational-day engine + Today + Settings.** Everything else
(Tasks, HR Study, Meals, Escrima, Money, Health, etc.) is still on the original
ChatGPT-Sites-hosted app and gets ported here module by module.

## Why this is built the way it is

- **No backend.** GitHub Pages only serves static files, so there's no server-side database
  like the Cloudflare D1 the Sites version uses. All data — settings, roster, routine
  completion — lives in this browser's **IndexedDB**. Nothing is sent anywhere.
- **No personal data in the source code.** The roster in `src/lib/defaultSettings.ts` is a
  placeholder (every day defaults to RDO). Real shift times, and later on real debt figures,
  medication details, etc., are entered through the app itself after you open it, and they stay
  in your browser's local storage — never committed to git.
- **Trade-off:** because data lives in one browser, it won't sync between your phone and
  desktop unless you export/import a backup (Settings → Export full backup) or we add a sync
  layer later.

## Running it locally

```bash
npm install
npm run dev
```

Opens at `http://localhost:5173`.

## Deploying to GitHub Pages

1. Push this to the `main` branch of `AndrewME89/Routine`.
2. In the repo: **Settings → Pages → Source → GitHub Actions**. The included workflow
   (`.github/workflows/deploy.yml`) builds and deploys automatically on every push to `main`.
3. Your site will be at `https://AndrewME89.github.io/Routine/`.

## A privacy note worth reading before you rely on this

GitHub Pages sites are **publicly reachable at their URL** — a private GitHub repo does not
make the *Pages site* private (that needs GitHub Enterprise Cloud). Because no personal data
ships in the source, the worst a stranger who found the URL could see is an empty app with
placeholder settings — not your actual routine, debt, or health data, since that only ever
lives in your own browser's storage. If you want the URL itself to not be guessable/indexed,
keep it out of anywhere public and consider adding a simple access gate later (e.g. Cloudflare
Access in front of the Pages site) once there's more here worth protecting.

## Project layout

```
src/
  lib/
    types.ts            domain types
    defaultSettings.ts   placeholder settings (no personal data)
    storage.ts           IndexedDB read/write + full backup export
    operationalDay.ts     18:30→10:30 day-boundary math
    routineEngine.ts      routine step definitions + Now/Next logic
    useAppData.ts         central state hook (loads, ticks, mutates)
  pages/
    TodayPage.tsx
    SettingsPage.tsx
    ComingSoonPage.tsx    placeholder for not-yet-ported modules
  App.tsx                 sidebar + page switching
```

## What's implemented

- Operational-day boundary logic (18:30 → 10:30 next day), verified so a 2am event correctly
  belongs to the *previous* evening's operational day rather than flipping at midnight.
- Roster-driven Work Night vs RDO detection, with manual override for all four modes
  (Normal / Work Night / RDO / I'm Exhausted).
- The full daily routine chain from wake through sleep, with the work-only steps
  (prepare food, shower, get ready, leave, commute, work, commute home, get home) appearing
  only on Work Night, derived from your roster rather than hard-coded.
- Now/Next card.
- Every routine step supports Done / Move Later / Skip Today / Not Happening, persisted per
  operational day so it survives a reload.
- Editable wake/sleep time and per-weekday roster in Settings.
- One-click full local backup export (JSON).

## What's next

Tell me which module you want ported next (Tasks, Routines detail view, HR Study, Meals,
Escrima, Money, Health, Life Admin, Weekly Reset, Activity, or Projects) and I'll build it the
same way — a real, tested slice, not a mockup.

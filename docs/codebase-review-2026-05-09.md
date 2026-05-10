# Freshkeep Codebase Review - 2026-05-09

Tags: #freshkeep #code-review #expo #supabase

## Findings

### P1 - Daily digest notifications can repeat stale counts

`lib/notifications.ts:153` builds the digest body once, then `lib/notifications.ts:158` schedules a repeating daily trigger with that fixed body. The app reschedules when items/preferences change or when the app foregrounds, but if nothing opens the app, tomorrow's digest can still show yesterday's counts. This is especially visible as items naturally move from "use soon" to "today" to "overdue".

Recommendation: schedule the next digest as a one-shot date notification and reschedule on app foreground/item changes, or avoid count-specific text in repeating digest bodies.

### P2 - Jest is discovering hidden worktree tests

`jest.config.js:5` matches every `__tests__` directory under the repo. Local test output currently shows a Haste module naming collision and runs duplicate tests from `.claude/worktrees/affectionate-hodgkin-e72b32`.

Impact: local and CI runs can silently include stale copied tests/code, producing false confidence or confusing failures.

Recommendation: add `testPathIgnorePatterns`/`modulePathIgnorePatterns` for `.claude/`, or keep worktree snapshots outside the repo root.

### P2 - Barcode scanner can launch overlapping lookups

`app/scan-barcode.tsx:149` guards with React state (`busy`, `handledCode`, `scanResult`), then flips `busy` at `app/scan-barcode.tsx:154`. Scanner callbacks can fire rapidly before React commits state, so multiple lookups can race and the last response wins.

Recommendation: add a ref-based in-flight guard that is set synchronously before awaiting `lookupBarcodeProduct`, then cleared on reset/retry.

### P2 - Notification rescheduling errors are dropped

`context/ItemsContext.tsx:65` starts an async notification reschedule task and intentionally does not await it. If Expo notification scheduling rejects, the app does not surface or log the failure. The settings screen also calls `rescheduleAllItems` after saving prefs at `app/(tabs)/settings.tsx:151` without a user-visible failure path.

Recommendation: wrap notification scheduling in `try/catch`, log in development, and show a lightweight settings warning if permissions or scheduling fail.

### P3 - Profile loading swallows backend errors

`context/AuthContext.tsx:98` retries profile loading, but `context/AuthContext.tsx:101` discards the final Supabase error and returns `null`. Screens that require `profile` can treat a transient profile fetch failure like a missing auth/profile state.

Recommendation: preserve a profile error state separately from `profile === null`, especially for settings/household flows.

### P3 - Add item uses a mount-time "today"

`app/add-item.tsx:105` captures `today` only once per screen mount. If the add/edit screen remains open across midnight, `app/add-item.tsx:124` validates against yesterday.

Recommendation: compute current `todayYmd` inside `onSave`, or update it when the app returns to foreground.

## Current Architecture

- Expo Router React Native app with auth routes, tabs, item details, add/edit item, household management, and barcode scan flow.
- Supabase provides auth, profiles, households, items, invites, RLS policies, write-rate limiting, validation constraints, and an Edge Function for barcode lookup.
- Local app state is organized through `AuthContext`, `ItemsContext`, and `ThemeContext`.
- Item freshness logic is centralized in `lib/spoil.ts` and has focused Jest coverage.
- Notification logic is centralized in `lib/notifications.ts`, with digest bucket/body tests.
- Barcode lookup goes app -> Supabase Edge Function -> Open Food Facts -> Supabase cache.

## Recent Updates Observed

Current branch: `main`

Recent commits:

- `766275f` - Harden validation and backend item flows
- `1615756` - Merge cursor/add-item-barcode-scan into main
- `4676061` - chore: add Claude worktree snapshot
- `45bd1a6` - feat: system dark mode, ThemeProvider, and iOS native project
- `8488944` - feat: barcode scan in add item with Open Food Facts lookup
- `5229cbc` - feat: initial Freshkeep Expo app with Supabase and household items

Working tree status: clean and aligned with `origin/main`.

## Strengths

- Good domain centralization: freshness/date calculations and notification bucket logic are not scattered through screens.
- Supabase row parsing is defensive and helps protect the app from malformed backend data.
- The backend schema includes meaningful hardening: RLS, notification settings validation, item-name validation, write-rate limiting, invite soft delete, and household join guardrails.
- Barcode lookup has a server-side cache and timeout handling, which keeps the client simple.
- Optimistic concurrency via `schedule_version` is a smart protection for item edits across devices.

## Verification

Commands run on 2026-05-09:

```bash
npm run typecheck
npm test -- --runInBand
npm run lint
```

Results:

- Typecheck: passed.
- Lint: passed.
- Tests: passed, but Jest emitted a Haste collision and ran duplicate tests from `.claude/worktrees/affectionate-hodgkin-e72b32`.

## Suggested Next Work

1. Fix Jest discovery so local tests only run the active workspace.
2. Decide whether digest notifications should be one-shot scheduled or use generic repeating copy.
3. Add a synchronous in-flight guard to barcode scanning.
4. Add notification scheduling error handling in `ItemsContext` and settings.
5. Track profile loading errors separately from missing profile state.


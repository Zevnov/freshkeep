# AGENTS.md

## Cursor Cloud specific instructions

### Project overview

Freshkeep is a React Native (Expo SDK 54) food freshness tracker. The backend is entirely Supabase (PostgreSQL + Auth + REST API). There is no custom server; the mobile/web app talks directly to Supabase.

### Running the app

- **Dev server (web):** `npx expo start --web --port 8081` — serves at http://localhost:8081
- **Tests:** `npx jest` (2 suites, 15 tests; runs in ~2s)
- **Lint:** `npx expo lint` (ESLint via Expo — auto-installs eslint + eslint-config-expo on first run)

### Supabase

- The Supabase project ID is `yyesguytzwzvlfmjxjlv`.
- Database schema is defined in `supabase/schema.sql` — tables: `households`, `profiles`, `household_members`, `items`, `household_invites`, plus RPC functions and RLS policies.
- `.env` must contain `EXPO_PUBLIC_SUPABASE_URL` and `EXPO_PUBLIC_SUPABASE_ANON_KEY` (see `.env.example`).

### Gotchas

- `.npmrc` sets `legacy-peer-deps=true` — required for Expo + React Native peer dep resolution.
- The first `npx expo lint` run auto-installs `eslint` and `eslint-config-expo` if missing. There are 3 pre-existing lint errors (unescaped entities) in `household.tsx`, `settings.tsx`, and `join-household.tsx`.
- Creating auth users directly in the DB requires setting `email_change`, `phone_change`, and similar columns to empty strings (not NULL) — GoTrue will return 500 errors otherwise.
- The Expo web bundle takes ~7s to build on first load; subsequent HMR is fast.
- The app uses `react-native-web` for browser rendering; not all React Native features work identically on web (e.g., header Pressable buttons in expo-router can be finicky).

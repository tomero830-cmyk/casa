# Casa

Personal household web app (nutrition and weight, workouts, shopping list, income). UI is Hebrew, RTL, mobile-first.

## Stack
React 18 + Vite, React Router 6, TanStack Query, Tailwind + shadcn/ui (`src/components/ui`), Recharts, framer-motion, date-fns. Alias `@/` → `src/`.

## Backend: Base44 (do not replace)
- Data: `base44.entities.<Name>` (list / filter / create / update / delete). Schemas in `base44/entities/*.jsonc`. A new entity or field needs the jsonc updated **and** created manually in the Base44 dashboard.
- Auth: `base44.auth.*` via `src/lib/AuthContext.jsx` (`user`, `updateCurrentUser`). Don't change the login / MFA flow without an explicit request.
- AI and files: `base44.integrations.Core.InvokeLLM`, `Core.UploadFile`.
- Server function: `base44/functions/logSteps` (Deno) receives steps/calories from iOS Shortcuts. Requires `SHORTCUTS_SECRET` and `user_email`; rows are written with `created_by = user_email`.
- No other backend library (Supabase, Firebase…) without asking.

## Structure
- `src/pages/*` routed in `src/App.jsx`: Dashboard, Workouts, Nutrition, Shopping, Income, ShortcutSetup, auth pages.
- Not routed: `Mfa.jsx`, `OAuthConsent.jsx`.
- Removed modules (code deleted, data kept in Base44): plants/watering, budget, financial advisor. Their entity schemas `Plant` and `PlantAnalysisHistory` remain in `base44/entities`.
- `src/lib/dates.js`: local "YYYY-MM-DD" helpers (`todayStr`, `toDateStr`, `parseDateStr`, `addDaysStr`). Never use `toISOString()` for a calendar date (UTC → wrong day in Israel after midnight).
- `src/lib/notify.js`: `notifyError(err, title)` Hebrew error toast. Every mutation/await that writes data should handle errors with it.
- `src/components/ConfirmDialog.jsx`: confirmation wrapper for delete buttons.
- `src/lib/household.js`: `HOUSEHOLD_NAME` from `VITE_HOUSEHOLD_NAME`.
- `src/lib/weightForecast.js`: pure trend/forecast math (least squares over ~6 weeks); UI in `components/nutrition/WeightForecast.jsx`, shown to users with `User.weight_goal`.
- Gym log: entity `GymSet` (one row per set: date, exercise, set_number, reps, weight_kg). Pure helpers in `src/lib/gym.js` (Epley 1RM, sessions, PRs, last session); UI in `src/components/gym/*`, shown as the "יומן כוח" tab on the Workouts page. Data hook `useGymSets` filters by `created_by` and updates optimistically.
- Indoor walks: entity `HealthWorkout` (date, workout_type=indoor_walk, start_time, duration_min, steps, distance_km, calories), written by `logSteps` from the Shortcut's `walk_*` fields. `src/lib/walks.js` computes average walking time and a +10% goal; `components/dashboard/WalkGoalCard.jsx` shows it only to users with synced walks.
- Base44 schema/function changes are deployed with the official CLI (`npx base44@0.3.6 entities push` / `functions deploy`). `entities push` is a FULL sync that removes remote entities missing locally, so push from a folder that contains every remote entity (incl. `Expense`), never from the repo's trimmed `base44/entities`.
- iPhone widget: Scriptable script generated in `src/lib/widgetScript.js` (page `/widget`). Auth via a personal `WidgetToken` row; Base44 function `widgetSummary` (read-only) resolves token → user and returns today's calories/goal, steps and indoor-walk progress. Functions deployed with the CLI need a Publish in the Base44 editor before the live app uses them.
- Themes: `src/lib/theme.js` (per device, localStorage); default `olive`. Design picker at public route `/design`.
- Repo is meant to be public: no personal names, emails or secrets in code; household-specific values come from env vars.

## Conventions
- Functional components, `useQuery`/`useMutation`, shadcn components, Hebrew text, RTL (use `ml-*`/`right-*` for icon spacing in RTL).
- Per-user data (food, weight, income): filter on the server with `filter({ created_by: user.email })`, not only on the client. The current user comes from `useAuth()`, not repeated `base44.auth.me()` calls.
- Internal FoodEntry rows: `__steps__`, `__calories_burned__` are excluded from food totals.

## Deploy
- GitHub: public repo `tomero830-cmyk/casa`, branch `main`. Vercel auto-deploys every push to `main` (production: https://casa-seven-xi.vercel.app). Netlify also works via `public/_redirects`.
- `vercel.json` proxies `/api/*` to `https://base44.app/api/*` (the app calls relative `/api/...` URLs) and falls back to `index.html` for SPA routes.
- Env vars (set in Vercel): `VITE_BASE44_APP_ID`, `VITE_BASE44_APP_BASE_URL` (the Base44 app domain), `VITE_HOUSEHOLD_NAME`. See `.env.example`.
- Before pushing: `npm run lint` and `npm run build` must pass. The local branch `private-history` holds old history with personal data and must never be pushed.

## Keeping the Claude project in sync
After committing: `python3 scripts/export-source.py` regenerates `casa-source.md` and `casa-code.json`; upload `casa-source.md` to the project files.

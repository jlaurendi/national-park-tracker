# Park Tracker

**Live: https://jlaurendi.github.io/national-park-tracker/**

Track your visits to all 63 US national parks — plan trips, set goals, earn badges, and build a photo scrapbook.

Two storage modes, switched automatically by auth state:

- **Signed out (or no Supabase configured):** everything lives in your browser (IndexedDB). No account, no server — the original v1 behavior.
- **Signed in:** data syncs to a Supabase backend (Postgres + Storage) scoped to your account by row-level security. Sign-in is a passwordless email code. On first sign-in, the app offers to move your local data — photos included — into your account.

## Features

- **Visit tracking** — log visits per park with date ranges, 1–5 star ratings, and notes
- **63-park explorer** — searchable, filterable grid (state / region / status) and a static detail page per park with facts and hero imagery
- **Interactive map** — Leaflet + OpenStreetMap, pins color-coded visited / planned / unvisited
- **Trip planning** — group parks into ordered routes with target dates, drawn on a route map with numbered stops
- **Goals** — "all 63", "any N", or specific lists (presets like the Utah Mighty 5), with computed progress and remaining-park chips
- **Badges** — 15 achievements (milestones, state/region completion, themed sets) that earn *and revoke* honestly as visits change
- **Scrapbook** — photos attach to visits; masonry gallery grouped by park, lightbox with caption editing, and a fullscreen autoplay slideshow with park interstitials
- **Settings** — storage usage, persistent-storage protection, JSON export/import, clear-all

## Stack

Next.js (App Router) · React 19 · TypeScript · Tailwind CSS 4 · Zustand 5 · Dexie 4 (IndexedDB) · react-leaflet 5 · lucide-react · sonner · date-fns · Vitest

## Getting started

```bash
npm install
npm run dev      # http://localhost:3000 (local-only mode without Supabase env)
npm test         # domain + dataset unit tests (vitest)
npm run lint
npm run build
```

### Cloud sync in local dev

```bash
npx supabase start        # local Postgres/Auth/Storage in Docker; prints URL + anon key
# put those values in .env.local (see .env.example), restart `npm run dev`
npx supabase stop         # when done
```

Sign-in emails (the 6-digit code) land in Mailpit at http://127.0.0.1:54324. Schema lives in `supabase/migrations/`; `npx supabase db reset` reapplies it.

### Hosted Supabase (production)

1. Create a project, then `npx supabase link --project-ref <ref>` and `npx supabase db push`.
2. Set Auth → URL Configuration: site URL + redirect allow-list to the deployed site.
3. Set repository variables `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` so the Pages deploy builds with cloud sync enabled.

**Email note:** free-tier projects on Supabase's built-in sender can't customize email templates and are limited to a couple of emails per hour — sign-in emails carry a *link* (handled automatically when it opens on the same device). Once a custom SMTP provider (e.g. Resend) is configured, set the Magic Link template to include `{{ .Token }}` (see `supabase/templates/magic_link.html`) and the same email also carries the 6-digit code the dialog accepts — which is what local dev does out of the box.

## How data is stored

| Data | Where |
|---|---|
| Park reference data (63 parks) | Checked into the repo (`src/data/parks.ts`), statically rendered |
| Visits, trips, goals, earned badges, photo metadata | IndexedDB via Dexie |
| Photo images | IndexedDB blob tables — uploads are downscaled to ~2000px JPEG (plus a 400px thumb) before saving, so a typical photo costs a few hundred KB |

Backups (Settings → Export) contain all records as JSON. Photo *image files* are not part of the JSON; on import, photo records whose images aren't present in the browser are skipped with a notice.

## Architecture (why part 2 is cheap)

```
components/  →  store/ (Zustand)  →  lib/repositories (interfaces)  →  Dexie/IndexedDB
                     ↓
             lib/domain (pure functions: badges, goals, status, stats)
```

- UI components never touch persistence; they read the store and call its actions.
- The store persists through `Repositories` interfaces (`lib/repositories/types.ts`). `getRepositories()` is the single construction point — part 2 ships API-backed implementations and changes that one factory.
- Records are born sync-ready: client-generated UUIDs, ISO `createdAt`/`updatedAt`, calendar dates as `'YYYY-MM-DD'` strings, and no browser types in any synced schema.
- Domain logic (badge evaluation, goal progress) is pure TypeScript, unit-tested, and reusable server-side.

### Part 2 roadmap

Accounts (Auth.js/Clerk) · Postgres with tables mirroring `src/types/domain.ts` 1:1 plus `user_id` · route handlers matching the `CrudRepository` shape · photo blobs to S3/R2 (IndexedDB demoted to cache) · Stripe subscription gating · a one-time "import my local data" flow that uploads the existing export bundle.

## Deployment

Pushes to `main` deploy to GitHub Pages via `.github/workflows/deploy.yml` (static export with `NEXT_PUBLIC_BASE_PATH=/national-park-tracker`). Because the site is fully static, all user data still lives in each visitor's own browser. The trip detail page uses `/trips/view?id=…` instead of a dynamic segment because user-generated ids can't be pre-rendered.

## Notes

- Park facts and images are derived from Wikipedia/Wikimedia Commons (public sources); images hotlink to `upload.wikimedia.org` at a pre-rendered 960px width with a local gradient fallback.
- Browser storage is best-effort until the user grants persistence (Settings → Protect); export regularly if the data matters to you.

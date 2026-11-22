# 7even

Music distribution and label management. Artists and labels ship releases to the major
streaming stores, watch streams and revenue per store, and get paid out — all in one
place, built with African markets in mind (Boomplay, Audiomack, mobile-money payouts).

## Stack

| Layer | Choice |
| --- | --- |
| App | Next.js 15 (App Router) + React 19 + TypeScript |
| Styling | Tailwind CSS v4, custom dark/lime theme in `app/globals.css` |
| Auth & DB | Supabase (`@supabase/ssr` cookie sessions, RLS on every table) |
| Deploy | Vercel — project `7even`, production branch on `main` |

## Routes

- `/` — public landing page (hero, how it works, features, pricing)
- `/login` — combined sign-up / sign-in (server actions)
- `/dashboard` — overview: earnings, streams, store split, recent releases
- `/dashboard/releases` and `/dashboard/releases/new` — catalogue and release builder
- `/dashboard/releases/[id]` — tracklist, per-store delivery status, status workflow
- `/dashboard/artists` — roster + add artist
- `/dashboard/earnings` — revenue by store, monthly statements, payout history

## Data model (Supabase, project `sfoussxjeewouexusunw`)

`stores`, `labels`, `label_members`, `profiles`, `artists`, `releases`, `tracks`,
`deliveries`, `earnings`, `payouts`.

- Every table has RLS. Access is scoped through `label_members`; owners and managers can
  write, artists can read.
- Signing up fires `handle_new_user()`, which creates a profile, a label workspace, and
  an `owner` membership automatically — no onboarding step to get stuck on.
- Release status workflow: `draft → in_review → delivered → live → takedown`.
  Marking a release delivered upserts a `deliveries` row per store.

## Local development

```bash
cp .env.example .env.local   # Supabase URL + anon key
npm install
npm run dev                  # http://localhost:3000
```

```bash
npm run typecheck
npm run build
```

## Environment

| Variable | Where |
| --- | --- |
| `NEXT_PUBLIC_SUPABASE_URL` | `.env.local` locally, Vercel project env for deploy |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | same |

The anon key is public by design; all authorisation is enforced by RLS.

## Not built yet

- Audio file and artwork uploads (storage buckets + signed URLs)
- ISRC/UPC generation and store-specific metadata validation
- Real DSP ingestion for statements, and payout disbursement
- Team invitations UI (the `label_members` roles already support it)

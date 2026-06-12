# Play9ja

A full-stack Play-to-Earn gaming platform with a premium Nigerian fintech aesthetic (Opay/PalmPay style). Mobile-first, dark/light mode, glassmorphism, gold gradients, animated balances.

## Run & Operate

- `pnpm --filter @workspace/api-server run dev` — run the API server (port 8080, proxied at /api)
- `pnpm --filter @workspace/play9ja run dev` — run the frontend (port 21200, proxied at /)
- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from the OpenAPI spec
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)
- Required env: `DATABASE_URL`, `SESSION_SECRET`

## Stack

- pnpm workspaces, Node.js 24, TypeScript 5.9
- Frontend: React + Vite, Tailwind CSS, shadcn/ui, Wouter, TanStack Query, next-themes
- API: Express 5
- DB: PostgreSQL + Drizzle ORM
- Validation: Zod (`zod/v4`), `drizzle-zod`
- API codegen: Orval (from OpenAPI spec)
- Auth: JWT (stored as `play9ja_token` in localStorage), bcrypt
- Build: esbuild (CJS bundle)

## Where things live

- `lib/api-spec/openapi.yaml` — OpenAPI contract (source of truth for all endpoints)
- `lib/db/src/schema/` — Drizzle DB schema (users, games, transactions, memberships, etc.)
- `lib/api-client-react/src/generated/api.ts` — Generated React Query hooks
- `artifacts/api-server/src/routes/` — All Express route handlers
- `artifacts/api-server/src/lib/auth.ts` — JWT, bcrypt, requireAuth, requireAdmin middleware
- `artifacts/api-server/src/lib/settings.ts` — Platform settings with DB-backed defaults
- `artifacts/play9ja/src/pages/` — All frontend pages (auth/, main/, admin/)
- `artifacts/play9ja/src/components/layout/MainLayout.tsx` — Fixed bottom nav (6 tabs)

## Architecture decisions

- Contract-first API: OpenAPI spec is written first, then Orval generates hooks + Zod schemas; never edit generated files directly.
- JWT in localStorage: `play9ja_token` key; `setAuthTokenGetter` from `@workspace/api-client-react/src/custom-fetch` is registered in AuthContext to auto-attach Bearer tokens to all API calls.
- Platform settings stored in DB (`platform_settings` table) with in-code defaults so the app works without manual DB seeding.
- Admin routes all require `requireAdmin` middleware which chains `requireAuth` + role check.
- Deposit account is credited manually by admin (proof-of-payment flow); no automated payment gateway.

## Product

- **Auth**: Register (with referral code + welcome bonus), Login, Forgot Password
- **Dashboard**: Wallet balance, membership status, daily missions, live winners feed
- **20 Games**: Spin & Win, Lucky Slots, Wheel of Fortune, Card Flip, Dice Roll, Puzzle, Basketball, Penalty, Quiz, Number Prediction, Bowling, Endless Runner, Snake, Memory Match, Treasure Box, Mystery Box, Tap Challenge, Rocket Crash, Lucky Pick, Daily Jackpot
- **Wallet**: Balance overview (wallet/referral/game), transaction history, deposit flow, withdrawal flow
- **Membership**: Weekly (₦7k), Monthly (₦20k), Yearly (₦50k) plans; proof-of-payment upload; admin approval
- **Referral**: Referral code sharing, milestone bonuses, referral rankings
- **Daily Rewards**: 30-day streak calendar with weekly/monthly bonus days
- **Leaderboard**: Global rankings by rewards earned
- **Notifications**: Personal + broadcast notifications
- **Admin Panel** (`/admin`): Stats dashboard, user management, membership approvals, deposit/withdrawal processing, game settings, broadcast messaging, platform settings

## Default admin account

- Email: `admin@play9ja.com`
- Password: `admin123`

## Deposit account (configurable via Admin > Settings)

- Account Name: Modal Praise Philip Jacob
- Account Number: 7074435901
- Bank: Moniepoint MFB

## User preferences

- Premium Nigerian fintech aesthetic — Opay/PalmPay style
- Mobile-first, no hamburger menu — fixed bottom nav with tabs
- Glassmorphism, gold gradients, smooth animations
- Dark/light mode support

## Gotchas

- Always run codegen after changing `openapi.yaml`: `pnpm --filter @workspace/api-spec run codegen`
- Run `pnpm --filter @workspace/db run push` after changing schema files
- The `@workspace/api-client-react` package.json exports `./src/custom-fetch` and `./src/generated/api.schemas` — these are required by the frontend AuthContext
- Google Fonts `@import url(...)` must come FIRST in `index.css` before other `@import` statements to avoid PostCSS errors

## Pointers

- See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details

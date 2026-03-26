# Workspace

## Overview

pnpm workspace monorepo using TypeScript. Uroflow Tracker — a urology voiding diary web app for patients to log urination events with detailed metrics.

## Stack

- **Monorepo tool**: pnpm workspaces
- **Node.js version**: 24
- **Package manager**: pnpm
- **TypeScript version**: 5.9
- **API framework**: Express 5
- **Database**: PostgreSQL + Drizzle ORM
- **Validation**: Zod (`zod/v4`), `drizzle-zod`
- **API codegen**: Orval (from OpenAPI spec)
- **Build**: esbuild (CJS bundle)
- **Frontend**: React + Vite, React Query, Recharts, Framer Motion, React Hook Form

## Structure

```text
artifacts-monorepo/
├── artifacts/              # Deployable applications
│   ├── api-server/         # Express API server
│   └── uroflow-tracker/    # React + Vite frontend
├── lib/                    # Shared libraries
│   ├── api-spec/           # OpenAPI spec + Orval codegen config
│   ├── api-client-react/   # Generated React Query hooks
│   ├── api-zod/            # Generated Zod schemas from OpenAPI
│   └── db/                 # Drizzle ORM schema + DB connection
├── scripts/                # Utility scripts (single workspace package)
├── pnpm-workspace.yaml     # pnpm workspace
├── tsconfig.base.json      # Shared TS options
├── tsconfig.json           # Root TS project references
└── package.json            # Root package with hoisted devDeps
```

## Features

- **Log Voiding Events**: Volume (ml), duration (seconds), urine color (10 options with visual swatches), cloudiness, blood presence, urgency, pain level (0-10), stream quality, notes
- **Patient Dashboard**: Stats cards for 7-day events, avg volume, avg duration, blood incidents; recent volume trend chart
- **History**: Full list of past events with ability to delete
- **Stats API**: Aggregated statistics for 7-day and 30-day periods

## Database Schema

Table: `voidings`
- `id`, `voided_at`, `volume_ml`, `duration_seconds`, `urine_color`, `cloudiness`, `blood_present`, `urgency`, `pain_level`, `stream`, `notes`, `created_at`

## API Routes

- `GET /api/voidings` — list all voiding records
- `POST /api/voidings` — create new record
- `GET /api/voidings/:id` — get single record
- `DELETE /api/voidings/:id` — delete record
- `GET /api/voidings/stats/summary` — aggregated stats (7d + 30d)

## TypeScript & Composite Projects

Every package extends `tsconfig.base.json` which sets `composite: true`. The root `tsconfig.json` lists all packages as project references.

- **Always typecheck from the root** — run `pnpm run typecheck`
- **`emitDeclarationOnly`** — only emit `.d.ts` files during typecheck
- **Project references** — when package A depends on package B, A's `tsconfig.json` must list B in its `references` array

## Root Scripts

- `pnpm run build` — runs `typecheck` first, then recursively runs `build` in all packages
- `pnpm run typecheck` — runs `tsc --build --emitDeclarationOnly`
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API client + Zod schemas
- `pnpm --filter @workspace/db run push` — push DB schema changes

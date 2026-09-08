# HOA/Condo/Co-op Case Management System — Phase 1

A client-centric case management system for a Florida law firm representing
community associations (HOAs, Condominiums, Cooperatives). Unlike
matter-centric tools (Clio, MyCase), every **Client** (the Association) is
the anchor entity — a long-running institutional relationship that
accumulates many **Matters** across practice areas over years. Phase 1
implements the shared client/contact/matter/deadline/document/billing core
plus one practice area end-to-end: **Collections/Foreclosure**, including
linked Bankruptcy and Eviction ancillary matters.

## Stack

- Next.js 15 (App Router) + TypeScript
- PostgreSQL + Prisma
- Auth.js (NextAuth) credentials, JWT sessions
- Tailwind CSS
- Certified mail / document storage / QuickBooks billing sync: adapter
  interfaces with mock implementations only — no vendor has been chosen
  for any of the three yet (see "Adapters" below)

## Getting started

```bash
cp .env.example .env
# generate a real value for NEXTAUTH_SECRET:
#   openssl rand -base64 32

# Start Postgres — via Docker if available:
docker-compose up -d
# ...or point DATABASE_URL in .env at any local/remote Postgres 16+ instance.

npm install
npm run db:migrate      # creates the schema
npm run db:seed         # seeds an org, one account per role, and demo clients/matters
npm run dev              # http://localhost:3000
```

Seeded accounts (password `DevPassword!123` for all — see `prisma/seed.ts`):

| Email | Role |
|---|---|
| `admin@firm.test` | Admin |
| `attorney@firm.test` | Attorney |
| `paralegal@firm.test` | Paralegal |
| `billing@firm.test` | Billing |
| `readonly@firm.test` | Readonly |

## Project layout

```
src/app/(app)/          Authenticated shell — one app, RBAC gates per action
  clients/               Client 360: Overview / Matters / Contacts / Notes / Documents
  matters/collections/   Collections/Foreclosure: pipeline, owner ledger, firm
                          billing, linked BK/eviction, certified mail, deadlines
  admin/                 ADMIN-only: user management, audit log (keyset paginated)
  search/                Global client/matter search
src/lib/                 db, auth, rbac, audit, numbering, dates
  collections/            Collections pipeline state machine
  certifiedMail/          Certified mail adapter (mock only)
  documentStorage/        Document storage adapter (mock = local disk)
  billing/                Firm billing sync adapter (mock only)
prisma/schema.prisma      Data model
```

## Verifying it end-to-end

1. Sign in as `attorney@firm.test`, open `Clients`, and view **Oak Ridge
   Homeowners Association** — the demo data spans several clients and
   collections matters at different pipeline stages.
2. Open a Collections matter and walk it through the pipeline (Overview
   tab): each forward transition prompts for the data it requires (lien
   book/page, case number, judgment amount, ...). Only Attorney/Admin can
   transition a matter to Closed — try it as `paralegal@firm.test` and
   confirm the option is disabled.
3. Add an Owner Ledger entry and confirm the running balance updates.
4. Send a certified mail notice (mock provider — no real mail is sent) and
   use "Simulate delivery" to mark it delivered.
5. Add a linked Bankruptcy matter from the Linked Matters tab — confirm the
   parent matter flips to "ON HOLD" with a bankruptcy-stay banner, and that
   forward pipeline transitions now require an override checkbox.
6. Upload a document and confirm `readonly@firm.test` can see it listed but
   cannot download it; confirm `billing@firm.test` cannot see the Documents
   or Notes tabs at all.
7. Sign in as `admin@firm.test` and check `/admin/audit-log` — logins,
   views, and mutations from the steps above should all appear, paginated
   without `OFFSET` (keyset pagination on `createdAt`/`id`).

## Adapters — no vendor chosen yet

`CERTIFIED_MAIL_PROVIDER`, `DOCUMENT_STORAGE_PROVIDER`, and
`BILLING_SYNC_PROVIDER` in `.env` all default to `mock`. Each adapter
interface (`src/lib/<name>/types.ts`) is written to what a real vendor
would need; swap in a real implementation behind
`src/lib/<name>/index.ts`'s factory once the firm selects one — nothing
else in the app needs to change. Candidates worth evaluating:

- **Certified mail**: Lob, Simple Certified Mail, PSI.
- **Document storage**: S3-compatible object storage vs. a legal DMS
  (NetDocuments, iManage, SharePoint) if the firm already uses one —
  worth deciding before Phase 2, since a DMS integration shapes the
  adapter differently than a generic object store.
- **Billing sync**: QuickBooks Online (OAuth app registration required).

## Known gaps for Phase 2+

- Only Collections/Foreclosure is built out. Covenant Enforcement, General
  Corporate Governance, General Litigation, and Claims Monitoring are not
  designed yet — the `Matter`/`PracticeArea` model is deliberately
  extensible (typed 1:1 detail tables) so each is a new model + migration,
  not a rewrite.
- MFA fields exist on `User` but enrollment/enforcement is not built —
  deferred by explicit decision for Phase 1.
- E-signature and Florida court e-filing integrations are out of scope for
  Phase 1.
- Florida lien/foreclosure statutory waiting periods are not hard-blocked
  in the pipeline (they vary by governing docs and would go stale if
  hardcoded) — surfaced as a firm process concern, not a code gap.
- No automated tests yet. Given the financial/legal-deadline data this
  system holds, adding coverage for the Collections state machine and the
  RBAC matrix should be an early Phase 2 priority.
- No production deployment/hosting has been set up — this has only been
  run locally.

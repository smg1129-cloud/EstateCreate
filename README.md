# EstateCreate — Automated Florida Estate Planning

A web application where a client creates an account, answers a guided
questionnaire, and receives a complete set of Florida estate-planning
documents that are **assembled by a deterministic, coded document engine
(not an LLM)** and then **reviewed and approved by a licensed attorney**
before they can be downloaded or signed.

**Before this prepares a real client's plan, read
[COMPLIANCE.md](./COMPLIANCE.md).** The code implements the technical
workflow (account control, audit logging, MFA, consent capture, the
document engine, and the attorney-review gate) but the unauthorized
practice of law, malpractice exposure, and execution formalities are
addressed by qualified people and processes, not by source code alone.

## What it does

1. **Client registers** and accepts the engagement / electronic-records terms.
2. **Triage questionnaire** identifies the appropriate plan — will-based or
   trust-based — from the client's goals and situation.
3. **Estate & asset questionnaire** captures family, assets, fiduciaries,
   distribution wishes, incapacity preferences, and health-care wishes
   (a generation-focused distillation of the firm's full FL client
   questionnaire).
4. **The engine assembles documents deterministically** from a fixed clause
   library and attaches attorney-facing issue-spotting flags drawn from the
   firm's 36-module attorney checklist (with statutory anchors).
5. **An attorney reviews** each document, sees the flags, and
   approves / requests changes / rejects. Nothing is released or signable
   until an attorney has **approved that exact version**.
6. **Execution** by e-signature / remote online notarization through an
   adapter (mock by default), with Florida-specific execution instructions.

## Documents in the suite

Last Will & Testament · Revocable Living Trust + Pour-Over Will · Durable
Power of Attorney · Designation of Health Care Surrogate · Living Will ·
HIPAA Authorization · Special Needs Trust · Personal Property Memorandum ·
Pre-Need Guardian Designation. The set for a given client is chosen
automatically by the rules engine.

## The document engine (no AI)

```
questionnaire answers
      │  buildContext()            src/lib/documents/context.ts
      ▼
  IntakeContext (typed)
      │  recommendDocuments()      src/lib/documents/rules.ts  → doc set + flags
      ▼
  generators (one per doc type)    src/lib/documents/generators/*
      │  → DocumentModel (blocks)  src/lib/documents/blocks.ts
      ▼
  renderers                        src/lib/documents/render/{html,docx,pdf}.ts
      ▼
  HTML preview · DOCX (editable) · PDF (print/sign)
```

A generator is ordinary TypeScript mapping a typed context to an ordered
list of blocks using fixed clause language. For a given input it always
produces the same output — the document is reproducible and diffable, and
its content is hashed so a regeneration that changes nothing an attorney
already approved can be detected.

## Stack

- Next.js 14 (App Router) + TypeScript
- PostgreSQL + Prisma
- Auth.js (NextAuth): email/password + TOTP MFA for staff; optional social
  login (Google / Microsoft / Apple / Facebook) for clients — see
  [docs/ops/auth-providers.md](./docs/ops/auth-providers.md)
- Tailwind CSS
- `docx` (Word output) and `pdfkit` (PDF output) — deterministic, pure JS
- E-sign / RON: adapter interface with a mock implementation by default

## Getting started

```bash
cp .env.example .env
# generate real values for NEXTAUTH_SECRET and FIELD_ENCRYPTION_KEY:
#   openssl rand -base64 32

docker-compose up -d          # local Postgres
npm install
npm run db:migrate            # create the schema
npm run db:seed               # firm, staff, and one demo client with generated docs
npm run dev                   # http://localhost:3000
```

Seeded accounts (password `DevPassword!123`):

| Email | Role |
|---|---|
| `admin@estatecreate.test` | Admin |
| `attorney@estatecreate.test` | Attorney |
| `paralegal@estatecreate.test` | Paralegal |
| `client@estatecreate.test` | Client |

Staff accounts must complete MFA enrollment (`/mfa/setup`) on first login.

## Verifying it end-to-end

1. **As a new client:** register at `/register`, complete the two
   questionnaires; on submitting the second, your documents are generated
   and appear under **My Documents** as "In attorney review."
2. **As the attorney** (`attorney@estatecreate.test`, then enroll MFA):
   open the **Review queue**, open the seeded matter, read the plan
   recommendation and issue-spotting notes, open a document, preview it,
   and **Approve** it (or request changes with a note).
3. **Back as the client:** the approved document can now be downloaded
   (PDF/Word) and sent for signing (mock RON completes the loop).
4. **As admin** (`admin@estatecreate.test`): check **Audit log** — intake,
   generation, review decisions, downloads, and signing all appear.

## Deploying to your own server

To run EstateCreate on an Ubuntu box — including reaching a box that isn't on
your current network (Tailscale), and a production install behind Nginx + TLS
with systemd — see **[DEPLOY.md](./DEPLOY.md)**.

## Project layout

```
src/app/(marketing)/     Public site + legal/disclaimers
src/app/register,login   Client sign-up and sign-in
src/app/portal/          Client portal (intake, documents, signing)
src/app/attorney/        Attorney/paralegal review workspace
src/app/admin/           Users + audit log
src/lib/questionnaire/   Questionnaire definitions + engine (types, visibility)
src/lib/documents/       The document engine: context, rules, generators, renderers
src/lib/matters/         Service layer (DB + storage + audit + e-sign)
src/lib/{esign,storage}/ Adapter interfaces (mock implementations)
prisma/schema.prisma     Data model
```

## Switching adapters to real vendors

- `DOC_STORAGE_PROVIDER=s3` (implement the S3 adapter) for encrypted object
  storage of rendered documents.
- `ESIGN_PROVIDER=…` for a Florida-registered remote online notarization
  platform. Florida RON and electronic wills carry strict statutory
  requirements — see COMPLIANCE.md and confirm the vendor and workflow
  before any real document is executed.

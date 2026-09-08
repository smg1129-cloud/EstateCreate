# Meridian Health — Telehealth Clinic Platform

A telehealth clinic website with an integrated CRM (leads, patient
directory, communications) and ERM/EHR (clinical charts, notes,
prescriptions) portal, built with a HIPAA-conscious architecture.

**Before this handles a real patient, read [COMPLIANCE.md](./COMPLIANCE.md).**
This codebase implements the technical safeguards (access control, audit
logging, MFA, consent capture, licensure checks, encryption) but legal
compliance also requires signed BAAs, a formal Security Risk Assessment,
and legal review — none of which code alone can provide.

## Stack

- Next.js 14 (App Router) + TypeScript
- PostgreSQL + Prisma
- Auth.js (NextAuth) credentials + TOTP MFA
- Tailwind CSS
- Video: Daily.co adapter (mock adapter by default)
- Payments: Stripe adapter (mock adapter by default)
- E-prescribing: adapter interface only, mock implementation (see
  COMPLIANCE.md — real e-prescribing requires a certified vendor)

## Getting started

```bash
cp .env.example .env
# generate real values for NEXTAUTH_SECRET and FIELD_ENCRYPTION_KEY:
#   openssl rand -base64 32

docker-compose up -d          # starts local Postgres
npm install
npm run db:migrate            # creates the schema
npm run db:seed               # seeds a sample org, users, and one appointment
npm run dev                   # http://localhost:3000
```

Seeded accounts (password `DevPassword!123` for all — see
`prisma/seed.ts`):

| Email | Role |
|---|---|
| `admin@meridianhealth.test` | Admin |
| `staff@meridianhealth.test` | Staff |
| `clinician@meridianhealth.test` | Clinician |
| `patient@meridianhealth.test` | Patient |

Staff/clinician/admin accounts must complete MFA enrollment (`/mfa/setup`)
on first login before they can reach any other screen.

## Project layout

```
src/app/(marketing)/    Public site + booking/intake flow
src/app/portal/         Patient portal (appointments, records, billing, messages)
src/app/staff/          Staff CRM (leads, patient directory, tasks)
src/app/clinician/      Clinician dashboard + ERM/EHR (charts, notes, prescriptions)
src/app/admin/          User management, provider license tracking, audit log
src/lib/                Auth, RBAC, audit logging, encryption, and vendor adapters
prisma/schema.prisma    Data model
```

## Verifying it end-to-end

1. As an anonymous visitor, go through `/book` — pick a state with license
   coverage (seed data covers CA and TX), choose a provider and time,
   fill in patient info, and accept the consent checkboxes.
2. Sign in as `patient@meridianhealth.test` and check `/portal` —
   appointment, billing (Pay Now works with the mock payment adapter),
   messages, profile.
3. Sign in as `clinician@meridianhealth.test` (completes MFA enrollment on
   first login), open the seeded patient's chart from `/clinician`, add a
   SOAP note, a medication, and a prescription, then start the visit
   (mock video — shows your camera locally).
4. Sign in as `staff@meridianhealth.test` and confirm `/staff/leads` and
   `/staff/patients` load, and that clinical content is *not* visible
   there.
5. Sign in as `admin@meridianhealth.test` and check `/admin/audit-log` —
   the chart view and note/medication/prescription creation from step 3
   should all appear.

## Switching adapters to real vendors

Set the relevant `*_PROVIDER` env var and fill in credentials:
- `VIDEO_PROVIDER=daily` + `DAILY_API_KEY`
- `PAYMENTS_PROVIDER=stripe` + `STRIPE_SECRET_KEY` / `STRIPE_WEBHOOK_SECRET`
- `PRESCRIBING_PROVIDER` has no real option yet — see COMPLIANCE.md.

Confirm a BAA is signed with each vendor before pointing them at real
patient data.

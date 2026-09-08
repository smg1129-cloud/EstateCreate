# Compliance Status

This document tracks what's implemented in code versus what requires
operational or legal action before this platform can handle a real
patient's data. It is not legal advice, and it does not make this
application HIPAA-compliant by itself — compliance is an organizational
posture (policies, training, contracts, audits), not a property of source
code.

## What's implemented in code

- **Access control**: role-based access (`src/lib/rbac.ts`) enforced at
  both the route level (`src/middleware.ts`) and the data-access level
  (every clinical query goes through an RBAC check first). CRM (leads,
  communications) and ERM (clinical notes, medications, diagnoses,
  prescriptions) are scoped to different roles — staff cannot read clinical
  content; clinicians only see patients they have an appointment
  relationship with.
- **Audit logging**: `src/lib/audit.ts` writes an append-only `AuditLog`
  row for every login, PHI view, and PHI mutation. Nothing in the app
  updates or deletes audit rows. Viewable at `/admin/audit-log`.
- **Authentication**: bcrypt-hashed passwords, mandatory TOTP MFA for
  staff/clinician/admin roles (`src/lib/auth.ts`, `/mfa/setup`), short
  role-aware idle-session timeout enforced in `src/middleware.ts`.
- **Consent capture**: privacy notice, telehealth consent, terms of
  service, and financial responsibility acknowledgments are recorded with
  a version and timestamp before any clinical activity
  (`ConsentRecord` in `prisma/schema.prisma`).
- **Licensure enforcement**: the booking flow (`src/app/(marketing)/book`)
  only offers providers holding an active, unexpired license in the
  patient's stated state, and re-validates that server-side at submission
  time, not just in the UI.
- **Encryption in transit**: HSTS and related security headers on every
  response (`next.config.js`).
- **Field-level encryption**: MFA secrets are encrypted at the application
  layer before storage (`src/lib/encryption.ts`), in addition to whatever
  storage-level encryption the hosting environment provides.
- **PCI scope reduction**: payments go through Stripe Checkout — this
  server never receives raw card numbers (`src/lib/payments`).
- **No self-built e-prescribing transmission**: `src/lib/prescribing` is an
  adapter interface with a mock implementation only. See below.

## What is NOT implemented — and can't be, from code alone

### 1. Business Associate Agreements (BAAs)
Before any real PHI flows through this system, a signed BAA is required
with every vendor that could touch it: the cloud host (AWS), the video
vendor (Daily.co, if used), the payment processor (Stripe, if used for
anything beyond payment-only data), and any e-prescribing vendor. No BAA
is in place today — this is a contract, not a config flag.

### 2. HIPAA Security Risk Assessment
A formal, documented risk assessment (45 CFR §164.308(a)(1)) covering the
actual production infrastructure, workforce access, and physical
safeguards has not been performed. This needs to happen before go-live and
periodically thereafter.

### 3. E-prescribing
`src/lib/prescribing` only ships a mock adapter. Real e-prescribing —
especially of controlled substances (EPCS, 21 CFR Part 1311) — requires
integrating a DEA-audited, certified third-party vendor (e.g. DoseSpot,
NewCrop). This cannot be self-built or self-certified. Do not enable
prescribing for real patients until that integration exists and the
vendor's certification covers your use case.

### 4. State-by-state telehealth practice law
Provider licensure is tracked and enforced technically (`ProviderLicense`
model, booking-flow check), but the underlying legal questions — informed
consent requirements, prescribing limits, corporate practice of medicine
restrictions, cross-state coverage rules — vary by state and need review
by healthcare counsel licensed in each state you operate in.

### 5. Notice of Privacy Practices / Terms of Service
The `/privacy` and `/terms` pages contain clearly-marked placeholder text.
They must be drafted or reviewed by counsel before a real patient signs
them.

### 6. Breach notification procedure
The audit log gives you the data needed to investigate a suspected
breach, but there is no automated breach-detection or the required
notification workflow (45 CFR §164.400 et seq.) implemented — that's a
procedural/operational commitment, not a feature to toggle on.

### 7. Workforce training, physical safeguards, device policy
Entirely outside the codebase: who is trained on PHI handling, how
workstations are secured, mobile device policy, sanctions policy for
violations, etc.

### 8. Data retention and disposal policy
Clinical records are never hard-deleted in this schema (by design — see
comments in `prisma/schema.prisma`), but the actual retention period
(commonly 6–10 years, longer for minors, and state-dependent) and secure
disposal procedure need to be defined with counsel and then encoded
operationally (backup lifecycle, RDS snapshot retention, etc.).

### 9. Accessibility audit
Pages are built with semantic HTML and visible focus states as a
starting point, but no formal WCAG 2.1 AA audit has been performed.

## Before this touches a real patient

At minimum: signed BAAs with every PHI-touching vendor → HIPAA Security
Risk Assessment → legal review of consent/ToS/privacy copy and
state-specific telehealth rules → a contracted certified e-prescribing
vendor (if prescribing is in scope) → workforce policies and training →
accessibility audit → penetration test / security review of the deployed
(not just local) environment.

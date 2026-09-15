# Compliance & Practice Status

This document tracks what EstateCreate implements in code versus what
requires professional judgment, firm policy, or legal/operational action
before it prepares a real client's estate plan. It is not legal advice, and
running this software does not by itself make the service compliant —
compliance here is an organizational and professional-responsibility
posture, not a property of source code.

## What's implemented in code

- **Deterministic document assembly (no LLM).** Documents are built by a
  coded engine (`src/lib/documents`) from a fixed clause library. For a
  given set of answers the output is identical every time, is stored as a
  structured model, is content-hashed, and is fully reproducible and
  diffable. No generative AI is used to draft legal documents.
- **Attorney-review gate.** A generated document cannot be downloaded by the
  client or sent for signature until an **attorney** has approved that exact
  version. This is enforced in the data-access/service layer
  (`src/lib/matters/service.ts`, `src/lib/rbac.ts`), not just hidden in the
  UI. Paralegals may prepare and request changes but cannot approve.
- **Issue-spotting.** The rules engine (`src/lib/documents/rules.ts`)
  attaches attorney-facing flags derived from the firm's 36-module attorney
  checklist (elective share, homestead devise restrictions, non-citizen
  spouse/QDOT, ancillary probate, prior-marriage obligations, PR
  qualification, special-needs eligibility, and more), each with a statutory
  anchor. Flags are shown only to the reviewing attorney, never the client.
- **Access control.** Role-based access (CLIENT / PARALEGAL / ATTORNEY /
  ADMIN) enforced at the route level (`src/middleware.ts`) and the
  data-access level (every matter/document read goes through an RBAC check).
  Clients can see only their own matter.
- **Audit logging.** `src/lib/audit.ts` writes an append-only `AuditLog` row
  for logins, consent, intake submission, generation, each review decision,
  downloads, and signing. Nothing in the app updates or deletes audit rows.
- **Authentication.** bcrypt-hashed passwords; mandatory TOTP MFA for staff
  roles; short, role-aware idle-session timeout in middleware.
- **Consent capture.** Terms, privacy, and electronic-records (E-SIGN/UETA)
  consents are recorded with a version and timestamp at registration
  (`ConsentRecord`), append-only.
- **Field encryption.** Especially sensitive fields (MFA secrets) are
  encrypted at the application layer (`src/lib/encryption.ts`) on top of
  storage-level encryption.
- **Execution requirements surfaced.** Each document carries its Florida
  execution requirements (witnesses, notary) and step-by-step instructions.

## What code alone does NOT provide

- **The practice of law / UPL.** An attorney-review gate exists, but the
  firm must ensure a licensed Florida attorney genuinely reviews each plan,
  that the engagement scope is clear, and that the automated intake does not
  cross into unauthorized practice. Engagement letters, conflict checks, and
  capacity/undue-influence screening (attorney-checklist Modules 1–2) are
  professional steps, not code.
- **Legal accuracy for the specific client.** The clause library reflects
  Florida and federal law as of the engine version and must be reviewed and
  kept current by an attorney. Statutory citations in the flags are research
  anchors, not substitutes for research. Verify every citation and dollar
  figure (e.g. the federal basic exclusion and summary-administration
  threshold) against the current statute.
- **Valid execution.** A document is not effective until executed with the
  required Florida formalities. Remote online notarization
  (Fla. Stat. 117.201 et seq.) and electronic wills
  (Fla. Stat. 732.521–.525, incl. qualified-custodian and vulnerable-adult
  rules) impose strict requirements; the RON vendor and workflow must be
  confirmed before any real execution. The mock adapter must never be used
  for a real document.
- **Trust funding.** A revocable trust does nothing until funded. Retitling
  deeds and updating beneficiary designations is a legal/operational step
  that must be scoped and performed — the engine flags it but cannot do it.
- **Data protection posture.** This database holds privileged client
  information. Production requires encryption at rest under an appropriate
  agreement, secure secret management (KMS rather than plain env vars),
  backups, and a records-retention policy with legal sign-off.
- **Multi-state / edge cases.** The engine targets Florida-domiciled
  clients. Out-of-state property, non-citizen status, community-property
  history, and similar issues are flagged for the attorney but require
  individualized handling.
- **Fee handling and trust accounting.** The app charges a per-document flat
  fee *before* documents are generated and reviewed (generation is gated on
  payment). Collecting a fee in advance implicates the Rules Regulating The
  Florida Bar — the reasonableness and flat-fee requirements of Rule 4-1.5
  (including any "earned on receipt"/nonrefundable characterization and the
  required disclosures) and the trust-accounting rules of Rule 5-1.1
  (unearned fees generally belong in trust/IOLTA, not operating). The code
  records payments, the paid-for set, and supports refunds, but **whether a
  fee is earned when charged, where the funds are held, and the refund policy
  are decisions a Florida attorney must make and disclose** — they are not set
  by the software. Set real fees in Admin → Pricing; the seed's prices are
  placeholders.

## Adapters that are stubs

- **E-signature / RON** (`src/lib/esign`): interface + mock only. No real
  provider is wired.
- **Document storage** (`src/lib/storage`): local filesystem adapter for
  development; an encrypted object-store (S3 + SSE-KMS) adapter is required
  for production.
- **Payments** (`src/lib/payments`): interface + mock only. The mock adapter
  simulates a hosted checkout and moves no money. Wire a real processor
  (Stripe, LawPay, etc.) behind the `PaymentAdapter` interface, with the
  trust-accounting posture above resolved, before taking real payments.

# Security Architecture

Summary of the technical safeguards implemented in this codebase. For what
this does and doesn't mean for legal compliance, see `COMPLIANCE.md`.

## Authentication & session management

- Passwords hashed with bcrypt (cost factor 12) — `src/lib/auth.ts`.
- TOTP-based MFA mandatory for ATTORNEY/PARALEGAL/ADMIN roles, optional for
  CLIENT. Enforced in `src/middleware.ts`: a session flagged
  `requiresMfaSetup` cannot reach any route except `/mfa/setup`.
- Session cookie is a signed JWT (`next-auth`), hard-capped at 12 hours.
  A shorter, role-aware **idle** timeout (default 15 min for staff roles,
  30 min for clients — `SESSION_IDLE_TIMEOUT_MINUTES` in `.env`) is enforced
  independently in `src/middleware.ts` on every request.
- Generic failure messages on login (don't reveal whether the email or the
  password was wrong); failed attempts and successful logins are both
  audit-logged.

## Access control

- `src/lib/rbac.ts` is the single source of truth for who can do what.
  Route-level enforcement in `src/middleware.ts`; data-access-level
  enforcement inside every server action / route handler that touches a
  matter or document (never relies on the UI alone).
- A client can access only their own matter; staff are scoped to their
  organization. Only an **attorney** can approve a document or send it for
  signature (`canApproveDocuments`); paralegals may prepare and request
  changes; clients never approve their own documents.
- Document download is gated: a client may download only an APPROVED or
  EXECUTED document (`src/app/api/documents/[documentId]/route.ts`).

## Audit logging

- `src/lib/audit.ts` — append-only `AuditLog` table. Every login, consent,
  intake submission, generation, review decision, download, and signing
  event is recorded with actor, action, entity, and timestamp. Viewable at
  `/admin/audit-log`. Nothing in the app updates or deletes these rows.

## Data protection

- TLS/HSTS and standard security headers on every response
  (`next.config.js`): HSTS, X-Frame-Options: DENY, X-Content-Type-Options,
  Referrer-Policy, restrictive Permissions-Policy, `Cache-Control: no-store`
  by default.
- MFA secrets encrypted at the application layer (AES-256-GCM,
  `src/lib/encryption.ts`) before storage, independent of whatever
  encryption-at-rest the database/storage layer provides.
- Rendered documents (which contain privileged content) are never stored in
  the database — only storage keys are. Bytes go through the storage adapter
  (`src/lib/storage`); the local dev adapter writes to git-ignored `.data/`.
- All server-side input validated with `zod` schemas before touching the
  database.

## Third-party data flow

Everything that could carry privileged information to a third party is
behind an adapter interface with a mock default, so nothing talks to a real
external vendor unless explicitly configured via environment variables:
- `src/lib/esign` — e-signature / remote online notarization (mock only)
- `src/lib/storage` — rendered-document storage (local; S3 in production)

## Known gaps / next steps for a production deployment

- Rate limiting on authentication endpoints is not implemented.
- No automated dependency/vulnerability scanning is wired into this repo
  yet (add one, e.g. `npm audit` in CI, before shipping).
- No CSP (Content-Security-Policy) header is set — add one before production.
- No penetration test has been performed.
- Backups, key management (move `FIELD_ENCRYPTION_KEY` to a real KMS),
  encrypted object storage for documents, and infrastructure hardening are
  deployment-time concerns not covered by this repo.

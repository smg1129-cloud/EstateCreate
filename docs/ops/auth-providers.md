# Social login (OAuth) setup

EstateCreate offers **Google, Microsoft, Apple, and Facebook** sign-in
alongside email + password. This is for **clients only** — firm staff
(attorney / paralegal / admin) always sign in with email, password, and a
TOTP authenticator code, and a social sign-in that resolves to a staff email
is refused.

Each provider is **independent and optional**. A provider's button appears on
`/login` and `/register` only when its credentials are present in the
environment, so you can enable exactly the ones you've registered app
credentials for. No code change is needed to add or drop a provider — just set
(or clear) its env vars and restart.

## How it works (so the setup makes sense)

- Session strategy is **JWT** (required by the credentials/TOTP flow), and
  there is **no database adapter**. Accounts are provisioned in the NextAuth
  `signIn` / `jwt` callbacks (`src/lib/auth.ts`,
  `src/lib/auth/oauthUser.ts`).
- On a first social sign-in we **match by verified email**. If no user has
  that email, we create a `CLIENT` (with its matter and the same signup
  consents the registration form records) and link the provider. If the email
  already belongs to a client, we link the new provider to that account. If it
  belongs to staff, we refuse (`?error=staff_oauth`).
- Clicking a social button on the login/register page carries the same
  clickwrap acknowledgment (Terms, Privacy, E-SIGN/UETA) shown there.

## The one URL every provider needs

Set each provider's **redirect / callback URL** to:

```
{NEXTAUTH_URL}/api/auth/callback/<provider>
```

With `NEXTAUTH_URL=https://estate.grocloud.one`:

| Provider  | Callback URL |
|-----------|--------------|
| Google    | `https://estate.grocloud.one/api/auth/callback/google` |
| Microsoft | `https://estate.grocloud.one/api/auth/callback/azure-ad` |
| Apple     | `https://estate.grocloud.one/api/auth/callback/apple` |
| Facebook  | `https://estate.grocloud.one/api/auth/callback/facebook` |

For local dev, use the same paths under `http://localhost:3000`. Providers
allow multiple redirect URIs, so you can register both.

All secrets go in `.env` (git-ignored) — see `.env.example` for the full list.

## Google

1. [Google Cloud Console](https://console.cloud.google.com/) → create/select a
   project → **APIs & Services → OAuth consent screen**. Configure it
   (External), add the app name, support email, and your domain to
   **Authorized domains**.
2. **APIs & Services → Credentials → Create credentials → OAuth client ID →
   Web application**.
3. Under **Authorized redirect URIs** add the Google callback URL above.
4. Copy the client ID and secret into:
   ```
   GOOGLE_CLIENT_ID=...
   GOOGLE_CLIENT_SECRET=...
   ```

## Microsoft (Entra ID / Azure AD)

1. [Entra admin center](https://entra.microsoft.com/) → **App registrations →
   New registration**.
2. **Supported account types:** choose "Accounts in any organizational
   directory and personal Microsoft accounts" for the widest reach (this maps
   to `AZURE_AD_TENANT_ID=common`). To restrict to one organization, pick
   single-tenant and set `AZURE_AD_TENANT_ID` to that directory (tenant) id.
3. **Redirect URI:** platform **Web**, value = the azure-ad callback URL above.
4. **Certificates & secrets → New client secret**; copy the secret **value**
   (not the id).
5. Set:
   ```
   AZURE_AD_CLIENT_ID=<Application (client) ID>
   AZURE_AD_CLIENT_SECRET=<secret value>
   AZURE_AD_TENANT_ID=common   # or your tenant id
   ```

## Apple (Sign in with Apple)

Apple is the fiddly one: the OAuth "client secret" is a short-lived **ES256
JWT** you sign with a downloaded key. We mint it at runtime from the pieces
below (`src/lib/oauth/appleSecret.ts`), so you don't paste a static secret.

1. [Apple Developer](https://developer.apple.com/account/) → **Certificates,
   IDs & Profiles**.
2. **Identifiers → App ID** (or use an existing one) with **Sign in with
   Apple** enabled.
3. **Identifiers → Services IDs → +** — create a Services ID (e.g.
   `com.yourfirm.estatecreate.web`). This value is your **`APPLE_CLIENT_ID`**.
   Enable **Sign in with Apple**, click **Configure**, add your domain and the
   Apple **Return URL** (the apple callback URL above).
4. **Keys → +** — create a key with **Sign in with Apple** enabled, download
   the `.p8` (you can only download it once). Note its **Key ID**.
5. Find your 10-character **Team ID** (top-right of the developer portal).
6. Set:
   ```
   APPLE_CLIENT_ID=com.yourfirm.estatecreate.web   # the Services ID
   APPLE_TEAM_ID=XXXXXXXXXX
   APPLE_KEY_ID=YYYYYYYYYY
   APPLE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----"
   ```
   The `.p8` contents can be on one line with literal `\n` between lines, or
   real newlines. The minted secret is valid ~180 days (Apple's max is 6
   months) and a fresh one is generated on each app start, so restart within
   that window — or set `APPLE_CLIENT_SECRET` to a pre-generated JWT.

> **HTTPS + real domain required.** Apple will not accept `localhost`; test
> Apple against the deployed `https://estate.grocloud.one`, not local dev.

## Facebook

1. [Meta for Developers](https://developers.facebook.com/) → **My Apps →
   Create App** (Consumer / "Authenticate and request data from users").
2. Add the **Facebook Login** product.
3. **Facebook Login → Settings → Valid OAuth Redirect URIs:** add the facebook
   callback URL above.
4. **Settings → Basic:** copy the App ID and App Secret into:
   ```
   FACEBOOK_CLIENT_ID=...
   FACEBOOK_CLIENT_SECRET=...
   ```
5. Facebook only returns an email when the app is in **Live** mode and the
   `email` permission is granted; keep the app in development only while
   testing with listed test users.

## After setting env vars

The schema gained a nullable `passwordHash` plus `image` and `authProviders`
columns, so apply the schema change on the box before the new build runs:

```bash
npm run db:generate           # regenerate the Prisma client
npx prisma db push            # apply the column changes (no data loss)
sudo systemctl restart estatecreate   # pick up new env + build
```

Then load `/login` — each configured provider shows its button above the
email/password form. A provider you didn't configure simply won't appear.

## Troubleshooting

- **Button missing** → its two env vars aren't both set, or the server wasn't
  restarted after setting them.
- **`redirect_uri_mismatch` / "invalid redirect"** → the callback URL in the
  provider console must match `{NEXTAUTH_URL}/api/auth/callback/<provider>`
  exactly, including scheme and trailing path. Confirm `NEXTAUTH_URL` is the
  public HTTPS origin, not `localhost`.
- **Signed in but bounced with `?error=staff_oauth`** → that email belongs to a
  staff account; staff use password + TOTP by design.
- **`?error=OAuthAccountNotLinked`** → expected NextAuth safety when the same
  email arrives from a method the account isn't linked to; sign in with the
  original method.
- **Apple fails locally** → use the deployed HTTPS domain (see note above).

import type { NextAuthOptions } from 'next-auth'
import GoogleProvider from 'next-auth/providers/google'
import AppleProvider from 'next-auth/providers/apple'
import AzureADProvider from 'next-auth/providers/azure-ad'
import FacebookProvider from 'next-auth/providers/facebook'
import { generateAppleClientSecret } from './appleSecret'

/**
 * Social login providers, each gated on its credentials being present in the
 * environment. A provider with no configured client id/secret is simply not
 * offered — its button never renders (the login UI reads getProviders()), and
 * NextAuth has no half-configured provider to error on. This lets an operator
 * turn on exactly the providers they've registered app credentials for.
 *
 * These providers are for CLIENTS only. Staff (attorney/paralegal/admin) keep
 * email + password + TOTP; the signIn callback in src/lib/auth.ts refuses a
 * social sign-in that resolves to a staff account.
 */
export function buildOAuthProviders(): NonNullable<NextAuthOptions['providers']> {
  const providers: NonNullable<NextAuthOptions['providers']> = []

  if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) {
    providers.push(
      GoogleProvider({
        clientId: process.env.GOOGLE_CLIENT_ID,
        clientSecret: process.env.GOOGLE_CLIENT_SECRET,
        // Force account chooser so a shared machine doesn't silently reuse a session.
        authorization: { params: { prompt: 'select_account' } },
      }),
    )
  }

  if (process.env.AZURE_AD_CLIENT_ID && process.env.AZURE_AD_CLIENT_SECRET) {
    providers.push(
      AzureADProvider({
        clientId: process.env.AZURE_AD_CLIENT_ID,
        clientSecret: process.env.AZURE_AD_CLIENT_SECRET,
        // "common" allows both work/school (Entra ID) and personal Microsoft
        // accounts. Override with a specific directory (tenant) id to restrict.
        tenantId: process.env.AZURE_AD_TENANT_ID || 'common',
      }),
    )
  }

  const appleSecret = generateAppleClientSecret()
  if (process.env.APPLE_CLIENT_ID && appleSecret) {
    providers.push(
      AppleProvider({
        clientId: process.env.APPLE_CLIENT_ID,
        clientSecret: appleSecret,
      }),
    )
  }

  if (process.env.FACEBOOK_CLIENT_ID && process.env.FACEBOOK_CLIENT_SECRET) {
    providers.push(
      FacebookProvider({
        clientId: process.env.FACEBOOK_CLIENT_ID,
        clientSecret: process.env.FACEBOOK_CLIENT_SECRET,
      }),
    )
  }

  return providers
}

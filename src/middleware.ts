import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { getToken, encode } from 'next-auth/jwt'
import { idleTimeoutMinutesFor } from '@/lib/rbac'
import type { Role } from '@prisma/client'

const secret = process.env.NEXTAUTH_SECRET
const COOKIE_NAME =
  process.env.NODE_ENV === 'production' ? '__Secure-next-auth.session-token' : 'next-auth.session-token'

const ROLE_PREFIXES: Record<string, Role[]> = {
  '/portal': ['PATIENT'],
  '/staff': ['STAFF', 'ADMIN'],
  '/clinician': ['CLINICIAN'],
  '/admin': ['ADMIN'],
}

function roleHomeFor(role: Role): string {
  switch (role) {
    case 'PATIENT':
      return '/portal'
    case 'STAFF':
      return '/staff'
    case 'CLINICIAN':
      return '/clinician'
    case 'ADMIN':
      return '/admin'
  }
}

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl
  const token = await getToken({ req, secret })

  if (!token) {
    const loginUrl = new URL('/login', req.url)
    loginUrl.searchParams.set('callbackUrl', pathname)
    return NextResponse.redirect(loginUrl)
  }

  // Roles that must enroll MFA are blocked from everything else until they do.
  if (token.requiresMfaSetup && pathname !== '/mfa/setup') {
    return NextResponse.redirect(new URL('/mfa/setup', req.url))
  }

  // Idle-session timeout — enforced here on every protected request rather
  // than relying solely on the JWT's overall maxAge, since clinical/staff
  // roles need a much shorter idle window than the session's hard cap.
  const idleLimitMs = idleTimeoutMinutesFor(token.role) * 60 * 1000
  const lastActivity = token.lastActivity ?? 0
  if (Date.now() - lastActivity > idleLimitMs) {
    const timeoutUrl = new URL('/login', req.url)
    timeoutUrl.searchParams.set('reason', 'timeout')
    const res = NextResponse.redirect(timeoutUrl)
    res.cookies.delete(COOKIE_NAME)
    return res
  }

  // Role-based path restriction: a role can only reach its own section.
  for (const [prefix, allowedRoles] of Object.entries(ROLE_PREFIXES)) {
    if (pathname.startsWith(prefix) && !allowedRoles.includes(token.role)) {
      return NextResponse.redirect(new URL(roleHomeFor(token.role), req.url))
    }
  }

  // Refresh the idle-activity clock on the session cookie for this request.
  // encode() sets exp = now + maxAge, defaulting maxAge to 30 days if not
  // passed explicitly — so we must compute the *remaining* time until the
  // token's original absolute expiry and pass that, otherwise re-signing
  // the cookie on every request would silently override the 12-hour hard
  // cap configured in src/lib/auth.ts with encode()'s 30-day default.
  const nowSeconds = Math.floor(Date.now() / 1000)
  const remainingMaxAge = Math.max(1, (token.exp ?? nowSeconds) - nowSeconds)
  const refreshedToken = { ...token, lastActivity: Date.now() }
  const newCookieValue = await encode({ token: refreshedToken, secret: secret as string, maxAge: remainingMaxAge })

  const res = NextResponse.next()
  res.cookies.set(COOKIE_NAME, newCookieValue, {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
  })
  return res
}

export const config = {
  matcher: ['/portal/:path*', '/staff/:path*', '/clinician/:path*', '/admin/:path*', '/mfa/setup'],
}

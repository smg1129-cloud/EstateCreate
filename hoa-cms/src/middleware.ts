import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { getToken } from 'next-auth/jwt'
import { idleTimeoutMinutes } from '@/lib/sessionConfig'

const ACTIVITY_COOKIE = 'hoacms-last-active'

/// Gates every route under (app) and /admin behind an authenticated
/// session, enforces the ADMIN-only boundary on /admin, and applies a
/// sliding idle-session timeout independent of the 12h hard session cap in
/// lib/auth.ts — never relies on the UI alone. Handling privileged legal
/// and financial data makes a short idle window on shared/office
/// workstations a real threat-model concern.
///
/// The idle clock lives in its own plain cookie rather than inside the
/// NextAuth JWT: re-signing that JWT on every request (via next-auth/jwt's
/// encode()) turned out to race with NextAuth's own cookie writes and
/// intermittently clobbered the session. Tracking idle time separately
/// keeps this middleware from touching NextAuth's cookie at all.
export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl

  if (pathname.startsWith('/login') || pathname.startsWith('/api/auth')) {
    return NextResponse.next()
  }

  const secret = process.env.NEXTAUTH_SECRET
  const token = await getToken({ req, secret })

  if (!token) {
    const loginUrl = new URL('/login', req.url)
    loginUrl.searchParams.set('callbackUrl', pathname)
    return NextResponse.redirect(loginUrl)
  }

  const idleMs = idleTimeoutMinutes() * 60 * 1000
  const lastActiveRaw = req.cookies.get(ACTIVITY_COOKIE)?.value
  const lastActive = lastActiveRaw ? Number(lastActiveRaw) : 0

  if (lastActive && Date.now() - lastActive > idleMs) {
    const loginUrl = new URL('/login', req.url)
    loginUrl.searchParams.set('callbackUrl', pathname)
    loginUrl.searchParams.set('reason', 'idle')
    const res = NextResponse.redirect(loginUrl)
    res.cookies.delete(ACTIVITY_COOKIE)
    res.cookies.delete('next-auth.session-token')
    res.cookies.delete('__Secure-next-auth.session-token')
    return res
  }

  if (pathname.startsWith('/admin') && token.role !== 'ADMIN') {
    return NextResponse.redirect(new URL('/', req.url))
  }

  const res = NextResponse.next()
  res.cookies.set(ACTIVITY_COOKIE, String(Date.now()), {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NEXTAUTH_URL?.startsWith('https') ?? false,
    path: '/',
  })
  return res
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
}

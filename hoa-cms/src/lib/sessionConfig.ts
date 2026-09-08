/// Split out from lib/auth.ts so middleware.ts (Edge Runtime) can read the
/// idle-timeout config without pulling in bcryptjs and the NextAuth
/// credentials provider — both use Node APIs (process.nextTick,
/// setImmediate) that don't exist in the Edge Runtime and would otherwise
/// get bundled into the middleware just for this one constant.
export function idleTimeoutMinutes(): number {
  return Number(process.env.SESSION_IDLE_TIMEOUT_MINUTES ?? 15)
}

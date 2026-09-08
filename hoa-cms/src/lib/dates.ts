/// Parses a plain "YYYY-MM-DD" value from an <input type="date"> as a
/// LOCAL calendar date, not UTC midnight. `new Date("2026-09-01")` alone
/// parses as UTC per the ISO 8601 date-only spec, which then renders as
/// the previous day via toLocaleDateString() in any timezone behind UTC —
/// a real problem when the date is a filing deadline. Appending a local
/// (non-Z) time component avoids the UTC interpretation entirely.
export function parseLocalDate(value: string): Date {
  return new Date(`${value}T00:00:00`)
}

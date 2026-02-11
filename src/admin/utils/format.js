export function formatMinutes(m) {
  const n = Number(m || 0)
  if (!Number.isFinite(n)) return '-'
  if (n < 60) return `${n}m`
  const h = Math.floor(n / 60)
  const r = n % 60
  return r ? `${h}h ${r}m` : `${h}h`
}

export function formatInr(amount) {
  const n = Number(amount || 0)
  if (!Number.isFinite(n)) return '-'
  return `₹${n.toLocaleString('en-IN')}`
}

export function minutesSince(iso) {
  const t = new Date(iso).getTime()
  if (!t) return 0
  return Math.max(0, Math.floor((Date.now() - t) / 60_000))
}

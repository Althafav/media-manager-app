// Session/OtherItem dates are stored as the instant matching local midnight of their intended
// calendar day (agenda-synced dates arrive as offset-less date-times parsed in the server's local
// zone; manually-entered dates arrive as date-only strings parsed as UTC midnight, which is still
// the same local calendar day for this deployment's timezone). Deriving the key from UTC
// components (e.g. toISOString().slice(0, 10)) would shift agenda-synced sessions back a day here,
// so the key must come from local calendar components to match the day headings (which already use
// toLocaleDateString) and the actual intended day.
export function dayKeyOf(date: Date) {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

export function formatDate(date: Date) {
  return date.toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })
}

export function formatShortDay(date: Date) {
  return date.toLocaleDateString(undefined, { weekday: 'short', day: 'numeric' })
}

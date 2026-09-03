import Link from 'next/link'

type CoverageEntry = {
  kind: 'session' | 'booth' | 'other-item'
  id: string
  name: string
  logged: boolean
}

const SECTION_PATH_FOR_KIND: Record<CoverageEntry['kind'], string> = {
  session: 'sessions',
  booth: 'booths',
  'other-item': 'other-items',
}

// The signature device: one mark per session/booth/item in the event, green if it has
// footage logged, red if it doesn't — a tally strip in the shape of exposed/unexposed
// film frames. This is the app's actual job made visible in one glance.
export function CoverageStrip({ eventId, entries }: { eventId: string; entries: CoverageEntry[] }) {
  if (entries.length === 0) return null

  const loggedCount = entries.filter((entry) => entry.logged).length
  const missingCount = entries.length - loggedCount

  return (
    <div className="mb-6">
      <p className="font-mono text-xs font-medium tracking-wider uppercase text-ink-soft mb-1.5">
        {loggedCount} logged &middot; {missingCount} missing
      </p>
      {/* Always wraps into rows (never a horizontal scroll strip, unlike ui.dayChipStrip) —
          with 100+ marks on a real event, swiping through a single scrolling line on a phone
          would defeat the point of an at-a-glance tally. A slightly smaller mark on mobile
          fits more per row on a narrow screen. */}
      <div className="flex flex-wrap gap-1.5 mb-4">
        {entries.map((entry) => (
          <Link
            key={`${entry.kind}-${entry.id}`}
            href={`/events/${eventId}/${SECTION_PATH_FOR_KIND[entry.kind]}?open=${entry.id}#${entry.kind}-${entry.id}`}
            title={entry.name}
            aria-label={`${entry.name} — ${entry.logged ? 'logged' : 'missing'}`}
            className={`shrink-0 w-2.5 h-7 sm:w-3 sm:h-8 transition-opacity hover:opacity-75 ${entry.logged ? 'bg-ok' : 'bg-danger'}`}
          />
        ))}
      </div>
    </div>
  )
}

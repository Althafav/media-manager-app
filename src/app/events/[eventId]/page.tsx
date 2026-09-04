import Link from 'next/link'
import { notFound } from 'next/navigation'
import { getEventWithSessionTree } from '@/lib/data'
import { resyncEvent } from './actions'
import { CoverageStrip } from '@/components/CoverageStrip'
import { EventStorageField } from '@/components/EventStorageField'
import { AutoSyncOnVisit } from '@/components/AutoSyncOnVisit'
import * as ui from '@/lib/ui'

function countLogged(items: { mediaLocations: { id: string }[] }[]) {
  return items.filter((item) => item.mediaLocations.length > 0).length
}

export default async function EventDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ eventId: string }>
  searchParams: Promise<{
    added?: string
    storageUpdated?: string
    synced?: string
    syncFailed?: string
  }>
}) {
  const { eventId } = await params
  const { added, storageUpdated, synced, syncFailed } = await searchParams

  const event = await getEventWithSessionTree(eventId)
  if (!event) notFound()

  const coverageEntries = [
    ...event.sessions.map((s) => ({
      kind: 'session' as const,
      id: s.id,
      name: s.name,
      logged: s.mediaLocations.length > 0,
    })),
    ...event.booths.map((b) => ({
      kind: 'booth' as const,
      id: b.id,
      name: b.name,
      logged: b.mediaLocations.length > 0,
    })),
    ...event.otherItems.map((i) => ({
      kind: 'other-item' as const,
      id: i.id,
      name: i.name,
      logged: i.mediaLocations.length > 0,
    })),
  ]

  const sections = [
    {
      key: 'sessions',
      label: 'Sessions',
      href: `/events/${eventId}/sessions`,
      total: event.sessions.length,
      logged: countLogged(event.sessions),
    },
    {
      key: 'booths',
      label: 'Booths',
      href: `/events/${eventId}/booths`,
      total: event.booths.length,
      logged: countLogged(event.booths),
    },
    {
      key: 'items',
      label: 'Other Items',
      href: `/events/${eventId}/other-items`,
      total: event.otherItems.length,
      logged: countLogged(event.otherItems),
    },
  ]

  return (
    <div className={ui.page}>
      <Link href="/events" className={ui.backLink}>
        &larr; Events
      </Link>
      <h1 className={ui.h1}>{event.name}</h1>
      <AutoSyncOnVisit eventId={event.id} />
      {added && <p className={`${ui.bannerOk} mt-3`}>Event added and synced from the agenda API.</p>}
      {storageUpdated && <p className={`${ui.bannerOk} mt-3`}>Storage updated.</p>}
      {synced && <p className={`${ui.bannerOk} mt-3`}>Synced with the agenda API.</p>}
      {syncFailed && (
        <p className={`${ui.bannerError} mt-3`}>Could not sync with the agenda API. Try again in a moment.</p>
      )}
      <EventStorageField eventId={event.id} storage={event.storage} />

      <div className="flex flex-wrap gap-2.5 mt-4 mb-4">
        <form action={resyncEvent.bind(null, event.id)}>
          <button type="submit" className={ui.button}>
            Sync agenda
          </button>
        </form>
        <a href={`/events/${event.id}/media-locations/export`}>
          <button className={ui.button}>Export to Excel</button>
        </a>
      </div>

      <div className="flex flex-wrap gap-x-4 gap-y-1 mb-6">
        <Link
          href={`/events/${event.id}/media-locations`}
          className="inline-block hover:underline hover:decoration-accent hover:decoration-2"
        >
          View all media locations
        </Link>
        <Link
          href={`/events/${event.id}/activity`}
          className="inline-block hover:underline hover:decoration-accent hover:decoration-2"
        >
          View activity log
        </Link>
      </div>

      <CoverageStrip eventId={eventId} entries={coverageEntries} />

      <div className="grid gap-3 sm:grid-cols-3">
        {sections.map((section) => (
          <Link key={section.key} href={section.href} className={`${ui.card} mb-0 block hover:border-l-accent`}>
            <span className="font-display font-bold text-lg uppercase tracking-wide text-accent-ink">
              {section.label}
            </span>
            <p className={`${ui.muted} mt-1`}>
              {section.total === 0 ? 'None yet' : `${section.logged} of ${section.total} logged`}
            </p>
          </Link>
        ))}
      </div>
    </div>
  )
}

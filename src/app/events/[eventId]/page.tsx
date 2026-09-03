import Link from 'next/link'
import { notFound } from 'next/navigation'
import { getEventWithSessionTree } from '@/lib/data'
import { resyncEvent } from './actions'
import { SessionRow } from '@/components/SessionRow'
import { EventStorageField } from '@/components/EventStorageField'
import { ScrollToSession } from '@/components/ScrollToSession'
import { SESSION_STATUS_LABELS } from '@/lib/session-status-badge'
import { SessionStatus } from '@/generated/prisma/enums'
import * as ui from '@/lib/ui'

// Session dates are stored as the instant matching local midnight of their intended calendar
// day (agenda-synced dates arrive as offset-less date-times parsed in the server's local zone;
// manually-entered dates arrive as date-only strings parsed as UTC midnight, which is still the
// same local calendar day for this deployment's timezone). Deriving the key from UTC components
// (e.g. toISOString().slice(0, 10)) would shift agenda-synced sessions back a day here, so the
// key must come from local calendar components to match the day headings (which already use
// toLocaleDateString) and the actual intended day.
function dayKeyOf(date: Date) {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

function formatDate(date: Date) {
  return date.toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })
}

function formatShortDay(date: Date) {
  return date.toLocaleDateString(undefined, { weekday: 'short', day: 'numeric' })
}

const SESSION_STATUSES = Object.values(SessionStatus)

function buildHref(
  base: string,
  overrides: Partial<{ q: string; status: string; day: string }>,
  current: { q: string; status: string; day: string }
) {
  const params = new URLSearchParams()
  const q = overrides.q ?? current.q
  const status = overrides.status ?? current.status
  const day = overrides.day ?? current.day
  if (q) params.set('q', q)
  if (status) params.set('status', status)
  if (day) params.set('day', day)
  const qs = params.toString()
  return qs ? `${base}?${qs}` : base
}

export default async function EventDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ eventId: string }>
  searchParams: Promise<{
    added?: string
    sessionAdded?: string
    sessionDeleted?: string
    mediaAdded?: string
    mediaUpdated?: string
    mediaDeleted?: string
    storageUpdated?: string
    q?: string
    status?: string
    day?: string
  }>
}) {
  const { eventId } = await params
  const { added, sessionAdded, sessionDeleted, mediaAdded, mediaUpdated, mediaDeleted, storageUpdated, q, status, day } =
    await searchParams
  const scrollToSessionId = mediaAdded ?? mediaUpdated

  const event = await getEventWithSessionTree(eventId)

  if (!event) notFound()

  const availableDays = [...new Set(event.sessions.map((session) => dayKeyOf(session.date)))].sort()
  const todayKey = dayKeyOf(new Date())

  const resolvedDay = day === undefined ? (availableDays.includes(todayKey) ? todayKey : 'all') : day
  const showingFallback = day === undefined && resolvedDay === 'all' && availableDays.length > 0

  const query = q?.trim().toLowerCase() ?? ''
  const filteredSessions = event.sessions.filter((session) => {
    if (status && session.status !== status) return false
    if (resolvedDay !== 'all' && dayKeyOf(session.date) !== resolvedDay) return false
    if (query && !session.name.toLowerCase().includes(query)) return false
    return true
  })

  const days = new Map<string, typeof event.sessions>()
  for (const session of filteredSessions) {
    const key = dayKeyOf(session.date)
    if (!days.has(key)) days.set(key, [])
    days.get(key)!.push(session)
  }

  const currentFilters = { q: q ?? '', status: status ?? '', day: resolvedDay }
  const eventBase = `/events/${event.id}`
  const returnTo = buildHref(eventBase, {}, currentFilters)

  return (
    <div className={ui.page}>
      <ScrollToSession sessionId={scrollToSessionId} />
      <Link href="/events" className={ui.backLink}>
        &larr; Events
      </Link>
      <h1 className={ui.h1}>{event.name}</h1>
      {added && <p className={`${ui.bannerOk} mt-3`}>Event added and synced from the agenda API.</p>}
      {sessionAdded && <p className={`${ui.bannerOk} mt-3`}>Session added.</p>}
      {sessionDeleted && <p className={`${ui.bannerOk} mt-3`}>Session deleted.</p>}
      {mediaAdded && <p className={`${ui.bannerOk} mt-3`}>Media location added.</p>}
      {mediaUpdated && <p className={`${ui.bannerOk} mt-3`}>Media location updated.</p>}
      {mediaDeleted && <p className={`${ui.bannerOk} mt-3`}>Media location deleted.</p>}
      {storageUpdated && <p className={`${ui.bannerOk} mt-3`}>Storage updated.</p>}
      <EventStorageField eventId={event.id} storage={event.storage} />

      <div className="flex gap-2.5 mt-4 mb-4">
        <form action={resyncEvent.bind(null, event.id)}>
          <button type="submit" className={ui.button}>
            Sync agenda
          </button>
        </form>
        <Link href={`/events/${event.id}/sessions/new`}>
          <button className={ui.button}>Add session</button>
        </Link>
      </div>

      <Link
        href={`/events/${event.id}/media-locations`}
        className="inline-block mb-6 hover:underline hover:decoration-accent hover:decoration-2"
      >
        View all media locations
      </Link>

      {availableDays.length > 0 && (
        <nav className={ui.dayChipStrip} aria-label="Day">
          {availableDays.map((d) => (
            <Link
              key={d}
              href={buildHref(eventBase, { day: d }, currentFilters)}
              className={`${ui.dayChip} ${resolvedDay === d ? ui.dayChipActive : ui.dayChipInactive}`}
            >
              {formatShortDay(new Date(`${d}T00:00:00`))}
              {d === todayKey && <span aria-hidden> •</span>}
            </Link>
          ))}
          <Link
            href={buildHref(eventBase, { day: 'all' }, currentFilters)}
            className={`${ui.dayChip} ${resolvedDay === 'all' ? ui.dayChipActive : ui.dayChipInactive}`}
          >
            All days
          </Link>
        </nav>
      )}
      {showingFallback && <p className={`${ui.muted} -mt-2 mb-4`}>No sessions today — showing all days.</p>}

      <form className={ui.filterBar}>
        <input type="hidden" name="day" value={resolvedDay} />
        <label className={ui.label}>
          Search
          <input type="text" name="q" defaultValue={q} placeholder="session name" className={ui.input} />
        </label>
        <label className={ui.label}>
          Status
          <select name="status" defaultValue={status ?? ''} className={ui.input}>
            <option value="">Any</option>
            {SESSION_STATUSES.map((s) => (
              <option key={s} value={s}>
                {SESSION_STATUS_LABELS[s]}
              </option>
            ))}
          </select>
        </label>
        <button type="submit" className={ui.button}>
          Filter
        </button>
      </form>

      {event.sessions.length === 0 ? (
        <p className={ui.muted}>No sessions synced yet.</p>
      ) : days.size === 0 ? (
        <p className={ui.muted}>No sessions match your filters.</p>
      ) : (
        [...days.entries()].map(([dayKey, sessions]) => {
          const rooms = new Map<string, typeof sessions>()
          for (const session of sessions) {
            const roomName = session.room?.name || 'Unassigned Room'
            if (!rooms.has(roomName)) rooms.set(roomName, [])
            rooms.get(roomName)!.push(session)
          }

          return (
            <section key={dayKey}>
              <h2 className={ui.h2}>{formatDate(sessions[0].date)}</h2>
              {[...rooms.entries()].map(([roomName, roomSessions]) => (
                <div key={roomName} className={ui.card}>
                  <strong className="font-semibold">{roomName}</strong>
                  <div className={ui.sessionList}>
                    {roomSessions.map((session) => (
                      <SessionRow
                        key={session.id}
                        eventId={event.id}
                        session={session}
                        returnTo={returnTo}
                        autoOpen={session.id === scrollToSessionId}
                      />
                    ))}
                  </div>
                </div>
              ))}
            </section>
          )
        })
      )}
    </div>
  )
}

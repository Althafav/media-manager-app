import Link from 'next/link'
import { notFound } from 'next/navigation'
import { getEventWithSessionTree } from '@/lib/data'
import { CoverageRow } from '@/components/CoverageRow'
import { ScrollToRow } from '@/components/ScrollToRow'
import { Breadcrumbs } from '@/components/Breadcrumbs'
import { sessionStatusBadgeClasses, SESSION_STATUS_LABELS } from '@/lib/session-status-badge'
import { SessionStatus } from '@/generated/prisma/enums'
import { dayKeyOf, formatDate, formatShortDay } from '@/lib/day-key'
import type { SessionSpeaker } from '@/lib/session-speaker'
import * as ui from '@/lib/ui'

const SESSION_STATUSES = Object.values(SessionStatus)

function buildHref(
  base: string,
  overrides: Partial<{ q: string; status: string; day: string; track: string }>,
  current: { q: string; status: string; day: string; track: string }
) {
  const params = new URLSearchParams()
  const q = overrides.q ?? current.q
  const status = overrides.status ?? current.status
  const day = overrides.day ?? current.day
  const track = overrides.track ?? current.track
  if (q) params.set('q', q)
  if (status) params.set('status', status)
  if (day) params.set('day', day)
  if (track) params.set('track', track)
  const qs = params.toString()
  return qs ? `${base}?${qs}` : base
}

export default async function SessionsPage({
  params,
  searchParams,
}: {
  params: Promise<{ eventId: string }>
  searchParams: Promise<{
    mediaAdded?: string
    mediaUpdated?: string
    mediaDeleted?: string
    q?: string
    status?: string
    day?: string
    track?: string
    open?: string
  }>
}) {
  const { eventId } = await params
  const { mediaAdded, mediaUpdated, mediaDeleted, q, status, day, track, open } = await searchParams
  const focusId = open ?? mediaAdded ?? mediaUpdated

  const event = await getEventWithSessionTree(eventId)
  if (!event) notFound()

  const availableDays = [...new Set(event.sessions.map((s) => dayKeyOf(s.date)))].sort()
  const todayKey = dayKeyOf(new Date())
  const resolvedDay = day === undefined ? (availableDays.includes(todayKey) ? todayKey : 'all') : day
  const showingFallback = day === undefined && resolvedDay === 'all' && availableDays.length > 0

  const availableTracks = [...new Map(event.sessions.flatMap((s) => (s.track ? [[s.track.id, s.track.name]] : []))).entries()].sort(
    (a, b) => a[1].localeCompare(b[1])
  )

  const query = q?.trim().toLowerCase() ?? ''
  const filteredSessions = event.sessions.filter((session) => {
    if (status && session.status !== status) return false
    if (resolvedDay !== 'all' && dayKeyOf(session.date) !== resolvedDay) return false
    if (track && session.track?.id !== track) return false
    if (query) {
      const speakers = (session.speakers as SessionSpeaker[] | null) ?? []
      const matchesName = session.name.toLowerCase().includes(query)
      const matchesSpeaker = speakers.some((speaker) => speaker.name.toLowerCase().includes(query))
      if (!matchesName && !matchesSpeaker) return false
    }
    return true
  })

  const days = new Map<string, typeof event.sessions>()
  for (const session of filteredSessions) {
    const key = dayKeyOf(session.date)
    if (!days.has(key)) days.set(key, [])
    days.get(key)!.push(session)
  }

  const eventBase = `/events/${eventId}/sessions`
  const currentFilters = { q: q ?? '', status: status ?? '', day: resolvedDay, track: track ?? '' }
  const returnTo = buildHref(eventBase, {}, currentFilters)

  return (
    <div className={ui.page}>
      <ScrollToRow id={focusId} />
      <Breadcrumbs
        items={[
          { label: 'Events', href: '/events' },
          { label: event.name, href: `/events/${eventId}` },
          { label: 'Sessions' },
        ]}
      />
      <h1 className={ui.h1}>Sessions</h1>
      {mediaAdded && <p className={`${ui.bannerOk} mt-3`}>Media location added.</p>}
      {mediaUpdated && <p className={`${ui.bannerOk} mt-3`}>Media location updated.</p>}
      {mediaDeleted && <p className={`${ui.bannerOk} mt-3`}>Media location deleted.</p>}

      <div className="mt-4">
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
      </div>

      <form className={ui.filterBar}>
        <input type="hidden" name="day" value={resolvedDay} />
        <label className={ui.label}>
          Search
          <input type="text" name="q" defaultValue={q} placeholder="session or speaker name" className={ui.input} />
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
        {availableTracks.length > 0 && (
          <label className={ui.label}>
            Track
            <select name="track" defaultValue={track ?? ''} className={ui.input}>
              <option value="">Any</option>
              {availableTracks.map(([id, name]) => (
                <option key={id} value={id}>
                  {name}
                </option>
              ))}
            </select>
          </label>
        )}
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
            // Some events (e.g. track-only agendas) never assign a Room at all — group by
            // Track instead of dumping every session into one "Unassigned Room" bucket.
            const roomName = session.room?.name || session.track?.name || 'Unassigned Room'
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
                      <CoverageRow
                        key={session.id}
                        kind="session"
                        eventId={eventId}
                        id={session.id}
                        name={session.name}
                        detailHref={`/events/${eventId}/sessions/${session.id}`}
                        timeLabel={`${session.startTime.slice(0, 5)}–${session.endTime.slice(0, 5)}`}
                        statusBadge={
                          session.status === SessionStatus.CANCELLED
                            ? {
                                label: SESSION_STATUS_LABELS[session.status],
                                className: sessionStatusBadgeClasses(session.status),
                              }
                            : undefined
                        }
                        mediaLocations={session.mediaLocations}
                        autoOpen={session.id === focusId}
                        returnTo={returnTo}
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

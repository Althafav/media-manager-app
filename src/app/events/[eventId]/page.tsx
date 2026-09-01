import Link from 'next/link'
import { notFound } from 'next/navigation'
import { getEventWithSessionTree } from '@/lib/data'
import { resyncEvent } from './actions'
import { mediaTypeBadgeClasses } from '@/lib/media-type-badge'
import { sessionStatusBadgeClasses, SESSION_STATUS_LABELS } from '@/lib/session-status-badge'
import type { MediaType } from '@/generated/prisma/enums'
import { SessionStatus } from '@/generated/prisma/enums'
import * as ui from '@/lib/ui'

function formatDate(date: Date) {
  return date.toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })
}

const MEDIA_TYPE_ORDER: MediaType[] = ['PHOTO', 'VIDEO', 'MIXED', 'OTHER']
const MEDIA_TYPE_LABELS: Record<MediaType, string> = {
  PHOTO: 'Photo',
  VIDEO: 'Video',
  MIXED: 'Mixed',
  OTHER: 'Other',
}

function countByMediaType(mediaLocations: { mediaType: MediaType }[]) {
  const counts = new Map<MediaType, number>()
  for (const loc of mediaLocations) {
    counts.set(loc.mediaType, (counts.get(loc.mediaType) ?? 0) + 1)
  }
  return counts
}

const SESSION_STATUSES = Object.values(SessionStatus)

export default async function EventDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ eventId: string }>
  searchParams: Promise<{
    added?: string
    sessionAdded?: string
    sessionDeleted?: string
    q?: string
    status?: string
    day?: string
  }>
}) {
  const { eventId } = await params
  const { added, sessionAdded, sessionDeleted, q, status, day } = await searchParams

  const event = await getEventWithSessionTree(eventId)

  if (!event) notFound()

  const availableDays = [...new Set(event.sessions.map((session) => session.date.toISOString().slice(0, 10)))].sort()

  const query = q?.trim().toLowerCase() ?? ''
  const filteredSessions = event.sessions.filter((session) => {
    if (status && session.status !== status) return false
    if (day && session.date.toISOString().slice(0, 10) !== day) return false
    if (query && !session.name.toLowerCase().includes(query)) return false
    return true
  })

  const days = new Map<string, typeof event.sessions>()
  for (const session of filteredSessions) {
    const key = session.date.toISOString().slice(0, 10)
    if (!days.has(key)) days.set(key, [])
    days.get(key)!.push(session)
  }

  return (
    <div className={ui.page}>
      <Link href="/events" className={ui.backLink}>
        &larr; Events
      </Link>
      <h1 className={ui.h1}>{event.name}</h1>
      {added && <p className={`${ui.bannerOk} mt-3`}>Event added and synced from the agenda API.</p>}
      {sessionAdded && <p className={`${ui.bannerOk} mt-3`}>Session added.</p>}
      {sessionDeleted && <p className={`${ui.bannerOk} mt-3`}>Session deleted.</p>}
      <p className={`${ui.muted} mt-2`}>Storage: {event.storage}</p>

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

      <form className={ui.formInline}>
        <label className={ui.label}>
          Search
          <input
            type="text"
            name="q"
            defaultValue={q}
            placeholder="session name"
            className={ui.input}
          />
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
        <label className={ui.label}>
          Day
          <select name="day" defaultValue={day ?? ''} className={ui.input}>
            <option value="">Any</option>
            {availableDays.map((d) => (
              <option key={d} value={d}>
                {formatDate(new Date(`${d}T00:00:00`))}
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
                  <table className={ui.table}>
                    <tbody>
                      {roomSessions.map((session) => {
                        const counts = countByMediaType(session.mediaLocations)
                        return (
                          <tr key={session.id} className={ui.trHover}>
                            <td className={`${ui.td} whitespace-nowrap`}>
                              {session.startTime.slice(0, 5)}–{session.endTime.slice(0, 5)}
                            </td>
                            <td className={ui.td}>
                              <Link
                                href={`/events/${event.id}/sessions/${session.id}`}
                                className="hover:underline hover:decoration-accent hover:decoration-2"
                              >
                                {session.name}
                              </Link>
                              {session.status === SessionStatus.CANCELLED && (
                                <span className={ui.badgeClasses(`${sessionStatusBadgeClasses(session.status)} ml-1.5`)}>
                                  {SESSION_STATUS_LABELS[session.status]}
                                </span>
                              )}
                              {session.isManual && (
                                <span className={ui.badgeClasses('bg-rule text-ink ml-1.5')}>Manual</span>
                              )}
                            </td>
                            <td className={`${ui.td} whitespace-nowrap`}>
                              {session.mediaLocations.length === 0 ? (
                                <span className={ui.badgeClasses('bg-rule text-ink')}>0 media</span>
                              ) : (
                                <div className="flex flex-wrap gap-1">
                                  {MEDIA_TYPE_ORDER.filter((type) => counts.has(type)).map((type) => (
                                    <span key={type} className={ui.badgeClasses(mediaTypeBadgeClasses(type))}>
                                      {counts.get(type)} {MEDIA_TYPE_LABELS[type]}
                                    </span>
                                  ))}
                                </div>
                              )}
                            </td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>
              ))}
            </section>
          )
        })
      )}
    </div>
  )
}

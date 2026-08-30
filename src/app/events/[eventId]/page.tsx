import Link from 'next/link'
import { notFound } from 'next/navigation'
import { getEventWithSessionTree } from '@/lib/data'
import { resyncEvent } from './actions'
import * as ui from '@/lib/ui'

function formatDate(date: Date) {
  return date.toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })
}

export default async function EventDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ eventId: string }>
  searchParams: Promise<{ added?: string }>
}) {
  const { eventId } = await params
  const { added } = await searchParams

  const event = await getEventWithSessionTree(eventId)

  if (!event) notFound()

  const days = new Map<string, typeof event.sessions>()
  for (const session of event.sessions) {
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
      <p className={`${ui.muted} mt-2`}>Storage: {event.storage}</p>

      <form action={resyncEvent.bind(null, event.id)} className="mt-4 mb-4">
        <button type="submit" className={ui.button}>
          Sync agenda
        </button>
      </form>

      <Link
        href={`/events/${event.id}/media-locations`}
        className="inline-block mb-6 hover:underline hover:decoration-accent hover:decoration-2"
      >
        View all media locations
      </Link>

      {days.size === 0 ? (
        <p className={ui.muted}>No sessions synced yet.</p>
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
                      {roomSessions.map((session) => (
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
                          </td>
                          <td className={`${ui.td} whitespace-nowrap`}>
                            <span
                              className={ui.badgeClasses(
                                session._count.mediaLocations > 0 ? 'bg-ok text-paper' : 'bg-rule text-ink'
                              )}
                            >
                              {session._count.mediaLocations} media
                            </span>
                          </td>
                        </tr>
                      ))}
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

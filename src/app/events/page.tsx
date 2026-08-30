import Link from 'next/link'
import { getEvents } from '@/lib/data'
import * as ui from '@/lib/ui'

export default async function EventsPage() {
  const events = await getEvents()

  return (
    <div className={ui.page}>
      <h1 className={ui.h1}>Events</h1>
      <Link href="/events/new">
        <button className={ui.button}>Add event</button>
      </Link>

      {events.length === 0 ? (
        <p className={`${ui.muted} mt-4`}>No events yet. Add one by its agenda EventId.</p>
      ) : (
        <table className={`${ui.table} mt-4`}>
          <thead>
            <tr>
              <th className={ui.th}>Name</th>
              <th className={ui.th}>Storage</th>
              <th className={ui.th}>Sessions</th>
              <th className={ui.th}>Media Locations</th>
            </tr>
          </thead>
          <tbody>
            {events.map((event) => (
              <tr key={event.id} className={ui.trHover}>
                <td className={ui.td}>
                  <Link href={`/events/${event.id}`} className="hover:underline hover:decoration-accent hover:decoration-2">
                    {event.name}
                  </Link>
                </td>
                <td className={ui.td}>{event.storage}</td>
                <td className={ui.td}>{event._count.sessions}</td>
                <td className={ui.td}>{event._count.mediaLocations}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  )
}

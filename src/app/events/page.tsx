import Link from 'next/link'
import { getEvents } from '@/lib/data'
import * as ui from '@/lib/ui'

export default async function EventsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>
}) {
  const { q } = await searchParams
  const events = await getEvents({ q })

  return (
    <div className={ui.page}>
      <h1 className={ui.h1}>Events</h1>
      <div className="flex flex-col gap-2.5 mt-4 mb-4 sm:flex-row sm:flex-wrap sm:items-end">
        <Link href="/events/new" className="w-full sm:w-auto">
          <button className={`${ui.button} w-full sm:w-auto`}>Add event</button>
        </Link>
        <form className="flex flex-col gap-2.5 w-full sm:w-auto sm:flex-1 sm:flex-row sm:items-end">
          <label className={`${ui.label} w-full sm:flex-1 sm:min-w-45`}>
            Search
            <input type="text" name="q" defaultValue={q} placeholder="name or storage" className={ui.input} />
          </label>
          <button type="submit" className={`${ui.button} w-full sm:w-auto`}>
            Search
          </button>
        </form>
      </div>

      {events.length === 0 ? (
        <p className={`${ui.muted} mt-4`}>
          {q ? 'No events match that search.' : 'No events yet. Add one by its agenda EventId.'}
        </p>
      ) : (
        <>
          {/* Below sm: a stacked card per event — a 4-column table has no room to breathe on a
              phone-width screen, so this reuses the same card pattern already used everywhere
              else in the app for list items instead of forcing horizontal table scroll. */}
          <div className="flex flex-col gap-3 mt-4 sm:hidden">
            {events.map((event) => (
              <div key={event.id} className={`${ui.card} mb-0`}>
                <Link
                  href={`/events/${event.id}`}
                  className="font-display font-bold text-lg uppercase tracking-wide text-accent-ink hover:underline hover:decoration-accent"
                >
                  {event.name}
                </Link>
                <p className={`${ui.muted} mt-1`}>Storage: {event.storage}</p>
                <p className={`${ui.muted} mt-1`}>
                  {event._count.sessions} session{event._count.sessions === 1 ? '' : 's'} &middot;{' '}
                  {event._count.mediaLocations} media location{event._count.mediaLocations === 1 ? '' : 's'}
                </p>
              </div>
            ))}
          </div>

          {/* sm and up: the table, room enough for all four columns. */}
          <div className="hidden sm:block overflow-x-auto">
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
                      <Link
                        href={`/events/${event.id}`}
                        className="hover:underline hover:decoration-accent hover:decoration-2"
                      >
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
          </div>
        </>
      )}
    </div>
  )
}

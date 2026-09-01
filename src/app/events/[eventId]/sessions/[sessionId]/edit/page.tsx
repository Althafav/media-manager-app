import Link from 'next/link'
import { notFound } from 'next/navigation'
import { getSessionDetail, getEventRoomsAndTracks } from '@/lib/data'
import { SessionForm } from '@/components/SessionForm'
import { updateSession } from '../../actions'
import * as ui from '@/lib/ui'

export default async function EditSessionPage({
  params,
}: {
  params: Promise<{ eventId: string; sessionId: string }>
}) {
  const { eventId, sessionId } = await params

  const session = await getSessionDetail(sessionId)
  if (!session || session.eventId !== eventId) notFound()
  if (!session.isManual) notFound()

  const eventWithLookups = await getEventRoomsAndTracks(eventId)

  return (
    <div className={ui.page}>
      <Link href={`/events/${eventId}/sessions/${sessionId}`} className={ui.backLink}>
        &larr; {session.name}
      </Link>
      <h1 className={ui.h1}>Edit session</h1>
      <SessionForm
        action={updateSession.bind(null, sessionId)}
        eventId={eventId}
        rooms={eventWithLookups?.rooms ?? []}
        tracks={eventWithLookups?.tracks ?? []}
        initial={{
          name: session.name,
          date: session.date.toISOString().slice(0, 10),
          startTime: session.startTime.slice(0, 5),
          endTime: session.endTime.slice(0, 5),
          roomId: session.roomId ?? '',
          trackId: session.trackId ?? '',
        }}
      />
    </div>
  )
}

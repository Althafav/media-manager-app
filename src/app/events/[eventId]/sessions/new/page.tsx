import Link from 'next/link'
import { notFound } from 'next/navigation'
import { getEventBasic, getEventRoomsAndTracks } from '@/lib/data'
import { SessionForm } from '@/components/SessionForm'
import { createSession } from '../actions'
import * as ui from '@/lib/ui'

export default async function NewSessionPage({ params }: { params: Promise<{ eventId: string }> }) {
  const { eventId } = await params

  const event = await getEventBasic(eventId)
  if (!event) notFound()

  const eventWithLookups = await getEventRoomsAndTracks(eventId)

  return (
    <div className={ui.page}>
      <Link href={`/events/${event.id}`} className={ui.backLink}>
        &larr; {event.name}
      </Link>
      <h1 className={ui.h1}>Add session</h1>
      <SessionForm
        action={createSession}
        eventId={event.id}
        rooms={eventWithLookups?.rooms ?? []}
        tracks={eventWithLookups?.tracks ?? []}
      />
    </div>
  )
}

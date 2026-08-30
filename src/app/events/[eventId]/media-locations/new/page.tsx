import Link from 'next/link'
import { notFound } from 'next/navigation'
import { getEventWithActiveSessions } from '@/lib/data'
import { MediaLocationForm } from '@/components/MediaLocationForm'
import { createMediaLocation } from '../actions'
import * as ui from '@/lib/ui'

export default async function NewMediaLocationPage({
  params,
  searchParams,
}: {
  params: Promise<{ eventId: string }>
  searchParams: Promise<{ sessionId?: string }>
}) {
  const { eventId } = await params
  const { sessionId } = await searchParams

  const event = await getEventWithActiveSessions(eventId)
  if (!event) notFound()

  return (
    <div className={ui.page}>
      <Link href={`/events/${event.id}/media-locations`} className={ui.backLink}>
        &larr; Media Locations
      </Link>
      <h1 className={ui.h1}>Add media location</h1>
      <p className={`${ui.muted} mt-2 mb-4`}>Storage: {event.storage}</p>
      <MediaLocationForm
        action={createMediaLocation}
        eventId={event.id}
        sessions={event.sessions.map((s) => ({ id: s.id, name: s.name }))}
        initial={{ sessionId, mediaType: 'PHOTO' }}
      />
    </div>
  )
}

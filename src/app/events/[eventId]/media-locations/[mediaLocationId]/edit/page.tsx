import Link from 'next/link'
import { notFound } from 'next/navigation'
import { getEventWithActiveSessions, getMediaLocation } from '@/lib/data'
import { MediaLocationForm } from '@/components/MediaLocationForm'
import { updateMediaLocation } from '../../actions'
import * as ui from '@/lib/ui'

export default async function EditMediaLocationPage({
  params,
}: {
  params: Promise<{ eventId: string; mediaLocationId: string }>
}) {
  const { eventId, mediaLocationId } = await params

  const [event, mediaLocation] = await Promise.all([
    getEventWithActiveSessions(eventId),
    getMediaLocation(mediaLocationId),
  ])

  if (!event || !mediaLocation || mediaLocation.eventId !== eventId) notFound()

  return (
    <div className={ui.page}>
      <Link href={`/events/${event.id}/media-locations`} className={ui.backLink}>
        &larr; Media Locations
      </Link>
      <h1 className={ui.h1}>Edit media location</h1>
      <p className={`${ui.muted} mt-2 mb-4`}>Storage: {event.storage}</p>
      <MediaLocationForm
        action={updateMediaLocation.bind(null, mediaLocation.id)}
        eventId={event.id}
        sessions={event.sessions.map((s) => ({ id: s.id, name: s.name }))}
        initial={{
          sessionId: mediaLocation.sessionId ?? '',
          folderPath: mediaLocation.folderPath,
          mediaType: mediaLocation.mediaType,
          description: mediaLocation.description ?? '',
          notes: mediaLocation.notes ?? '',
          tags: mediaLocation.tags,
        }}
      />
    </div>
  )
}

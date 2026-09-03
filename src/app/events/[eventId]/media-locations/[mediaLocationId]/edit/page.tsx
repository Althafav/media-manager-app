import Link from 'next/link'
import { notFound } from 'next/navigation'
import { getEventWithActiveSessions, getMediaLocation } from '@/lib/data'
import { MediaLocationForm } from '@/components/MediaLocationForm'
import { DeleteMediaLocationForm } from '@/components/DeleteMediaLocationForm'
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
      <div className="mt-4">
        <DeleteMediaLocationForm
          mediaLocationId={mediaLocation.id}
          eventId={event.id}
          returnTo={`/events/${event.id}/media-locations`}
          className="font-mono text-[0.8rem] font-medium tracking-wider uppercase px-4 py-2.5 border border-danger rounded-[2px] bg-transparent text-danger cursor-pointer w-fit transition-colors duration-150 hover:bg-danger hover:text-paper"
        />
      </div>
    </div>
  )
}

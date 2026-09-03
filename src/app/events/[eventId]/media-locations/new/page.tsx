import { notFound } from 'next/navigation'
import { getEventWithActiveSessions } from '@/lib/data'
import { MediaLocationForm } from '@/components/MediaLocationForm'
import { Breadcrumbs } from '@/components/Breadcrumbs'
import { createMediaLocation } from '../actions'
import * as ui from '@/lib/ui'

export default async function NewMediaLocationPage({
  params,
  searchParams,
}: {
  params: Promise<{ eventId: string }>
  searchParams: Promise<{ sessionId?: string; boothId?: string; otherItemId?: string }>
}) {
  const { eventId } = await params
  const { sessionId, boothId, otherItemId } = await searchParams

  const event = await getEventWithActiveSessions(eventId)
  if (!event) notFound()

  return (
    <div className={ui.page}>
      <Breadcrumbs
        items={[
          { label: 'Events', href: '/events' },
          { label: event.name, href: `/events/${event.id}` },
          { label: 'Media Locations', href: `/events/${event.id}/media-locations` },
          { label: 'Add' },
        ]}
      />
      <h1 className={ui.h1}>Add media location</h1>
      <p className={`${ui.muted} mt-2 mb-4`}>Storage: {event.storage}</p>
      <MediaLocationForm
        action={createMediaLocation}
        eventId={event.id}
        sessions={event.sessions.map((s) => ({ id: s.id, name: s.name }))}
        booths={event.booths.map((b) => ({ id: b.id, name: b.name }))}
        otherItems={event.otherItems.map((o) => ({ id: o.id, name: o.name }))}
        initial={{ sessionId, boothId, otherItemId, mediaType: 'PHOTO' }}
      />
    </div>
  )
}

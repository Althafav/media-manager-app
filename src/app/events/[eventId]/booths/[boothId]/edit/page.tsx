import { notFound } from 'next/navigation'
import { getBoothDetail } from '@/lib/data'
import { BoothForm } from '@/components/BoothForm'
import { Breadcrumbs } from '@/components/Breadcrumbs'
import { updateBooth } from '../../actions'
import * as ui from '@/lib/ui'

export default async function EditBoothPage({
  params,
}: {
  params: Promise<{ eventId: string; boothId: string }>
}) {
  const { eventId, boothId } = await params

  const booth = await getBoothDetail(boothId)
  if (!booth || booth.eventId !== eventId) notFound()

  return (
    <div className={ui.page}>
      <Breadcrumbs
        items={[
          { label: 'Events', href: '/events' },
          { label: booth.event.name, href: `/events/${eventId}` },
          { label: 'Booths', href: `/events/${eventId}/booths` },
          { label: booth.name, href: `/events/${eventId}/booths/${booth.id}` },
          { label: 'Edit' },
        ]}
      />
      <h1 className={ui.h1}>Edit booth</h1>
      <BoothForm action={updateBooth.bind(null, booth.id)} eventId={eventId} initial={{ name: booth.name }} />
    </div>
  )
}

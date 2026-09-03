import { notFound } from 'next/navigation'
import { getEventBasic } from '@/lib/data'
import { BoothForm } from '@/components/BoothForm'
import { Breadcrumbs } from '@/components/Breadcrumbs'
import { createBooth } from '../actions'
import * as ui from '@/lib/ui'

export default async function NewBoothPage({ params }: { params: Promise<{ eventId: string }> }) {
  const { eventId } = await params

  const event = await getEventBasic(eventId)
  if (!event) notFound()

  return (
    <div className={ui.page}>
      <Breadcrumbs
        items={[
          { label: 'Events', href: '/events' },
          { label: event.name, href: `/events/${event.id}` },
          { label: 'Booths', href: `/events/${event.id}/booths` },
          { label: 'Add' },
        ]}
      />
      <h1 className={ui.h1}>Add booth</h1>
      <BoothForm action={createBooth} eventId={event.id} />
    </div>
  )
}

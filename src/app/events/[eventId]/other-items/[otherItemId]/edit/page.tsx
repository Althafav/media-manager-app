import { notFound } from 'next/navigation'
import { getOtherItemDetail } from '@/lib/data'
import { OtherItemForm } from '@/components/OtherItemForm'
import { Breadcrumbs } from '@/components/Breadcrumbs'
import { updateOtherItem } from '../../actions'
import * as ui from '@/lib/ui'

export default async function EditOtherItemPage({
  params,
}: {
  params: Promise<{ eventId: string; otherItemId: string }>
}) {
  const { eventId, otherItemId } = await params

  const item = await getOtherItemDetail(otherItemId)
  if (!item || item.eventId !== eventId) notFound()

  return (
    <div className={ui.page}>
      <Breadcrumbs
        items={[
          { label: 'Events', href: '/events' },
          { label: item.event.name, href: `/events/${eventId}` },
          { label: 'Other Items', href: `/events/${eventId}/other-items` },
          { label: item.name, href: `/events/${eventId}/other-items/${item.id}` },
          { label: 'Edit' },
        ]}
      />
      <h1 className={ui.h1}>Edit item</h1>
      <OtherItemForm
        action={updateOtherItem.bind(null, item.id)}
        eventId={eventId}
        initial={{
          name: item.name,
          description: item.description ?? '',
          date: item.date.toISOString().slice(0, 10),
          time: item.time,
        }}
      />
    </div>
  )
}

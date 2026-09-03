import { notFound } from 'next/navigation'
import { getEventBasic } from '@/lib/data'
import { OtherItemForm } from '@/components/OtherItemForm'
import { Breadcrumbs } from '@/components/Breadcrumbs'
import { createOtherItem } from '../actions'
import * as ui from '@/lib/ui'

function todayDateString() {
  const now = new Date()
  const year = now.getFullYear()
  const month = String(now.getMonth() + 1).padStart(2, '0')
  const day = String(now.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

export default async function NewOtherItemPage({ params }: { params: Promise<{ eventId: string }> }) {
  const { eventId } = await params

  const event = await getEventBasic(eventId)
  if (!event) notFound()

  return (
    <div className={ui.page}>
      <Breadcrumbs
        items={[
          { label: 'Events', href: '/events' },
          { label: event.name, href: `/events/${event.id}` },
          { label: 'Other Items', href: `/events/${event.id}/other-items` },
          { label: 'Add' },
        ]}
      />
      <h1 className={ui.h1}>Add item</h1>
      <OtherItemForm action={createOtherItem} eventId={event.id} initial={{ date: todayDateString() }} />
    </div>
  )
}

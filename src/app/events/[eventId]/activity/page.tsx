import Link from 'next/link'
import { notFound } from 'next/navigation'
import { getEventBasic, getActivityLog } from '@/lib/data'
import { Breadcrumbs } from '@/components/Breadcrumbs'
import * as ui from '@/lib/ui'
import type { ActivityAction } from '@/generated/prisma/enums'

const ACTION_BADGE_CLASSES: Record<ActivityAction, string> = {
  CREATE: 'bg-ok text-paper',
  UPDATE: 'bg-accent text-paper',
  DELETE: 'bg-danger text-paper',
  SYNC: 'bg-accent-ink text-paper',
}

function viewHrefFor(eventId: string, entityType: string | null, entityId: string | null) {
  if (!entityType || !entityId) return undefined
  switch (entityType) {
    case 'session':
      return `/events/${eventId}/sessions/${entityId}`
    case 'booth':
      return `/events/${eventId}/booths/${entityId}`
    case 'other-item':
      return `/events/${eventId}/other-items/${entityId}`
    case 'media-location':
      return `/events/${eventId}/media-locations/${entityId}/edit`
    case 'event':
      return `/events/${eventId}`
    default:
      return undefined
  }
}

export default async function ActivityPage({ params }: { params: Promise<{ eventId: string }> }) {
  const { eventId } = await params

  const event = await getEventBasic(eventId)
  if (!event) notFound()

  const entries = await getActivityLog(eventId)

  return (
    <div className={ui.page}>
      <Breadcrumbs
        items={[
          { label: 'Events', href: '/events' },
          { label: event.name, href: `/events/${eventId}` },
          { label: 'Activity' },
        ]}
      />
      <h1 className={ui.h1}>Activity</h1>

      {entries.length === 0 ? (
        <p className={`${ui.muted} mt-4`}>No activity yet.</p>
      ) : (
        <div className={`${ui.sessionList} mt-4`}>
          {entries.map((entry) => {
            const viewHref = viewHrefFor(eventId, entry.entityType, entry.entityId)
            return (
              <div key={entry.id} className="flex flex-col gap-1.5 py-3 sm:flex-row sm:items-center sm:gap-3">
                <span className={ui.badgeClasses(ACTION_BADGE_CLASSES[entry.action])}>{entry.action}</span>
                <span className="flex-1">{entry.message}</span>
                <span className="font-mono text-xs text-ink-soft whitespace-nowrap">
                  {new Date(entry.createdAt).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' })}
                </span>
                {viewHref && (
                  <Link href={viewHref} className="text-xs hover:underline hover:decoration-accent">
                    View
                  </Link>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

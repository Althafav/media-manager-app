import Link from 'next/link'
import { notFound } from 'next/navigation'
import { getOtherItemDetail } from '@/lib/data'
import * as ui from '@/lib/ui'
import { mediaTypeBadgeClasses } from '@/lib/media-type-badge'
import { deleteOtherItem } from '../actions'
import { CopyButton } from '@/components/CopyButton'
import { ConfirmSubmitButton } from '@/components/ConfirmSubmitButton'
import { DeleteMediaLocationForm } from '@/components/DeleteMediaLocationForm'
import { QuickAddMediaLocationForm } from '@/components/QuickAddMediaLocationForm'
import { Breadcrumbs } from '@/components/Breadcrumbs'

export default async function OtherItemDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ eventId: string; otherItemId: string }>
  searchParams: Promise<{ mediaAdded?: string; mediaUpdated?: string; mediaDeleted?: string }>
}) {
  const { eventId, otherItemId } = await params
  const { mediaAdded, mediaUpdated, mediaDeleted } = await searchParams

  const item = await getOtherItemDetail(otherItemId)
  if (!item || item.eventId !== eventId) notFound()

  const returnTo = `/events/${eventId}/other-items/${otherItemId}`

  return (
    <div className={ui.page}>
      <Breadcrumbs
        items={[
          { label: 'Events', href: '/events' },
          { label: item.event.name, href: `/events/${eventId}` },
          { label: 'Other Items', href: `/events/${eventId}/other-items` },
          { label: item.name },
        ]}
      />
      <h1 className="text-3xl">{item.name}</h1>
      {mediaAdded && <p className={`${ui.bannerOk} mt-3`}>Media location added.</p>}
      {mediaUpdated && <p className={`${ui.bannerOk} mt-3`}>Media location updated.</p>}
      {mediaDeleted && <p className={`${ui.bannerOk} mt-3`}>Media location deleted.</p>}
      <p className={`${ui.muted} mt-2`}>
        {item.date.toLocaleDateString()} · {item.time}
      </p>
      {item.description && <p className={`${ui.muted} mt-2`}>{item.description}</p>}

      <div className="flex gap-2.5 mt-4">
        <Link href={`/events/${eventId}/other-items/${otherItemId}/edit`}>
          <button className={ui.button}>Edit item</button>
        </Link>
        <form action={deleteOtherItem.bind(null, eventId, otherItemId)}>
          <ConfirmSubmitButton
            className={ui.button}
            confirmMessage="Delete this item? Any media locations linked to it will be kept but unlinked from it."
          >
            Delete item
          </ConfirmSubmitButton>
        </form>
      </div>

      <h2 className={ui.h2}>Media Locations</h2>
      <p className={`${ui.muted} mb-3`}>Storage: {item.event.storage}</p>
      <Link href={`/events/${eventId}/media-locations/new?otherItemId=${item.id}`}>
        <button className={`${ui.button} mb-4`}>Add media location</button>
      </Link>

      {item.mediaLocations.length === 0 ? (
        <p className={ui.muted}>No media locations registered for this item yet.</p>
      ) : (
        item.mediaLocations.map((ml) => (
          <div key={ml.id} className={ui.card}>
            <span className={ui.badgeClasses(mediaTypeBadgeClasses(ml.mediaType))}>{ml.mediaType}</span>
            <p className="mt-2.5">
              {ml.folderPath}
              <CopyButton text={ml.folderPath} />
            </p>
            {ml.description && <p className={`${ui.muted} mt-2`}>{ml.description}</p>}
            {ml.tags.length > 0 && (
              <p className="mt-2.5">
                {ml.tags.map((tag) => (
                  <span key={tag} className={ui.badge}>
                    {tag}
                  </span>
                ))}
              </p>
            )}
            <div className="mt-2.5 flex items-center gap-3">
              <Link
                href={`/events/${eventId}/media-locations/${ml.id}/edit`}
                className="hover:underline hover:decoration-accent hover:decoration-2"
              >
                Edit
              </Link>
              <DeleteMediaLocationForm
                mediaLocationId={ml.id}
                eventId={eventId}
                returnTo={returnTo}
                className="text-sm text-danger hover:underline hover:decoration-accent hover:decoration-2"
              />
            </div>
          </div>
        ))
      )}

      <div className={`${ui.card} mt-2`}>
        <QuickAddMediaLocationForm eventId={eventId} otherItemId={otherItemId} returnTo={returnTo} />
      </div>
    </div>
  )
}

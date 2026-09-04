import Link from 'next/link'
import { mediaTypeBadgeClasses } from '@/lib/media-type-badge'
import { MEDIA_TYPE_ORDER, MEDIA_TYPE_LABELS, countByMediaType } from '@/lib/media-type-counts'
import { MediaLocationEntry } from '@/components/MediaLocationEntry'
import { QuickAddMediaLocationForm } from '@/components/QuickAddMediaLocationForm'
import { ConfirmSubmitButton } from '@/components/ConfirmSubmitButton'
import * as ui from '@/lib/ui'
import type { MediaType } from '@/generated/prisma/enums'

type MediaLocationSummary = {
  id: string
  mediaType: MediaType
  folderPath: string
  description: string | null
  notes: string | null
  tags: string[]
}

export type CoverageRowKind = 'session' | 'booth' | 'other-item'

export function CoverageRow({
  kind,
  eventId,
  id,
  name,
  detailHref,
  timeLabel,
  statusBadge,
  manualBadge,
  description,
  editHref,
  deleteAction,
  deleteConfirmMessage,
  mediaLocations,
  autoOpen,
  returnTo,
}: {
  kind: CoverageRowKind
  eventId: string
  id: string
  name: string
  detailHref: string
  timeLabel?: string
  statusBadge?: { label: string; className: string }
  manualBadge?: boolean
  description?: string
  editHref?: string
  deleteAction?: (formData: FormData) => Promise<void>
  deleteConfirmMessage?: string
  mediaLocations: MediaLocationSummary[]
  autoOpen?: boolean
  returnTo: string
}) {
  const logged = mediaLocations.length > 0
  const counts = countByMediaType(mediaLocations)

  // The three entity kinds are mutually exclusive, so exactly one of these props reaches
  // MediaLocationEntry/QuickAddMediaLocationForm depending on which row this is.
  const linkProps =
    kind === 'session' ? { sessionId: id } : kind === 'booth' ? { boothId: id } : { otherItemId: id }

  return (
    <details id={`${kind}-${id}`} open={autoOpen || undefined} className={`${ui.sessionRow} group`}>
      <summary className={ui.sessionRowSummary}>
        {timeLabel && <span className={ui.sessionRowTime}>{timeLabel}</span>}
        <span className="flex-1 min-w-0">
          <Link href={detailHref} className="hover:underline hover:decoration-accent hover:decoration-2">
            {name}
          </Link>
          {statusBadge && (
            <span className={ui.badgeClasses(`${statusBadge.className} ml-1.5`)}>{statusBadge.label}</span>
          )}
          {manualBadge && <span className={ui.badgeClasses('bg-rule text-ink ml-1.5')}>Manual</span>}
        </span>
        <div className="flex flex-col gap-1.5">
          {MEDIA_TYPE_ORDER.filter((type) => counts.has(type)).map((type) => (
            <div key={type} className="flex items-center gap-1.5">
              <span className={ui.badgeClasses(mediaTypeBadgeClasses(type))}>
                {counts.get(type)} {MEDIA_TYPE_LABELS[type]}
              </span>
            </div>
          ))}
        </div>
        <span aria-hidden className="transition-transform group-open:rotate-180 text-ink-soft">
          ⌄
        </span>
      </summary>

      <div className={ui.sessionRowBody}>
        {(editHref || deleteAction) && (
          <div className="flex gap-2.5 mb-3">
            {editHref && (
              <Link href={editHref}>
                <button className={ui.button}>Edit</button>
              </Link>
            )}
            {deleteAction && (
              <form action={deleteAction}>
                <ConfirmSubmitButton className={ui.button} confirmMessage={deleteConfirmMessage ?? 'Delete this?'}>
                  Delete
                </ConfirmSubmitButton>
              </form>
            )}
          </div>
        )}
        {description && <p className={`${ui.muted} mb-3`}>{description}</p>}
        {logged && (
          <div className="flex flex-col gap-1.5 mb-3">
            {mediaLocations.map((loc) => (
              <MediaLocationEntry key={loc.id} eventId={eventId} returnTo={returnTo} location={loc} {...linkProps} />
            ))}
          </div>
        )}
        <QuickAddMediaLocationForm eventId={eventId} returnTo={returnTo} {...linkProps} />
      </div>
    </details>
  )
}

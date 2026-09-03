'use client'

import { deleteMediaLocation } from '@/app/events/[eventId]/media-locations/actions'
import { ConfirmSubmitButton } from '@/components/ConfirmSubmitButton'

export function DeleteMediaLocationForm({
  mediaLocationId,
  eventId,
  returnTo,
  className,
}: {
  mediaLocationId: string
  eventId: string
  returnTo: string
  className?: string
}) {
  return (
    <form action={deleteMediaLocation.bind(null, mediaLocationId)}>
      <input type="hidden" name="eventId" value={eventId} />
      <input type="hidden" name="returnTo" value={returnTo} />
      <ConfirmSubmitButton
        className={className ?? 'text-xs text-danger hover:underline'}
        confirmMessage="Delete this media location? This cannot be undone."
      >
        Delete
      </ConfirmSubmitButton>
    </form>
  )
}

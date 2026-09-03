'use client'

import { useActionState, useState } from 'react'
import { TagInput } from '@/components/TagInput'
import { CopyButton } from '@/components/CopyButton'
import { DeleteMediaLocationForm } from '@/components/DeleteMediaLocationForm'
import { updateMediaLocation, type MediaLocationFormState } from '@/app/events/[eventId]/media-locations/actions'
import { mediaTypeBadgeClasses } from '@/lib/media-type-badge'
import { MEDIA_TYPE_OPTIONS } from '@/lib/media-type-options'
import * as ui from '@/lib/ui'
import type { MediaType } from '@/generated/prisma/enums'

type Location = {
  id: string
  mediaType: MediaType
  folderPath: string
  description: string | null
  notes: string | null
  tags: string[]
}

export function MediaLocationEntry({
  eventId,
  sessionId,
  boothId,
  otherItemId,
  returnTo,
  location,
}: {
  eventId: string
  sessionId?: string
  boothId?: string
  otherItemId?: string
  returnTo: string
  location: Location
}) {
  const [editing, setEditing] = useState(false)
  const [showMore, setShowMore] = useState(Boolean(location.description || location.notes || location.tags.length))
  const [state, formAction, pending] = useActionState<MediaLocationFormState, FormData>(
    updateMediaLocation.bind(null, location.id),
    {}
  )

  if (!editing) {
    return (
      <div className="flex items-center gap-2 text-sm flex-wrap">
        <span className={ui.badgeClasses(mediaTypeBadgeClasses(location.mediaType))}>{location.mediaType}</span>
        <span className="truncate">{location.folderPath}</span>
        <CopyButton text={location.folderPath} />
        <button
          type="button"
          onClick={() => setEditing(true)}
          className="text-xs hover:underline hover:decoration-accent"
        >
          Edit
        </button>
        <DeleteMediaLocationForm mediaLocationId={location.id} eventId={eventId} returnTo={returnTo} />
      </div>
    )
  }

  const values = state.values ?? {}

  return (
    <form action={formAction} className={ui.quickAddForm}>
      <input type="hidden" name="eventId" value={eventId} />
      {sessionId && <input type="hidden" name="sessionId" value={sessionId} />}
      {boothId && <input type="hidden" name="boothId" value={boothId} />}
      {otherItemId && <input type="hidden" name="otherItemId" value={otherItemId} />}
      <input type="hidden" name="returnTo" value={values.returnTo ?? returnTo} />

      <div className={ui.quickAddRow}>
        <input
          type="text"
          name="folderPath"
          placeholder="Folder path"
          defaultValue={values.folderPath ?? location.folderPath}
          required
          className={`${ui.input} md:flex-1`}
        />
        <div className={ui.radioGroup}>
          {MEDIA_TYPE_OPTIONS.map((option) => (
            <label key={option.value} className={ui.radioOption}>
              <input
                type="radio"
                name="mediaType"
                value={option.value}
                defaultChecked={(values.mediaType ?? location.mediaType) === option.value}
                required
                className={ui.radioInput}
              />
              {option.label}
            </label>
          ))}
        </div>
        <button type="submit" disabled={pending} className={ui.button}>
          {pending ? 'Saving…' : 'Save'}
        </button>
        <button type="button" onClick={() => setEditing(false)} className={ui.quickAddMoreToggle}>
          Cancel
        </button>
      </div>
      {state.errors?.folderPath && <span className={ui.errorText}>{state.errors.folderPath}</span>}

      <button type="button" onClick={() => setShowMore((v) => !v)} className={ui.quickAddMoreToggle}>
        {showMore ? 'Hide description, notes, tags' : 'Add description, notes, tags'}
      </button>

      {showMore && (
        <>
          <label className={ui.label}>
            Description
            <textarea
              name="description"
              defaultValue={values.description ?? location.description ?? ''}
              rows={2}
              className={ui.input}
            />
          </label>
          <label className={ui.label}>
            Notes
            <textarea name="notes" defaultValue={values.notes ?? location.notes ?? ''} rows={2} className={ui.input} />
          </label>
          <label className={ui.label}>
            Tags
            <TagInput name="tags" defaultTags={location.tags} />
          </label>
        </>
      )}

      {state.errors?.form && <p className={ui.bannerError}>{state.errors.form}</p>}
    </form>
  )
}

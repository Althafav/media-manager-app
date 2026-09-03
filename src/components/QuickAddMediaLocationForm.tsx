'use client'

import { useActionState, useState } from 'react'
import { TagInput } from '@/components/TagInput'
import { createMediaLocation, type MediaLocationFormState } from '@/app/events/[eventId]/media-locations/actions'
import { MEDIA_TYPE_OPTIONS } from '@/lib/media-type-options'
import * as ui from '@/lib/ui'

export function QuickAddMediaLocationForm({
  eventId,
  sessionId,
  returnTo,
}: {
  eventId: string
  sessionId: string
  returnTo: string
}) {
  const [state, formAction, pending] = useActionState<MediaLocationFormState, FormData>(createMediaLocation, {})
  const [showMore, setShowMore] = useState(false)

  const values = state.values ?? {}

  return (
    <form action={formAction} className={ui.quickAddForm}>
      <input type="hidden" name="eventId" value={eventId} />
      <input type="hidden" name="sessionId" value={sessionId} />
      <input type="hidden" name="returnTo" value={values.returnTo ?? returnTo} />

      <div className={ui.quickAddRow}>
        <input
          type="text"
          name="folderPath"
          placeholder="Folder path"
          defaultValue={values.folderPath}
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
                defaultChecked={(values.mediaType ?? 'PHOTO') === option.value}
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
      </div>
      {state.errors?.folderPath && <span className={ui.errorText}>{state.errors.folderPath}</span>}

      <button type="button" onClick={() => setShowMore((v) => !v)} className={ui.quickAddMoreToggle}>
        {showMore ? 'Hide description, notes, tags' : 'Add description, notes, tags'}
      </button>

      {showMore && (
        <>
          <label className={ui.label}>
            Description
            <textarea name="description" defaultValue={values.description} rows={2} className={ui.input} />
          </label>
          <label className={ui.label}>
            Notes
            <textarea name="notes" defaultValue={values.notes} rows={2} className={ui.input} />
          </label>
          <label className={ui.label}>
            Tags
            <TagInput name="tags" />
          </label>
        </>
      )}

      {state.errors?.form && <p className={ui.bannerError}>{state.errors.form}</p>}
    </form>
  )
}

'use client'

import { useActionState } from 'react'
import { TagInput } from '@/components/TagInput'
import { LinkPicker } from '@/components/LinkPicker'
import type { MediaLocationFormState } from '@/app/events/[eventId]/media-locations/actions'
import { MEDIA_TYPE_OPTIONS } from '@/lib/media-type-options'
import * as ui from '@/lib/ui'

type Option = { id: string; name: string }

export function MediaLocationForm({
  action,
  eventId,
  sessions,
  booths,
  otherItems,
  initial,
}: {
  action: (state: MediaLocationFormState, formData: FormData) => Promise<MediaLocationFormState>
  eventId: string
  sessions: Option[]
  booths: Option[]
  otherItems: Option[]
  initial?: {
    sessionId?: string
    boothId?: string
    otherItemId?: string
    folderPath?: string
    mediaType?: string
    description?: string
    notes?: string
    tags?: string[]
  }
}) {
  const [state, formAction, pending] = useActionState<MediaLocationFormState, FormData>(action, {
    values: initial
      ? { ...initial, sessionId: initial.sessionId ?? '', tags: (initial.tags ?? []).join(',') }
      : undefined,
  })

  const values = state.values ?? {}

  return (
    <form action={formAction} className={ui.formStack}>
      <input type="hidden" name="eventId" value={eventId} />

      <div className={ui.label}>
        Link to (optional)
        <LinkPicker
          sessions={sessions}
          booths={booths}
          otherItems={otherItems}
          defaultSessionId={values.sessionId ?? initial?.sessionId ?? ''}
          defaultBoothId={values.boothId ?? initial?.boothId ?? ''}
          defaultOtherItemId={values.otherItemId ?? initial?.otherItemId ?? ''}
        />
        {(state.errors?.sessionId ?? state.errors?.boothId ?? state.errors?.otherItemId) && (
          <span className={ui.errorText}>
            {state.errors?.sessionId ?? state.errors?.boothId ?? state.errors?.otherItemId}
          </span>
        )}
      </div>

      <label className={ui.label}>
        Folder path
        <input
          type="text"
          name="folderPath"
          defaultValue={values.folderPath ?? initial?.folderPath}
          required
          className={ui.input}
        />
        {state.errors?.folderPath && <span className={ui.errorText}>{state.errors.folderPath}</span>}
      </label>

      <div className={ui.label}>
        Media type
        <div className={ui.radioGroup}>
          {MEDIA_TYPE_OPTIONS.map((option) => (
            <label key={option.value} className={ui.radioOption}>
              <input
                type="radio"
                name="mediaType"
                value={option.value}
                defaultChecked={(values.mediaType ?? initial?.mediaType ?? 'PHOTO') === option.value}
                required
                className={ui.radioInput}
              />
              {option.label}
            </label>
          ))}
        </div>
        {state.errors?.mediaType && <span className={ui.errorText}>{state.errors.mediaType}</span>}
      </div>

      <label className={ui.label}>
        Description
        <textarea
          name="description"
          defaultValue={values.description ?? initial?.description}
          rows={2}
          className={ui.input}
        />
      </label>

      <label className={ui.label}>
        Notes
        <textarea
          name="notes"
          defaultValue={values.notes ?? initial?.notes}
          rows={2}
          className={ui.input}
        />
      </label>

      <label className={ui.label}>
        Tags
        <TagInput name="tags" defaultTags={initial?.tags ?? []} />
      </label>

      {state.errors?.form && <p className={ui.bannerError}>{state.errors.form}</p>}

      <button type="submit" disabled={pending} className={ui.button}>
        {pending ? 'Saving…' : 'Save'}
      </button>
    </form>
  )
}

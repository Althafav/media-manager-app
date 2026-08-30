'use client'

import { useActionState } from 'react'
import { TagInput } from '@/components/TagInput'
import type { MediaLocationFormState } from '@/app/events/[eventId]/media-locations/actions'
import * as ui from '@/lib/ui'

type SessionOption = { id: string; name: string }

export function MediaLocationForm({
  action,
  eventId,
  sessions,
  initial,
}: {
  action: (state: MediaLocationFormState, formData: FormData) => Promise<MediaLocationFormState>
  eventId: string
  sessions: SessionOption[]
  initial?: {
    sessionId?: string
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

      <label className={ui.label}>
        Session (optional)
        <select
          name="sessionId"
          defaultValue={values.sessionId ?? initial?.sessionId ?? ''}
          className={ui.input}
        >
          <option value="">— None (event-level) —</option>
          {sessions.map((s) => (
            <option key={s.id} value={s.id}>
              {s.name}
            </option>
          ))}
        </select>
        {state.errors?.sessionId && <span className={ui.errorText}>{state.errors.sessionId}</span>}
      </label>

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

      <label className={ui.label}>
        Media type
        <select
          name="mediaType"
          defaultValue={values.mediaType ?? initial?.mediaType ?? 'PHOTO'}
          required
          className={ui.input}
        >
          <option value="PHOTO">Photo</option>
          <option value="VIDEO">Video</option>
          <option value="MIXED">Mixed</option>
          <option value="OTHER">Other</option>
        </select>
        {state.errors?.mediaType && <span className={ui.errorText}>{state.errors.mediaType}</span>}
      </label>

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

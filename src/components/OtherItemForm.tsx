'use client'

import { useActionState } from 'react'
import type { OtherItemFormState } from '@/app/events/[eventId]/other-items/actions'
import * as ui from '@/lib/ui'

export function OtherItemForm({
  action,
  eventId,
  initial,
}: {
  action: (state: OtherItemFormState, formData: FormData) => Promise<OtherItemFormState>
  eventId: string
  initial?: {
    name?: string
    description?: string
    date?: string
    time?: string
  }
}) {
  const [state, formAction, pending] = useActionState<OtherItemFormState, FormData>(action, {
    values: initial ? { ...initial } : undefined,
  })

  const values = state.values ?? {}

  return (
    <form action={formAction} className={ui.formStack}>
      <input type="hidden" name="eventId" value={eventId} />

      <label className={ui.label}>
        Name
        <input
          type="text"
          name="name"
          defaultValue={values.name ?? initial?.name}
          required
          className={ui.input}
        />
        {state.errors?.name && <span className={ui.errorText}>{state.errors.name}</span>}
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
        Date
        <input
          type="date"
          name="date"
          defaultValue={values.date ?? initial?.date}
          required
          className={ui.input}
        />
        {state.errors?.date && <span className={ui.errorText}>{state.errors.date}</span>}
      </label>

      <label className={ui.label}>
        Time
        <input
          type="time"
          name="time"
          defaultValue={values.time ?? initial?.time}
          required
          className={ui.input}
        />
        {state.errors?.time && <span className={ui.errorText}>{state.errors.time}</span>}
      </label>

      {state.errors?.form && <p className={ui.bannerError}>{state.errors.form}</p>}

      <button type="submit" disabled={pending} className={ui.button}>
        {pending ? 'Saving…' : 'Save'}
      </button>
    </form>
  )
}

'use client'

import { useActionState } from 'react'
import type { BoothFormState } from '@/app/events/[eventId]/booths/actions'
import * as ui from '@/lib/ui'

export function BoothForm({
  action,
  eventId,
  initial,
}: {
  action: (state: BoothFormState, formData: FormData) => Promise<BoothFormState>
  eventId: string
  initial?: { name?: string }
}) {
  const [state, formAction, pending] = useActionState<BoothFormState, FormData>(action, {
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

      {state.errors?.form && <p className={ui.bannerError}>{state.errors.form}</p>}

      <button type="submit" disabled={pending} className={ui.button}>
        {pending ? 'Saving…' : 'Save'}
      </button>
    </form>
  )
}

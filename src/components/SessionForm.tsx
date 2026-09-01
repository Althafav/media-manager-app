'use client'

import { useActionState } from 'react'
import type { SessionFormState } from '@/app/events/[eventId]/sessions/actions'
import * as ui from '@/lib/ui'

type Option = { id: string; name: string }

export function SessionForm({
  action,
  eventId,
  rooms,
  tracks,
  initial,
}: {
  action: (state: SessionFormState, formData: FormData) => Promise<SessionFormState>
  eventId: string
  rooms: Option[]
  tracks: Option[]
  initial?: {
    name?: string
    date?: string
    startTime?: string
    endTime?: string
    roomId?: string
    trackId?: string
  }
}) {
  const [state, formAction, pending] = useActionState<SessionFormState, FormData>(action, {
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
        Start time
        <input
          type="time"
          name="startTime"
          defaultValue={values.startTime ?? initial?.startTime}
          required
          className={ui.input}
        />
        {state.errors?.startTime && <span className={ui.errorText}>{state.errors.startTime}</span>}
      </label>

      <label className={ui.label}>
        End time
        <input
          type="time"
          name="endTime"
          defaultValue={values.endTime ?? initial?.endTime}
          required
          className={ui.input}
        />
        {state.errors?.endTime && <span className={ui.errorText}>{state.errors.endTime}</span>}
      </label>

      <label className={ui.label}>
        Room (optional)
        <select name="roomId" defaultValue={values.roomId ?? initial?.roomId ?? ''} className={ui.input}>
          <option value="">— None —</option>
          {rooms.map((r) => (
            <option key={r.id} value={r.id}>
              {r.name}
            </option>
          ))}
        </select>
        {state.errors?.roomId && <span className={ui.errorText}>{state.errors.roomId}</span>}
      </label>

      <label className={ui.label}>
        Track (optional)
        <select name="trackId" defaultValue={values.trackId ?? initial?.trackId ?? ''} className={ui.input}>
          <option value="">— None —</option>
          {tracks.map((t) => (
            <option key={t.id} value={t.id}>
              {t.name}
            </option>
          ))}
        </select>
        {state.errors?.trackId && <span className={ui.errorText}>{state.errors.trackId}</span>}
      </label>

      {state.errors?.form && <p className={ui.bannerError}>{state.errors.form}</p>}

      <button type="submit" disabled={pending} className={ui.button}>
        {pending ? 'Saving…' : 'Save'}
      </button>
    </form>
  )
}

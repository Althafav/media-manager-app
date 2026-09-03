'use client'

import { useActionState, useState } from 'react'
import { updateEventStorage, type UpdateEventStorageState } from '@/app/events/[eventId]/actions'
import * as ui from '@/lib/ui'

export function EventStorageField({ eventId, storage }: { eventId: string; storage: string }) {
  const [editing, setEditing] = useState(false)
  const [state, formAction, pending] = useActionState<UpdateEventStorageState, FormData>(
    updateEventStorage.bind(null, eventId),
    {}
  )

  if (!editing) {
    return (
      <p className={`${ui.muted} mt-2 flex items-center gap-2`}>
        Storage: {storage}
        <button
          type="button"
          onClick={() => setEditing(true)}
          aria-label="Edit storage"
          title="Edit storage"
          className={ui.iconButton}
        >
          <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-3.5 h-3.5">
            <path
              d="M13.5 3.5 16.5 6.5 6.5 16.5H3.5V13.5L13.5 3.5Z"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </button>
      </p>
    )
  }

  return (
    <form action={formAction} className="flex items-start gap-2 mt-2">
      <label className={ui.label}>
        Storage
        <input type="text" name="storage" defaultValue={state.values?.storage ?? storage} required className={ui.input} />
        {state.errors?.storage && <span className={ui.errorText}>{state.errors.storage}</span>}
      </label>
      <button type="submit" disabled={pending} className={ui.button}>
        {pending ? 'Saving…' : 'Save'}
      </button>
      <button type="button" onClick={() => setEditing(false)} className={ui.quickAddMoreToggle}>
        Cancel
      </button>
      {state.errors?.form && <p className={ui.bannerError}>{state.errors.form}</p>}
    </form>
  )
}

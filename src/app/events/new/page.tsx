'use client'

import Link from 'next/link'
import { useActionState } from 'react'
import { createAndSyncEvent, type NewEventState } from './actions'
import * as ui from '@/lib/ui'

const initialState: NewEventState = {}

export default function NewEventPage() {
  const [state, formAction, pending] = useActionState(createAndSyncEvent, initialState)

  return (
    <div className={ui.page}>
      <Link href="/events" className={ui.backLink}>
        &larr; Events
      </Link>
      <h1 className={ui.h1}>Add event</h1>
      <p className={`${ui.muted} mb-4`}>
        Enter the EventId (GUID) from the agenda API. This will fetch and store its sessions,
        rooms, and tracks.
      </p>

      <form action={formAction} className={ui.formStack}>
        <label className={ui.label}>
          EventId (GUID)
          <input
            type="text"
            name="eventExternalId"
            placeholder="1f9e118d-c029-4a09-801a-eb20fe0f82f7"
            defaultValue={state.values?.eventExternalId}
            required
            className={ui.input}
          />
          {state.errors?.eventExternalId && <span className={ui.errorText}>{state.errors.eventExternalId}</span>}
        </label>

        <label className={ui.label}>
          Event name
          <input type="text" name="name" defaultValue={state.values?.name} required className={ui.input} />
          {state.errors?.name && <span className={ui.errorText}>{state.errors.name}</span>}
        </label>

        <label className={ui.label}>
          Storage
          <input
            type="text"
            name="storage"
            placeholder="Field SSD 01"
            defaultValue={state.values?.storage}
            required
            className={ui.input}
          />
          {state.errors?.storage && <span className={ui.errorText}>{state.errors.storage}</span>}
        </label>

        {state.errors?.form && <p className={ui.bannerError}>{state.errors.form}</p>}

        <button type="submit" disabled={pending} className={ui.button}>
          {pending ? 'Syncing…' : 'Add & sync'}
        </button>
      </form>
    </div>
  )
}

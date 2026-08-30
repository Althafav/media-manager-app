'use server'

import { redirect } from 'next/navigation'
import { syncAgendaForEvent } from '@/lib/sync/agenda-sync'
import { newEventSchema } from '@/lib/validation/event'

export type NewEventState = {
  errors?: Partial<Record<'eventExternalId' | 'name' | 'storage' | 'form', string>>
  values?: { eventExternalId: string; name: string; storage: string }
}

export async function createAndSyncEvent(_prevState: NewEventState, formData: FormData): Promise<NewEventState> {
  const raw = {
    eventExternalId: String(formData.get('eventExternalId') ?? ''),
    name: String(formData.get('name') ?? ''),
    storage: String(formData.get('storage') ?? ''),
  }

  const parsed = newEventSchema.safeParse(raw)
  if (!parsed.success) {
    const fieldErrors = parsed.error.flatten().fieldErrors
    return {
      values: raw,
      errors: {
        eventExternalId: fieldErrors.eventExternalId?.[0],
        name: fieldErrors.name?.[0],
        storage: fieldErrors.storage?.[0],
      },
    }
  }

  let eventId: string
  try {
    const result = await syncAgendaForEvent(parsed.data.eventExternalId, parsed.data.name, parsed.data.storage)
    eventId = result.eventId
  } catch (err) {
    console.error('Agenda sync failed while creating event', err)
    return {
      values: raw,
      errors: { form: 'Could not sync this event from the agenda API. Check the EventId and try again.' },
    }
  }

  redirect(`/events/${eventId}?added=1`)
}

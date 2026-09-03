'use server'

import { redirect } from 'next/navigation'
import { revalidatePath, updateTag } from 'next/cache'
import { prisma } from '@/lib/prisma'
import { syncAgendaForEvent } from '@/lib/sync/agenda-sync'
import { updateEventStorageSchema } from '@/lib/validation/event'

export async function resyncEvent(eventId: string) {
  const event = await prisma.event.findUniqueOrThrow({ where: { id: eventId } })
  await syncAgendaForEvent(event.externalId, event.name)
  updateTag('events')
  updateTag(`event:${eventId}`)
  revalidatePath(`/events/${eventId}`)
}

export type UpdateEventStorageState = {
  errors?: Partial<Record<'storage' | 'form', string>>
  values?: { storage: string }
}

export async function updateEventStorage(
  eventId: string,
  _prevState: UpdateEventStorageState,
  formData: FormData
): Promise<UpdateEventStorageState> {
  const raw = { storage: String(formData.get('storage') ?? '') }
  const parsed = updateEventStorageSchema.safeParse(raw)
  if (!parsed.success) {
    return { values: raw, errors: { storage: parsed.error.flatten().fieldErrors.storage?.[0] } }
  }

  try {
    await prisma.event.update({ where: { id: eventId }, data: { storage: parsed.data.storage } })
  } catch {
    return { values: raw, errors: { form: 'Could not save storage. Please try again.' } }
  }

  updateTag('events')
  updateTag(`event:${eventId}`)
  revalidatePath(`/events/${eventId}`)
  redirect(`/events/${eventId}?storageUpdated=1`)
}

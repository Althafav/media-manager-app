'use server'

import { redirect } from 'next/navigation'
import { revalidatePath, updateTag } from 'next/cache'
import { prisma } from '@/lib/prisma'
import { performEventSync } from '@/lib/sync/perform-event-sync'
import { updateEventStorageSchema } from '@/lib/validation/event'
import { logActivity } from '@/lib/activity-log'

export async function resyncEvent(eventId: string) {
  const result = await performEventSync(eventId)
  if (!result.ok) redirect(`/events/${eventId}?syncFailed=1`)
  redirect(`/events/${eventId}?synced=1`)
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

  await logActivity({
    eventId,
    action: 'UPDATE',
    message: `Storage updated to "${parsed.data.storage}".`,
    entityType: 'event',
    entityId: eventId,
  })

  updateTag('events')
  updateTag(`event:${eventId}`)
  updateTag(`activity:${eventId}`)
  revalidatePath(`/events/${eventId}`)
  revalidatePath(`/events/${eventId}/activity`)
  redirect(`/events/${eventId}?storageUpdated=1`)
}

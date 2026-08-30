'use server'

import { revalidatePath } from 'next/cache'
import { prisma } from '@/lib/prisma'
import { syncAgendaForEvent } from '@/lib/sync/agenda-sync'

export async function resyncEvent(eventId: string) {
  const event = await prisma.event.findUniqueOrThrow({ where: { id: eventId } })
  await syncAgendaForEvent(event.externalId, event.name)
  revalidatePath(`/events/${eventId}`)
}

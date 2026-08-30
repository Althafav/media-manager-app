'use server'

import { revalidatePath, updateTag } from 'next/cache'
import { prisma } from '@/lib/prisma'
import { syncAgendaForEvent } from '@/lib/sync/agenda-sync'

export async function resyncEvent(eventId: string) {
  const event = await prisma.event.findUniqueOrThrow({ where: { id: eventId } })
  await syncAgendaForEvent(event.externalId, event.name)
  updateTag('events')
  updateTag(`event:${eventId}`)
  revalidatePath(`/events/${eventId}`)
}

'use server'

import { redirect } from 'next/navigation'
import { revalidatePath, updateTag } from 'next/cache'
import { prisma } from '@/lib/prisma'
import { SessionStatus } from '@/generated/prisma/enums'

const VALID_STATUSES = new Set<string>(Object.values(SessionStatus))

export async function updateSessionStatus(eventId: string, sessionId: string, formData: FormData) {
  const status = String(formData.get('status') ?? '')
  if (!VALID_STATUSES.has(status)) throw new Error('Invalid session status')

  await prisma.session.update({
    where: { id: sessionId },
    data: { status: status as SessionStatus },
  })

  updateTag(`event:${eventId}`)
  updateTag(`session:${sessionId}`)
  revalidatePath(`/events/${eventId}`)
  revalidatePath(`/events/${eventId}/sessions/${sessionId}`)
  redirect(`/events/${eventId}/sessions/${sessionId}?statusUpdated=1`)
}

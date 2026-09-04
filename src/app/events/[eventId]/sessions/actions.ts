'use server'

import { redirect } from 'next/navigation'
import { revalidatePath, updateTag } from 'next/cache'
import { prisma } from '@/lib/prisma'
import { sessionInputSchema } from '@/lib/validation/session'
import { logActivity } from '@/lib/activity-log'

export type SessionFormState = {
  errors?: Partial<Record<'name' | 'date' | 'startTime' | 'endTime' | 'roomId' | 'trackId' | 'form', string>>
  values?: Record<string, string>
}

type ParseResult = ReturnType<typeof sessionInputSchema.safeParse>
type ParseFailure = Extract<ParseResult, { success: false }>

function parseForm(formData: FormData) {
  const raw = {
    eventId: String(formData.get('eventId') ?? ''),
    name: String(formData.get('name') ?? ''),
    date: String(formData.get('date') ?? ''),
    startTime: String(formData.get('startTime') ?? ''),
    endTime: String(formData.get('endTime') ?? ''),
    roomId: String(formData.get('roomId') ?? ''),
    trackId: String(formData.get('trackId') ?? ''),
  }
  return { raw, parsed: sessionInputSchema.safeParse(raw) }
}

function fieldErrorsFrom(parsed: ParseFailure): SessionFormState['errors'] {
  const fieldErrors = parsed.error.flatten().fieldErrors
  return {
    name: fieldErrors.name?.[0],
    date: fieldErrors.date?.[0],
    startTime: fieldErrors.startTime?.[0],
    endTime: fieldErrors.endTime?.[0],
    roomId: fieldErrors.roomId?.[0],
    trackId: fieldErrors.trackId?.[0],
  }
}

function randomManualExternalId() {
  return -Math.floor(Math.random() * 2_000_000_000) - 1
}

async function createManualSession(data: {
  eventId: string
  name: string
  date: Date
  startTime: string
  endTime: string
  roomId?: string
  trackId?: string
}) {
  for (let attempt = 0; attempt < 5; attempt++) {
    try {
      return await prisma.session.create({
        data: {
          eventId: data.eventId,
          externalId: randomManualExternalId(),
          isManual: true,
          name: data.name,
          date: data.date,
          startTime: data.startTime,
          endTime: data.endTime,
          roomId: data.roomId ?? null,
          trackId: data.trackId ?? null,
        },
      })
    } catch (err) {
      const isUniqueViolation = typeof err === 'object' && err !== null && 'code' in err && err.code === 'P2002'
      if (!isUniqueViolation || attempt === 4) throw err
    }
  }
  throw new Error('unreachable')
}

export async function createSession(_prevState: SessionFormState, formData: FormData): Promise<SessionFormState> {
  const { raw, parsed } = parseForm(formData)
  if (!parsed.success) return { values: raw, errors: fieldErrorsFrom(parsed) }

  let session
  try {
    session = await createManualSession({
      eventId: parsed.data.eventId,
      name: parsed.data.name,
      date: new Date(parsed.data.date),
      startTime: parsed.data.startTime,
      endTime: parsed.data.endTime,
      roomId: parsed.data.roomId,
      trackId: parsed.data.trackId,
    })
  } catch {
    return { values: raw, errors: { form: 'Could not save this session. Please try again.' } }
  }

  await logActivity({
    eventId: parsed.data.eventId,
    action: 'CREATE',
    message: `Added session "${session.name}".`,
    entityType: 'session',
    entityId: session.id,
  })

  updateTag('events')
  updateTag(`event:${parsed.data.eventId}`)
  updateTag(`activity:${parsed.data.eventId}`)
  revalidatePath(`/events/${parsed.data.eventId}`)
  revalidatePath(`/events/${parsed.data.eventId}/sessions`)
  revalidatePath(`/events/${parsed.data.eventId}/activity`)
  redirect(`/events/${parsed.data.eventId}/sessions?sessionAdded=1`)
}

export async function updateSession(
  sessionId: string,
  _prevState: SessionFormState,
  formData: FormData
): Promise<SessionFormState> {
  const { raw, parsed } = parseForm(formData)
  if (!parsed.success) return { values: raw, errors: fieldErrorsFrom(parsed) }

  const existing = await prisma.session.findUnique({
    where: { id: sessionId },
    select: { isManual: true, eventId: true },
  })
  if (!existing || !existing.isManual || existing.eventId !== parsed.data.eventId) {
    return { values: raw, errors: { form: 'Only manually-added sessions can be edited.' } }
  }

  try {
    await prisma.session.update({
      where: { id: sessionId },
      data: {
        name: parsed.data.name,
        date: new Date(parsed.data.date),
        startTime: parsed.data.startTime,
        endTime: parsed.data.endTime,
        roomId: parsed.data.roomId ?? null,
        trackId: parsed.data.trackId ?? null,
      },
    })
  } catch {
    return { values: raw, errors: { form: 'Could not save changes. Please try again.' } }
  }

  await logActivity({
    eventId: parsed.data.eventId,
    action: 'UPDATE',
    message: `Updated session "${parsed.data.name}".`,
    entityType: 'session',
    entityId: sessionId,
  })

  updateTag('events')
  updateTag(`event:${parsed.data.eventId}`)
  updateTag(`session:${sessionId}`)
  updateTag(`activity:${parsed.data.eventId}`)
  revalidatePath(`/events/${parsed.data.eventId}`)
  revalidatePath(`/events/${parsed.data.eventId}/sessions`)
  revalidatePath(`/events/${parsed.data.eventId}/sessions/${sessionId}`)
  revalidatePath(`/events/${parsed.data.eventId}/activity`)
  redirect(`/events/${parsed.data.eventId}/sessions/${sessionId}?updated=1`)
}

export async function deleteSession(eventId: string, sessionId: string) {
  const existing = await prisma.session.findUnique({
    where: { id: sessionId },
    select: { isManual: true, eventId: true, name: true },
  })
  if (!existing || !existing.isManual || existing.eventId !== eventId) {
    throw new Error('Only manually-added sessions can be deleted')
  }

  await prisma.$transaction([
    prisma.mediaLocation.updateMany({ where: { sessionId }, data: { sessionId: null } }),
    prisma.session.delete({ where: { id: sessionId } }),
  ])

  await logActivity({
    eventId,
    action: 'DELETE',
    message: `Deleted session "${existing.name}".`,
    entityType: 'session',
    entityId: sessionId,
  })

  updateTag('events')
  updateTag(`event:${eventId}`)
  updateTag(`session:${sessionId}`)
  updateTag(`media-locations:${eventId}`)
  updateTag(`activity:${eventId}`)
  revalidatePath(`/events/${eventId}`)
  revalidatePath(`/events/${eventId}/sessions`)
  revalidatePath(`/events/${eventId}/media-locations`)
  revalidatePath(`/events/${eventId}/activity`)
  redirect(`/events/${eventId}/sessions?sessionDeleted=1`)
}

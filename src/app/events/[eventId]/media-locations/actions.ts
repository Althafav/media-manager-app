'use server'

import { redirect } from 'next/navigation'
import { revalidatePath, updateTag } from 'next/cache'
import { prisma } from '@/lib/prisma'
import { mediaLocationInputSchema } from '@/lib/validation/media-location'

export type MediaLocationFormState = {
  errors?: Partial<Record<'folderPath' | 'mediaType' | 'sessionId' | 'boothId' | 'otherItemId' | 'form', string>>
  values?: Record<string, string>
}

type ParseResult = ReturnType<typeof mediaLocationInputSchema.safeParse>
type ParseFailure = Extract<ParseResult, { success: false }>

function parseForm(formData: FormData) {
  const raw = {
    eventId: String(formData.get('eventId') ?? ''),
    sessionId: String(formData.get('sessionId') ?? ''),
    boothId: String(formData.get('boothId') ?? ''),
    otherItemId: String(formData.get('otherItemId') ?? ''),
    folderPath: String(formData.get('folderPath') ?? ''),
    mediaType: String(formData.get('mediaType') ?? ''),
    description: String(formData.get('description') ?? ''),
    notes: String(formData.get('notes') ?? ''),
    tags: String(formData.get('tags') ?? ''),
    returnTo: String(formData.get('returnTo') ?? ''),
  }
  return { raw, parsed: mediaLocationInputSchema.safeParse(raw) }
}

// A same-event relative path (optionally with a query string) to redirect back to after a
// successful create, instead of the default media-locations list. Guards against open-redirect
// by requiring it stay scoped to this event's own routes.
function resolveReturnTo(returnTo: string, eventId: string) {
  return returnTo.startsWith(`/events/${eventId}`) ? returnTo : undefined
}

// Carries the added-to session's id (not just a boolean) so the event page can both show the
// success banner and, server-side, auto-expand + scroll to that exact session row — a URL hash
// alone isn't reliable here since it never reaches the server and client-side router hash
// scrolling isn't guaranteed to fire after a server action's redirect.
function withMediaAdded(path: string, sessionId: string) {
  const separator = path.includes('?') ? '&' : '?'
  return `${path}${separator}mediaAdded=${encodeURIComponent(sessionId)}`
}

function withMediaUpdated(path: string, sessionId: string) {
  const separator = path.includes('?') ? '&' : '?'
  return `${path}${separator}mediaUpdated=${encodeURIComponent(sessionId)}`
}

function withMediaDeleted(path: string) {
  const separator = path.includes('?') ? '&' : '?'
  return `${path}${separator}mediaDeleted=1`
}

// Booth/item pages don't need to scroll/auto-expand to a specific row (unlike the event page's
// per-session accordions), so these just carry a boolean flag for the success banner.
function withMediaAddedFlag(path: string) {
  const separator = path.includes('?') ? '&' : '?'
  return `${path}${separator}mediaAdded=1`
}

function withMediaUpdatedFlag(path: string) {
  const separator = path.includes('?') ? '&' : '?'
  return `${path}${separator}mediaUpdated=1`
}

function fieldErrorsFrom(parsed: ParseFailure): MediaLocationFormState['errors'] {
  const fieldErrors = parsed.error.flatten().fieldErrors
  return {
    folderPath: fieldErrors.folderPath?.[0],
    mediaType: fieldErrors.mediaType?.[0],
    sessionId: fieldErrors.sessionId?.[0],
    boothId: fieldErrors.boothId?.[0],
    otherItemId: fieldErrors.otherItemId?.[0],
  }
}

export async function createMediaLocation(
  _prevState: MediaLocationFormState,
  formData: FormData
): Promise<MediaLocationFormState> {
  const { raw, parsed } = parseForm(formData)
  if (!parsed.success) return { values: raw, errors: fieldErrorsFrom(parsed) }

  try {
    await prisma.mediaLocation.create({ data: parsed.data })
  } catch {
    return { values: raw, errors: { form: 'Could not save this media location. Please try again.' } }
  }

  updateTag('events')
  updateTag(`event:${parsed.data.eventId}`)
  updateTag(`media-locations:${parsed.data.eventId}`)
  if (parsed.data.sessionId) updateTag(`session:${parsed.data.sessionId}`)
  if (parsed.data.boothId) updateTag(`booth:${parsed.data.boothId}`)
  if (parsed.data.otherItemId) updateTag(`other-item:${parsed.data.otherItemId}`)

  const returnTo = resolveReturnTo(raw.returnTo, parsed.data.eventId)
  revalidatePath(returnTo ?? `/events/${parsed.data.eventId}/media-locations`)
  if (parsed.data.sessionId) {
    revalidatePath(`/events/${parsed.data.eventId}/sessions/${parsed.data.sessionId}`)
  }
  if (parsed.data.boothId) {
    revalidatePath(`/events/${parsed.data.eventId}/booths/${parsed.data.boothId}`)
  }
  if (parsed.data.otherItemId) {
    revalidatePath(`/events/${parsed.data.eventId}/other-items/${parsed.data.otherItemId}`)
  }
  if (returnTo && parsed.data.sessionId) redirect(withMediaAdded(returnTo, parsed.data.sessionId))
  if (returnTo && (parsed.data.boothId || parsed.data.otherItemId)) redirect(withMediaAddedFlag(returnTo))
  if (returnTo) redirect(returnTo)
  redirect(`/events/${parsed.data.eventId}/media-locations?added=1`)
}

export async function updateMediaLocation(
  mediaLocationId: string,
  _prevState: MediaLocationFormState,
  formData: FormData
): Promise<MediaLocationFormState> {
  const { raw, parsed } = parseForm(formData)
  if (!parsed.success) return { values: raw, errors: fieldErrorsFrom(parsed) }

  let previousSessionId: string | null = null
  let previousBoothId: string | null = null
  let previousOtherItemId: string | null = null
  try {
    const existing = await prisma.mediaLocation.findUnique({
      where: { id: mediaLocationId },
      select: { sessionId: true, boothId: true, otherItemId: true },
    })
    previousSessionId = existing?.sessionId ?? null
    previousBoothId = existing?.boothId ?? null
    previousOtherItemId = existing?.otherItemId ?? null
    await prisma.mediaLocation.update({ where: { id: mediaLocationId }, data: parsed.data })
  } catch {
    return { values: raw, errors: { form: 'Could not save changes. Please try again.' } }
  }

  updateTag('events')
  updateTag(`event:${parsed.data.eventId}`)
  updateTag(`media-locations:${parsed.data.eventId}`)
  updateTag(`media-location:${mediaLocationId}`)
  if (parsed.data.sessionId) updateTag(`session:${parsed.data.sessionId}`)
  if (previousSessionId && previousSessionId !== parsed.data.sessionId) {
    updateTag(`session:${previousSessionId}`)
  }
  if (parsed.data.boothId) updateTag(`booth:${parsed.data.boothId}`)
  if (previousBoothId && previousBoothId !== parsed.data.boothId) {
    updateTag(`booth:${previousBoothId}`)
  }
  if (parsed.data.otherItemId) updateTag(`other-item:${parsed.data.otherItemId}`)
  if (previousOtherItemId && previousOtherItemId !== parsed.data.otherItemId) {
    updateTag(`other-item:${previousOtherItemId}`)
  }
  const returnTo = resolveReturnTo(raw.returnTo, parsed.data.eventId)
  revalidatePath(returnTo ?? `/events/${parsed.data.eventId}/media-locations`)
  if (parsed.data.sessionId) {
    revalidatePath(`/events/${parsed.data.eventId}/sessions/${parsed.data.sessionId}`)
  }
  if (parsed.data.boothId) {
    revalidatePath(`/events/${parsed.data.eventId}/booths/${parsed.data.boothId}`)
  }
  if (previousBoothId && previousBoothId !== parsed.data.boothId) {
    revalidatePath(`/events/${parsed.data.eventId}/booths/${previousBoothId}`)
  }
  if (parsed.data.otherItemId) {
    revalidatePath(`/events/${parsed.data.eventId}/other-items/${parsed.data.otherItemId}`)
  }
  if (previousOtherItemId && previousOtherItemId !== parsed.data.otherItemId) {
    revalidatePath(`/events/${parsed.data.eventId}/other-items/${previousOtherItemId}`)
  }
  if (returnTo && parsed.data.sessionId) redirect(withMediaUpdated(returnTo, parsed.data.sessionId))
  if (returnTo && (parsed.data.boothId || parsed.data.otherItemId)) redirect(withMediaUpdatedFlag(returnTo))
  if (returnTo) redirect(returnTo)
  redirect(`/events/${parsed.data.eventId}/media-locations?updated=1`)
}

export async function deleteMediaLocation(mediaLocationId: string, formData: FormData) {
  const eventId = String(formData.get('eventId') ?? '')
  const returnTo = String(formData.get('returnTo') ?? '')

  const existing = await prisma.mediaLocation.findUnique({
    where: { id: mediaLocationId },
    select: { eventId: true, sessionId: true, boothId: true, otherItemId: true },
  })
  const resolvedEventId = existing?.eventId ?? eventId

  if (existing) {
    await prisma.mediaLocation.delete({ where: { id: mediaLocationId } })

    updateTag('events')
    updateTag(`event:${existing.eventId}`)
    updateTag(`media-locations:${existing.eventId}`)
    updateTag(`media-location:${mediaLocationId}`)
    if (existing.sessionId) {
      updateTag(`session:${existing.sessionId}`)
      revalidatePath(`/events/${existing.eventId}/sessions/${existing.sessionId}`)
    }
    if (existing.boothId) {
      updateTag(`booth:${existing.boothId}`)
      revalidatePath(`/events/${existing.eventId}/booths/${existing.boothId}`)
    }
    if (existing.otherItemId) {
      updateTag(`other-item:${existing.otherItemId}`)
      revalidatePath(`/events/${existing.eventId}/other-items/${existing.otherItemId}`)
    }
  }

  const resolvedReturnTo = resolveReturnTo(returnTo, resolvedEventId)
  revalidatePath(resolvedReturnTo ?? `/events/${resolvedEventId}/media-locations`)
  redirect(resolvedReturnTo ? withMediaDeleted(resolvedReturnTo) : `/events/${resolvedEventId}/media-locations?deleted=1`)
}

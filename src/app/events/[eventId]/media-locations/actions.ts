'use server'

import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'
import { prisma } from '@/lib/prisma'
import { mediaLocationInputSchema } from '@/lib/validation/media-location'

export type MediaLocationFormState = {
  errors?: Partial<Record<'folderPath' | 'mediaType' | 'sessionId' | 'form', string>>
  values?: Record<string, string>
}

type ParseResult = ReturnType<typeof mediaLocationInputSchema.safeParse>
type ParseFailure = Extract<ParseResult, { success: false }>

function parseForm(formData: FormData) {
  const raw = {
    eventId: String(formData.get('eventId') ?? ''),
    sessionId: String(formData.get('sessionId') ?? ''),
    folderPath: String(formData.get('folderPath') ?? ''),
    mediaType: String(formData.get('mediaType') ?? ''),
    description: String(formData.get('description') ?? ''),
    notes: String(formData.get('notes') ?? ''),
    tags: String(formData.get('tags') ?? ''),
  }
  return { raw, parsed: mediaLocationInputSchema.safeParse(raw) }
}

function fieldErrorsFrom(parsed: ParseFailure): MediaLocationFormState['errors'] {
  const fieldErrors = parsed.error.flatten().fieldErrors
  return {
    folderPath: fieldErrors.folderPath?.[0],
    mediaType: fieldErrors.mediaType?.[0],
    sessionId: fieldErrors.sessionId?.[0],
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

  revalidatePath(`/events/${parsed.data.eventId}/media-locations`)
  if (parsed.data.sessionId) {
    revalidatePath(`/events/${parsed.data.eventId}/sessions/${parsed.data.sessionId}`)
  }
  redirect(`/events/${parsed.data.eventId}/media-locations?added=1`)
}

export async function updateMediaLocation(
  mediaLocationId: string,
  _prevState: MediaLocationFormState,
  formData: FormData
): Promise<MediaLocationFormState> {
  const { raw, parsed } = parseForm(formData)
  if (!parsed.success) return { values: raw, errors: fieldErrorsFrom(parsed) }

  try {
    await prisma.mediaLocation.update({ where: { id: mediaLocationId }, data: parsed.data })
  } catch {
    return { values: raw, errors: { form: 'Could not save changes. Please try again.' } }
  }

  revalidatePath(`/events/${parsed.data.eventId}/media-locations`)
  if (parsed.data.sessionId) {
    revalidatePath(`/events/${parsed.data.eventId}/sessions/${parsed.data.sessionId}`)
  }
  redirect(`/events/${parsed.data.eventId}/media-locations?updated=1`)
}

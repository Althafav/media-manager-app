'use server'

import { redirect } from 'next/navigation'
import { revalidatePath, updateTag } from 'next/cache'
import { prisma } from '@/lib/prisma'
import { otherItemInputSchema } from '@/lib/validation/other-item'

export type OtherItemFormState = {
  errors?: Partial<Record<'name' | 'date' | 'time' | 'form', string>>
  values?: Record<string, string>
}

type ParseResult = ReturnType<typeof otherItemInputSchema.safeParse>
type ParseFailure = Extract<ParseResult, { success: false }>

function parseForm(formData: FormData) {
  const raw = {
    eventId: String(formData.get('eventId') ?? ''),
    name: String(formData.get('name') ?? ''),
    description: String(formData.get('description') ?? ''),
    date: String(formData.get('date') ?? ''),
    time: String(formData.get('time') ?? ''),
  }
  return { raw, parsed: otherItemInputSchema.safeParse(raw) }
}

function fieldErrorsFrom(parsed: ParseFailure): OtherItemFormState['errors'] {
  const fieldErrors = parsed.error.flatten().fieldErrors
  return {
    name: fieldErrors.name?.[0],
    date: fieldErrors.date?.[0],
    time: fieldErrors.time?.[0],
  }
}

export async function createOtherItem(_prevState: OtherItemFormState, formData: FormData): Promise<OtherItemFormState> {
  const { raw, parsed } = parseForm(formData)
  if (!parsed.success) return { values: raw, errors: fieldErrorsFrom(parsed) }

  try {
    await prisma.otherItem.create({
      data: { ...parsed.data, date: new Date(parsed.data.date) },
    })
  } catch {
    return { values: raw, errors: { form: 'Could not save this item. Please try again.' } }
  }

  updateTag('events')
  updateTag(`event:${parsed.data.eventId}`)
  revalidatePath(`/events/${parsed.data.eventId}`)
  revalidatePath(`/events/${parsed.data.eventId}/other-items`)
  redirect(`/events/${parsed.data.eventId}/other-items?otherItemAdded=1`)
}

export async function updateOtherItem(
  otherItemId: string,
  _prevState: OtherItemFormState,
  formData: FormData
): Promise<OtherItemFormState> {
  const { raw, parsed } = parseForm(formData)
  if (!parsed.success) return { values: raw, errors: fieldErrorsFrom(parsed) }

  const existing = await prisma.otherItem.findUnique({ where: { id: otherItemId }, select: { eventId: true } })
  if (!existing || existing.eventId !== parsed.data.eventId) {
    return { values: raw, errors: { form: 'Item not found.' } }
  }

  try {
    await prisma.otherItem.update({
      where: { id: otherItemId },
      data: {
        name: parsed.data.name,
        description: parsed.data.description ?? null,
        date: new Date(parsed.data.date),
        time: parsed.data.time,
      },
    })
  } catch {
    return { values: raw, errors: { form: 'Could not save changes. Please try again.' } }
  }

  updateTag('events')
  updateTag(`event:${parsed.data.eventId}`)
  updateTag(`other-item:${otherItemId}`)
  revalidatePath(`/events/${parsed.data.eventId}`)
  revalidatePath(`/events/${parsed.data.eventId}/other-items`)
  redirect(`/events/${parsed.data.eventId}/other-items?otherItemUpdated=1`)
}

export async function deleteOtherItem(eventId: string, otherItemId: string) {
  const existing = await prisma.otherItem.findUnique({ where: { id: otherItemId }, select: { eventId: true } })
  if (!existing || existing.eventId !== eventId) {
    throw new Error('Item not found')
  }

  await prisma.$transaction([
    prisma.mediaLocation.updateMany({ where: { otherItemId }, data: { otherItemId: null } }),
    prisma.otherItem.delete({ where: { id: otherItemId } }),
  ])

  updateTag('events')
  updateTag(`event:${eventId}`)
  updateTag(`other-item:${otherItemId}`)
  updateTag(`media-locations:${eventId}`)
  revalidatePath(`/events/${eventId}`)
  revalidatePath(`/events/${eventId}/other-items`)
  revalidatePath(`/events/${eventId}/media-locations`)
  redirect(`/events/${eventId}/other-items?otherItemDeleted=1`)
}

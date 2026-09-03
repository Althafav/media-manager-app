'use server'

import { redirect } from 'next/navigation'
import { revalidatePath, updateTag } from 'next/cache'
import { prisma } from '@/lib/prisma'
import { boothInputSchema } from '@/lib/validation/booth'

export type BoothFormState = {
  errors?: Partial<Record<'name' | 'form', string>>
  values?: Record<string, string>
}

function parseForm(formData: FormData) {
  const raw = {
    eventId: String(formData.get('eventId') ?? ''),
    name: String(formData.get('name') ?? ''),
  }
  return { raw, parsed: boothInputSchema.safeParse(raw) }
}

export async function createBooth(_prevState: BoothFormState, formData: FormData): Promise<BoothFormState> {
  const { raw, parsed } = parseForm(formData)
  if (!parsed.success) {
    return { values: raw, errors: { name: parsed.error.flatten().fieldErrors.name?.[0] } }
  }

  try {
    await prisma.booth.create({ data: parsed.data })
  } catch {
    return { values: raw, errors: { form: 'Could not save this booth. Please try again.' } }
  }

  updateTag('events')
  updateTag(`event:${parsed.data.eventId}`)
  revalidatePath(`/events/${parsed.data.eventId}`)
  revalidatePath(`/events/${parsed.data.eventId}/booths`)
  redirect(`/events/${parsed.data.eventId}/booths?boothAdded=1`)
}

export async function updateBooth(
  boothId: string,
  _prevState: BoothFormState,
  formData: FormData
): Promise<BoothFormState> {
  const { raw, parsed } = parseForm(formData)
  if (!parsed.success) {
    return { values: raw, errors: { name: parsed.error.flatten().fieldErrors.name?.[0] } }
  }

  const existing = await prisma.booth.findUnique({ where: { id: boothId }, select: { eventId: true } })
  if (!existing || existing.eventId !== parsed.data.eventId) {
    return { values: raw, errors: { form: 'Booth not found.' } }
  }

  try {
    await prisma.booth.update({ where: { id: boothId }, data: { name: parsed.data.name } })
  } catch {
    return { values: raw, errors: { form: 'Could not save changes. Please try again.' } }
  }

  updateTag('events')
  updateTag(`event:${parsed.data.eventId}`)
  updateTag(`booth:${boothId}`)
  revalidatePath(`/events/${parsed.data.eventId}`)
  revalidatePath(`/events/${parsed.data.eventId}/booths`)
  redirect(`/events/${parsed.data.eventId}/booths?boothUpdated=1`)
}

export async function deleteBooth(eventId: string, boothId: string) {
  const existing = await prisma.booth.findUnique({ where: { id: boothId }, select: { eventId: true } })
  if (!existing || existing.eventId !== eventId) {
    throw new Error('Booth not found')
  }

  await prisma.$transaction([
    prisma.mediaLocation.updateMany({ where: { boothId }, data: { boothId: null } }),
    prisma.booth.delete({ where: { id: boothId } }),
  ])

  updateTag('events')
  updateTag(`event:${eventId}`)
  updateTag(`booth:${boothId}`)
  updateTag(`media-locations:${eventId}`)
  revalidatePath(`/events/${eventId}`)
  revalidatePath(`/events/${eventId}/booths`)
  revalidatePath(`/events/${eventId}/media-locations`)
  redirect(`/events/${eventId}/booths?boothDeleted=1`)
}

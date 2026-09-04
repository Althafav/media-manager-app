'use server'

import { redirect } from 'next/navigation'
import { revalidatePath, updateTag } from 'next/cache'
import { prisma } from '@/lib/prisma'
import { boothInputSchema } from '@/lib/validation/booth'
import { logActivity } from '@/lib/activity-log'

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

  let booth
  try {
    booth = await prisma.booth.create({ data: parsed.data })
  } catch {
    return { values: raw, errors: { form: 'Could not save this booth. Please try again.' } }
  }

  await logActivity({
    eventId: parsed.data.eventId,
    action: 'CREATE',
    message: `Added booth "${booth.name}".`,
    entityType: 'booth',
    entityId: booth.id,
  })

  updateTag('events')
  updateTag(`event:${parsed.data.eventId}`)
  updateTag(`activity:${parsed.data.eventId}`)
  revalidatePath(`/events/${parsed.data.eventId}`)
  revalidatePath(`/events/${parsed.data.eventId}/booths`)
  revalidatePath(`/events/${parsed.data.eventId}/activity`)
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

  await logActivity({
    eventId: parsed.data.eventId,
    action: 'UPDATE',
    message: `Updated booth "${parsed.data.name}".`,
    entityType: 'booth',
    entityId: boothId,
  })

  updateTag('events')
  updateTag(`event:${parsed.data.eventId}`)
  updateTag(`booth:${boothId}`)
  updateTag(`activity:${parsed.data.eventId}`)
  revalidatePath(`/events/${parsed.data.eventId}`)
  revalidatePath(`/events/${parsed.data.eventId}/booths`)
  revalidatePath(`/events/${parsed.data.eventId}/activity`)
  redirect(`/events/${parsed.data.eventId}/booths?boothUpdated=1`)
}

export async function deleteBooth(eventId: string, boothId: string) {
  const existing = await prisma.booth.findUnique({ where: { id: boothId }, select: { eventId: true, name: true } })
  if (!existing || existing.eventId !== eventId) {
    throw new Error('Booth not found')
  }

  await prisma.$transaction([
    prisma.mediaLocation.updateMany({ where: { boothId }, data: { boothId: null } }),
    prisma.booth.delete({ where: { id: boothId } }),
  ])

  await logActivity({
    eventId,
    action: 'DELETE',
    message: `Deleted booth "${existing.name}".`,
    entityType: 'booth',
    entityId: boothId,
  })

  updateTag('events')
  updateTag(`event:${eventId}`)
  updateTag(`booth:${boothId}`)
  updateTag(`media-locations:${eventId}`)
  updateTag(`activity:${eventId}`)
  revalidatePath(`/events/${eventId}`)
  revalidatePath(`/events/${eventId}/booths`)
  revalidatePath(`/events/${eventId}/media-locations`)
  revalidatePath(`/events/${eventId}/activity`)
  redirect(`/events/${eventId}/booths?boothDeleted=1`)
}

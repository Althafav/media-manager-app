import { NextResponse } from 'next/server'
import { z } from 'zod'
import { syncAgendaForEvent } from '@/lib/sync/agenda-sync'

const bodySchema = z.object({
  eventExternalId: z.string().uuid(),
  eventName: z.string().min(1).optional(),
})

export async function POST(request: Request) {
  const parsed = bodySchema.safeParse(await request.json().catch(() => null))
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })
  }

  try {
    const result = await syncAgendaForEvent(parsed.data.eventExternalId, parsed.data.eventName)
    return NextResponse.json(result)
  } catch (err) {
    console.error('Agenda sync failed', err)
    return NextResponse.json({ error: 'Agenda sync failed' }, { status: 502 })
  }
}

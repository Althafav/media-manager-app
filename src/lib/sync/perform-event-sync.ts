import { revalidatePath, revalidateTag } from 'next/cache'
import { prisma } from '@/lib/prisma'
import { syncAgendaForEvent } from '@/lib/sync/agenda-sync'

// Shared by the manual "Sync agenda" server action and the auto-sync route the dashboard
// calls on every visit — same mutation, same cache invalidation, two entry points.
// Not logged to the activity log: with sync now firing on every dashboard visit, a log entry
// per sync would drown out the actually-meaningful entries (media added, sessions deleted, etc).
export async function performEventSync(eventId: string): Promise<{ ok: boolean }> {
  const event = await prisma.event.findUniqueOrThrow({ where: { id: eventId } })

  try {
    await syncAgendaForEvent(event.externalId, event.name)
  } catch (err) {
    // syncAgendaForEvent runs inside its own transaction and throws before committing,
    // so nothing changed here — safe to skip cache invalidation on this path.
    console.error('Agenda resync failed', err)
    return { ok: false }
  }

  // { expire: 0 } for immediate purge — revalidateTag's plain form only schedules revalidation
  // for the *next* request, which would leave the client's own follow-up router.refresh() (see
  // AutoSyncOnVisit) reading stale data.
  revalidateTag('events', { expire: 0 })
  revalidateTag(`event:${eventId}`, { expire: 0 })
  revalidatePath(`/events/${eventId}`)
  revalidatePath(`/events/${eventId}/sessions`)

  return { ok: true }
}

import { revalidatePath, revalidateTag } from 'next/cache'
import { prisma } from '@/lib/prisma'
import { syncAgendaForEvent } from '@/lib/sync/agenda-sync'

const THROTTLE_MS = 2 * 60 * 1000

// Shared by the manual "Sync agenda" server action and the auto-sync route the dashboard
// calls on every visit — same mutation, same cache invalidation, two entry points.
// Not logged to the activity log: with sync now firing on every dashboard visit, a log entry
// per sync would drown out the actually-meaningful entries (media added, sessions deleted, etc).
export async function performEventSync(
  eventId: string,
  options: { force?: boolean } = {}
): Promise<{ ok: boolean; skipped?: boolean }> {
  const event = await prisma.event.findUniqueOrThrow({ where: { id: eventId } })

  // Auto-sync fires on every dashboard visit (see AutoSyncOnVisit) — without this, rapid
  // revisits or multiple open tabs each re-run the full agenda fetch + sync back to back.
  // The explicit "Sync agenda" button always passes force: true and bypasses this.
  if (!options.force && event.lastSyncedAt && Date.now() - event.lastSyncedAt.getTime() < THROTTLE_MS) {
    return { ok: true, skipped: true }
  }

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

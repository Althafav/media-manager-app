import { NextResponse } from 'next/server'
import { performEventSync } from '@/lib/sync/perform-event-sync'

// Called client-side (AutoSyncOnVisit) whenever the event dashboard is opened, so the agenda
// stays current without a manual "Sync agenda" click or a cron job.
export async function POST(_request: Request, { params }: { params: Promise<{ eventId: string }> }) {
  const { eventId } = await params
  const result = await performEventSync(eventId)
  return NextResponse.json(result)
}

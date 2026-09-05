import { prisma } from '@/lib/prisma'
import { fetchAgendaSessions } from '@/lib/agenda-api'
import { mapAgendaSpeakers, type SessionSpeaker } from '@/lib/session-speaker'

// Postgres JSONB does not preserve object key order, so a speakers value read back from the DB
// can have different key ordering than a freshly-computed one even when the content is
// identical — JSON.stringify would then treat every session with speakers as "changed" on
// every sync. Compare fields directly instead.
function speakersEqual(stored: unknown, fresh: SessionSpeaker[]): boolean {
  if (!Array.isArray(stored) || stored.length !== fresh.length) return false
  return fresh.every((speaker, i) => {
    const other = stored[i] as Partial<SessionSpeaker> | null
    return (
      other !== null &&
      typeof other === 'object' &&
      other.name === speaker.name &&
      other.jobTitle === speaker.jobTitle &&
      other.organization === speaker.organization &&
      other.imageUrl === speaker.imageUrl
    )
  })
}

function uniqueBy<T, K>(items: T[], key: (item: T) => K | null): Map<K, T> {
  const map = new Map<K, T>()
  for (const item of items) {
    const k = key(item)
    if (k !== null && !map.has(k)) map.set(k, item)
  }
  return map
}

export async function syncAgendaForEvent(eventExternalId: string, eventName?: string, storage?: string) {
  const sessions = await fetchAgendaSessions(eventExternalId)

  // Safety guard: an empty/broken response must never wipe out active sessions.
  if (sessions.length === 0) {
    throw new Error('Agenda API returned zero sessions; aborting sync to avoid deactivating all sessions')
  }

  const uniqueRooms = uniqueBy(sessions, (s) => (s.RoomID ? s.RoomID : null))
  const uniqueTracks = uniqueBy(
    sessions.filter((s) => (s.TrackData?.ItemID ?? s.TrackID) && (s.TrackData?.Name ?? s.Track)),
    (s) => s.TrackData?.ItemID ?? s.TrackID ?? null
  )

  return prisma.$transaction(
    async (tx) => {
      // storage is only ever set on first creation — re-syncs must never overwrite what the user registered.
      const event = await tx.event.upsert({
        where: { externalId: eventExternalId },
        update: { ...(eventName ? { name: eventName } : {}), lastSyncedAt: new Date() },
        create: {
          externalId: eventExternalId,
          name: eventName ?? eventExternalId,
          storage: storage ?? '',
          lastSyncedAt: new Date(),
        },
      })

      const roomIdByExternal = new Map<number, string>()
      for (const s of uniqueRooms.values()) {
        const room = await tx.room.upsert({
          where: { eventId_externalId: { eventId: event.id, externalId: s.RoomID } },
          update: { name: s.Room ?? '' },
          create: { eventId: event.id, externalId: s.RoomID, name: s.Room ?? '' },
        })
        roomIdByExternal.set(s.RoomID, room.id)
      }

      const trackIdByExternal = new Map<number, string>()
      for (const s of uniqueTracks.values()) {
        const trackExternalId = (s.TrackData?.ItemID ?? s.TrackID) as number
        const trackName = (s.TrackData?.Name ?? s.Track) as string
        const track = await tx.track.upsert({
          where: { eventId_externalId: { eventId: event.id, externalId: trackExternalId } },
          update: {
            name: trackName,
            color: s.TrackData?.Color ?? null,
            itemOrder: s.TrackData?.ItemOrder ?? null,
          },
          create: {
            eventId: event.id,
            externalId: trackExternalId,
            name: trackName,
            color: s.TrackData?.Color ?? null,
            itemOrder: s.TrackData?.ItemOrder ?? null,
          },
        })
        trackIdByExternal.set(trackExternalId, track.id)
      }

      // A resync re-fetches every session from the agenda API even when nothing changed, so
      // diff against what's already stored and only write rows that are new or actually
      // different — upserting all of them unconditionally meant one DB round-trip per session
      // (76-163+ sequential awaits), which is what made every sync take 15-35+ seconds and hold
      // a connection that long, starving concurrent page loads.
      const existingSessions = await tx.session.findMany({
        where: { eventId: event.id },
        select: {
          externalId: true,
          name: true,
          date: true,
          startTime: true,
          endTime: true,
          sessionType: true,
          sessionTypeId: true,
          roomId: true,
          trackId: true,
          isActive: true,
          speakers: true,
        },
      })
      const existingByExternalId = new Map(existingSessions.map((s) => [s.externalId, s]))

      const seenExternalIds: number[] = []

      for (const s of sessions) {
        const roomRecordId = s.RoomID ? (roomIdByExternal.get(s.RoomID) ?? null) : null
        const trackExternalId = s.TrackData?.ItemID ?? s.TrackID ?? null
        const trackRecordId = trackExternalId ? (trackIdByExternal.get(trackExternalId) ?? null) : null
        const speakers = mapAgendaSpeakers(s.Speakers ?? [])
        const date = new Date(s.Date)

        const desired = {
          name: s.SessionName,
          date,
          startTime: s.StartTime,
          endTime: s.EndTime,
          sessionType: s.SessionType,
          sessionTypeId: s.SessionTypeID,
          roomId: roomRecordId,
          trackId: trackRecordId,
          speakers,
        }

        const existing = existingByExternalId.get(s.ItemID)
        const unchanged =
          existing &&
          existing.isActive === true &&
          existing.name === desired.name &&
          existing.date.getTime() === desired.date.getTime() &&
          existing.startTime === desired.startTime &&
          existing.endTime === desired.endTime &&
          existing.sessionType === desired.sessionType &&
          existing.sessionTypeId === desired.sessionTypeId &&
          existing.roomId === desired.roomId &&
          existing.trackId === desired.trackId &&
          speakersEqual(existing.speakers, desired.speakers)

        if (!unchanged) {
          await tx.session.upsert({
            where: { eventId_externalId: { eventId: event.id, externalId: s.ItemID } },
            update: { ...desired, isActive: true, lastSyncedAt: new Date() },
            create: { eventId: event.id, externalId: s.ItemID, ...desired },
          })
        }
        seenExternalIds.push(s.ItemID)
      }

      // Sessions the agenda no longer lists: safe to hard-delete only if nothing is logged
      // against them — otherwise deleting would either fail on MediaLocation's FK or destroy
      // real logged data, which CLAUDE.md explicitly forbids. Re-checked on every sync (not just
      // isActive: true ones) so a session that later gains/loses media is reclassified correctly.
      const missingSessions = await tx.session.findMany({
        where: { eventId: event.id, externalId: { notIn: seenExternalIds } },
        select: { id: true, _count: { select: { mediaLocations: true } } },
      })
      const emptyIds = missingSessions.filter((s) => s._count.mediaLocations === 0).map((s) => s.id)
      const withMediaIds = missingSessions.filter((s) => s._count.mediaLocations > 0).map((s) => s.id)

      // MediaLocation rows themselves are never written here — sync must never touch them.
      if (emptyIds.length > 0) {
        await tx.session.deleteMany({ where: { id: { in: emptyIds } } })
      }
      let sessionsDeactivated = 0
      if (withMediaIds.length > 0) {
        const result = await tx.session.updateMany({
          where: { id: { in: withMediaIds } },
          data: { isActive: false },
        })
        sessionsDeactivated = result.count
      }

      return {
        eventId: event.id,
        sessionsUpserted: sessions.length,
        sessionsDeactivated,
        sessionsDeleted: emptyIds.length,
      }
    },
    { timeout: 120000 }
  )
}

import { prisma } from '@/lib/prisma'
import { fetchAgendaSessions } from '@/lib/agenda-api'

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
        update: eventName ? { name: eventName } : {},
        create: { externalId: eventExternalId, name: eventName ?? eventExternalId, storage: storage ?? '' },
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

      const seenExternalIds: number[] = []

      for (const s of sessions) {
        const roomRecordId = s.RoomID ? roomIdByExternal.get(s.RoomID) : undefined
        const trackExternalId = s.TrackData?.ItemID ?? s.TrackID ?? null
        const trackRecordId = trackExternalId ? trackIdByExternal.get(trackExternalId) : undefined

        await tx.session.upsert({
          where: { eventId_externalId: { eventId: event.id, externalId: s.ItemID } },
          update: {
            name: s.SessionName,
            date: new Date(s.Date),
            startTime: s.StartTime,
            endTime: s.EndTime,
            sessionType: s.SessionType,
            sessionTypeId: s.SessionTypeID,
            roomId: roomRecordId ?? null,
            trackId: trackRecordId ?? null,
            isActive: true,
            lastSyncedAt: new Date(),
          },
          create: {
            eventId: event.id,
            externalId: s.ItemID,
            name: s.SessionName,
            date: new Date(s.Date),
            startTime: s.StartTime,
            endTime: s.EndTime,
            sessionType: s.SessionType,
            sessionTypeId: s.SessionTypeID,
            roomId: roomRecordId ?? null,
            trackId: trackRecordId ?? null,
          },
        })
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

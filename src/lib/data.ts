import { unstable_cache } from 'next/cache'
import { prisma } from '@/lib/prisma'
import type { Prisma } from '@/generated/prisma/client'
import { MediaType } from '@/generated/prisma/enums'

const VALID_MEDIA_TYPES = new Set<string>(Object.values(MediaType))

// Cache tags:
//   'events'                        -> the events list (counts change on any sync/media-location write)
//   `event:${eventId}`              -> that event's session tree / active-session lists
//   `session:${sessionId}`          -> one session's detail + its media locations
//   `media-locations:${eventId}`    -> the searchable media-location list for that event
//   `media-location:${id}`          -> a single media location (edit page)
// A short time-based revalidate rides alongside every tag as a safety net for
// changes a tag doesn't precisely track (e.g. which sessions an agenda sync touched).

export async function getEvents() {
  return unstable_cache(
    async () =>
      prisma.event.findMany({
        orderBy: { createdAt: 'desc' },
        include: { _count: { select: { sessions: true, mediaLocations: true } } },
      }),
    ['events-list'],
    { tags: ['events'], revalidate: 60 }
  )()
}

export async function getEventBasic(eventId: string) {
  return unstable_cache(
    async () => prisma.event.findUnique({ where: { id: eventId } }),
    ['event-basic', eventId],
    { tags: [`event:${eventId}`], revalidate: 60 }
  )()
}

export async function getEventWithSessionTree(eventId: string) {
  const event = await unstable_cache(
    async () =>
      prisma.event.findUnique({
        where: { id: eventId },
        include: {
          sessions: {
            where: { isActive: true },
            include: {
              room: true,
              track: true,
              mediaLocations: {
                select: {
                  id: true,
                  mediaType: true,
                  folderPath: true,
                  description: true,
                  notes: true,
                  tags: true,
                },
              },
            },
            orderBy: [{ date: 'asc' }, { startTime: 'asc' }],
          },
        },
      }),
    ['event-with-session-tree', eventId],
    { tags: [`event:${eventId}`], revalidate: 60 }
  )()
  // unstable_cache round-trips values through JSON, so Date fields come back as strings.
  if (!event) return event
  return { ...event, sessions: event.sessions.map((s) => ({ ...s, date: new Date(s.date) })) }
}

export async function getEventRoomsAndTracks(eventId: string) {
  return unstable_cache(
    async () =>
      prisma.event.findUnique({
        where: { id: eventId },
        include: {
          rooms: { orderBy: { name: 'asc' } },
          tracks: { orderBy: [{ itemOrder: 'asc' }, { name: 'asc' }] },
        },
      }),
    ['event-rooms-and-tracks', eventId],
    { tags: [`event:${eventId}`], revalidate: 60 }
  )()
}

export async function getEventWithActiveSessions(eventId: string) {
  return unstable_cache(
    async () =>
      prisma.event.findUnique({
        where: { id: eventId },
        include: { sessions: { where: { isActive: true }, orderBy: [{ date: 'asc' }, { startTime: 'asc' }] } },
      }),
    ['event-with-active-sessions', eventId],
    { tags: [`event:${eventId}`], revalidate: 60 }
  )()
}

export async function getSessionDetail(sessionId: string) {
  const session = await unstable_cache(
    async () =>
      prisma.session.findUnique({
        where: { id: sessionId },
        include: { room: true, track: true, event: true, mediaLocations: { orderBy: { createdAt: 'desc' } } },
      }),
    ['session-detail', sessionId],
    { tags: [`session:${sessionId}`], revalidate: 60 }
  )()
  // unstable_cache round-trips values through JSON, so Date fields come back as strings.
  if (!session) return session
  return { ...session, date: new Date(session.date) }
}

export async function getMediaLocation(mediaLocationId: string) {
  return unstable_cache(
    async () => prisma.mediaLocation.findUnique({ where: { id: mediaLocationId } }),
    ['media-location', mediaLocationId],
    { tags: [`media-location:${mediaLocationId}`], revalidate: 60 }
  )()
}

export async function getMediaLocations(
  eventId: string,
  filters: { q?: string; mediaType?: string; sessionId?: string }
) {
  return unstable_cache(
    async () => {
      const where: Prisma.MediaLocationWhereInput = {
        eventId,
        ...(filters.mediaType && VALID_MEDIA_TYPES.has(filters.mediaType)
          ? { mediaType: filters.mediaType as MediaType }
          : {}),
        ...(filters.sessionId ? { sessionId: filters.sessionId } : {}),
        ...(filters.q
          ? {
              OR: [
                { folderPath: { contains: filters.q, mode: 'insensitive' } },
                { description: { contains: filters.q, mode: 'insensitive' } },
                { tags: { has: filters.q } },
              ],
            }
          : {}),
      }
      return prisma.mediaLocation.findMany({
        where,
        include: { session: true },
        orderBy: { createdAt: 'desc' },
      })
    },
    ['media-locations', eventId, filters.q ?? '', filters.mediaType ?? '', filters.sessionId ?? ''],
    { tags: [`media-locations:${eventId}`], revalidate: 30 }
  )()
}

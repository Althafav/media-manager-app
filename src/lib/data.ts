import { unstable_cache } from 'next/cache'
import { prisma } from '@/lib/prisma'
import type { Prisma } from '@/generated/prisma/client'
import { MediaType } from '@/generated/prisma/enums'

const VALID_MEDIA_TYPES = new Set<string>(Object.values(MediaType))

// Cache tags:
//   'events'                        -> the events list (counts change on any sync/media-location write)
//   `event:${eventId}`              -> that event's session/booth tree / active-session lists
//   `session:${sessionId}`          -> one session's detail + its media locations
//   `booth:${boothId}`              -> one booth's detail + its media locations
//   `other-item:${otherItemId}`     -> one other item's detail + its media locations
//   `media-locations:${eventId}`    -> the searchable media-location list for that event
//   `media-location:${id}`          -> a single media location (edit page)
// A short time-based revalidate rides alongside every tag as a safety net for
// changes a tag doesn't precisely track (e.g. which sessions an agenda sync touched).

export async function getEvents(filters: { q?: string } = {}) {
  return unstable_cache(
    async () =>
      prisma.event.findMany({
        where: filters.q
          ? {
              OR: [
                { name: { contains: filters.q, mode: 'insensitive' } },
                { storage: { contains: filters.q, mode: 'insensitive' } },
              ],
            }
          : undefined,
        orderBy: { createdAt: 'desc' },
        include: { _count: { select: { sessions: true, mediaLocations: true } } },
      }),
    ['events-list', filters.q ?? ''],
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
          booths: {
            include: {
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
            orderBy: { name: 'asc' },
          },
          otherItems: {
            include: {
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
            orderBy: [{ date: 'asc' }, { time: 'asc' }],
          },
        },
      }),
    ['event-with-session-tree', eventId],
    { tags: [`event:${eventId}`], revalidate: 60 }
  )()
  // unstable_cache round-trips values through JSON, so Date fields come back as strings.
  if (!event) return event
  return {
    ...event,
    sessions: event.sessions.map((s) => ({ ...s, date: new Date(s.date) })),
    otherItems: event.otherItems.map((o) => ({ ...o, date: new Date(o.date) })),
  }
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
        include: {
          sessions: { where: { isActive: true }, orderBy: [{ date: 'asc' }, { startTime: 'asc' }] },
          booths: { orderBy: { name: 'asc' } },
          otherItems: { orderBy: [{ date: 'asc' }, { time: 'asc' }] },
        },
      }),
    ['event-with-active-sessions', eventId],
    { tags: [`event:${eventId}`], revalidate: 60 }
  )()
}

export async function getBoothDetail(boothId: string) {
  return unstable_cache(
    async () =>
      prisma.booth.findUnique({
        where: { id: boothId },
        include: { event: true, mediaLocations: { orderBy: { createdAt: 'desc' } } },
      }),
    ['booth-detail', boothId],
    { tags: [`booth:${boothId}`], revalidate: 60 }
  )()
}

export async function getOtherItemDetail(otherItemId: string) {
  const item = await unstable_cache(
    async () =>
      prisma.otherItem.findUnique({
        where: { id: otherItemId },
        include: { event: true, mediaLocations: { orderBy: { createdAt: 'desc' } } },
      }),
    ['other-item-detail', otherItemId],
    { tags: [`other-item:${otherItemId}`], revalidate: 60 }
  )()
  // unstable_cache round-trips values through JSON, so Date fields come back as strings.
  if (!item) return item
  return { ...item, date: new Date(item.date) }
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
  filters: { q?: string; mediaType?: string; sessionId?: string; boothId?: string; otherItemId?: string }
) {
  return unstable_cache(
    async () => {
      const where: Prisma.MediaLocationWhereInput = {
        eventId,
        ...(filters.mediaType && VALID_MEDIA_TYPES.has(filters.mediaType)
          ? { mediaType: filters.mediaType as MediaType }
          : {}),
        ...(filters.sessionId ? { sessionId: filters.sessionId } : {}),
        ...(filters.boothId ? { boothId: filters.boothId } : {}),
        ...(filters.otherItemId ? { otherItemId: filters.otherItemId } : {}),
        ...(filters.q
          ? {
              OR: [
                { folderPath: { contains: filters.q, mode: 'insensitive' } },
                { description: { contains: filters.q, mode: 'insensitive' } },
                { tags: { has: filters.q } },
                { session: { name: { contains: filters.q, mode: 'insensitive' } } },
                { booth: { name: { contains: filters.q, mode: 'insensitive' } } },
                { otherItem: { name: { contains: filters.q, mode: 'insensitive' } } },
              ],
            }
          : {}),
      }
      return prisma.mediaLocation.findMany({
        where,
        include: { session: true, booth: true, otherItem: true },
        orderBy: { createdAt: 'desc' },
      })
    },
    [
      'media-locations',
      eventId,
      filters.q ?? '',
      filters.mediaType ?? '',
      filters.sessionId ?? '',
      filters.boothId ?? '',
      filters.otherItemId ?? '',
    ],
    { tags: [`media-locations:${eventId}`], revalidate: 30 }
  )()
}

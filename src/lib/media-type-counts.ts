import type { MediaType } from '@/generated/prisma/enums'

export const MEDIA_TYPE_ORDER: MediaType[] = ['PHOTO', 'VIDEO', 'MIXED', 'OTHER']

export const MEDIA_TYPE_LABELS: Record<MediaType, string> = {
  PHOTO: 'Photo',
  VIDEO: 'Video',
  MIXED: 'Mixed',
  OTHER: 'Other',
}

export function countByMediaType(mediaLocations: { mediaType: MediaType }[]) {
  const counts = new Map<MediaType, number>()
  for (const loc of mediaLocations) {
    counts.set(loc.mediaType, (counts.get(loc.mediaType) ?? 0) + 1)
  }
  return counts
}

import { z } from 'zod'

export const mediaLocationInputSchema = z.object({
  eventId: z.string().cuid(),
  sessionId: z
    .string()
    .cuid()
    .optional()
    .or(z.literal(''))
    .transform((v) => v || undefined),
  boothId: z
    .string()
    .cuid()
    .optional()
    .or(z.literal(''))
    .transform((v) => v || undefined),
  otherItemId: z
    .string()
    .cuid()
    .optional()
    .or(z.literal(''))
    .transform((v) => v || undefined),
  folderPath: z.string().min(1).max(1000),
  mediaType: z.enum(['PHOTO', 'VIDEO', 'MIXED', 'OTHER']),
  description: z
    .string()
    .max(2000)
    .optional()
    .or(z.literal(''))
    .transform((v) => v || undefined),
  notes: z
    .string()
    .max(2000)
    .optional()
    .or(z.literal(''))
    .transform((v) => v || undefined),
  tags: z
    .string()
    .optional()
    .transform((v) =>
      (v ?? '')
        .split(',')
        .map((t) => t.trim())
        .filter(Boolean)
    ),
}).refine((data) => [data.sessionId, data.boothId, data.otherItemId].filter(Boolean).length <= 1, {
  message: 'A media location can only be linked to one of session, booth, or item',
  path: ['otherItemId'],
})

export type MediaLocationInput = z.infer<typeof mediaLocationInputSchema>

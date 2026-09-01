import { z } from 'zod'

export const sessionInputSchema = z.object({
  eventId: z.string().cuid(),
  name: z.string().min(1, 'Name is required').max(300),
  date: z.string().min(1, 'Date is required'),
  startTime: z.string().regex(/^\d{2}:\d{2}$/, 'Must be HH:MM'),
  endTime: z.string().regex(/^\d{2}:\d{2}$/, 'Must be HH:MM'),
  roomId: z
    .string()
    .cuid()
    .optional()
    .or(z.literal(''))
    .transform((v) => v || undefined),
  trackId: z
    .string()
    .cuid()
    .optional()
    .or(z.literal(''))
    .transform((v) => v || undefined),
})

export type SessionInput = z.infer<typeof sessionInputSchema>

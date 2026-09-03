import { z } from 'zod'

export const otherItemInputSchema = z.object({
  eventId: z.string().cuid(),
  name: z.string().min(1, 'Name is required').max(300),
  description: z
    .string()
    .max(2000)
    .optional()
    .or(z.literal(''))
    .transform((v) => v || undefined),
  date: z.string().min(1, 'Date is required'),
  time: z.string().regex(/^\d{2}:\d{2}$/, 'Must be HH:MM'),
})

export type OtherItemInput = z.infer<typeof otherItemInputSchema>

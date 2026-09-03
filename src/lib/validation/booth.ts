import { z } from 'zod'

export const boothInputSchema = z.object({
  eventId: z.string().cuid(),
  name: z.string().min(1, 'Name is required').max(300),
})

export type BoothInput = z.infer<typeof boothInputSchema>

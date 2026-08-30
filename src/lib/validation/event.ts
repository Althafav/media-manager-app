import { z } from 'zod'

export const newEventSchema = z.object({
  eventExternalId: z.string().uuid('Must be a valid EventId (GUID) from the agenda API'),
  name: z.string().min(1, 'Name is required'),
  storage: z.string().min(1, 'Storage is required').max(200),
})

export type NewEventInput = z.infer<typeof newEventSchema>

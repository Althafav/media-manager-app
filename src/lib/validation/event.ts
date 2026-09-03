import { z } from 'zod'

const storageSchema = z.string().min(1, 'Storage is required').max(200)

export const newEventSchema = z.object({
  eventExternalId: z.string().uuid('Must be a valid EventId (GUID) from the agenda API'),
  name: z.string().min(1, 'Name is required'),
  storage: storageSchema,
})

export type NewEventInput = z.infer<typeof newEventSchema>

export const updateEventStorageSchema = z.object({
  storage: storageSchema,
})

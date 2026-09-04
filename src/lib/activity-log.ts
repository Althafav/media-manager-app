import { prisma } from '@/lib/prisma'
import type { ActivityAction } from '@/generated/prisma/enums'

export async function logActivity(entry: {
  eventId: string
  action: ActivityAction
  message: string
  entityType?: string
  entityId?: string
}) {
  await prisma.activityLog.create({ data: entry })
}

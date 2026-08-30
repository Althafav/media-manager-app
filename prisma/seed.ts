import 'dotenv/config'
import { prisma } from '../src/lib/prisma'

const SEED_TAG = 'seed'

async function main() {
  const event = await prisma.event.findFirst({ orderBy: { createdAt: 'asc' } })
  if (!event) {
    console.error('No event found. Add an event first (via /events/new) before seeding.')
    process.exit(1)
  }

  const sessions = await prisma.session.findMany({
    where: { eventId: event.id, isActive: true },
    orderBy: [{ date: 'asc' }, { startTime: 'asc' }],
  })

  // Clear out any previously seeded dummy data for this event so re-running stays idempotent.
  await prisma.mediaLocation.deleteMany({ where: { eventId: event.id, tags: { has: SEED_TAG } } })

  const pick = (i: number) => sessions[i % sessions.length]

  const dummyLocations = [
    {
      sessionId: pick(0)?.id,
      folderPath: 'D:\\Events\\AIM2026\\Day1\\OpeningCeremony',
      mediaType: 'PHOTO' as const,
      description: 'Opening ceremony stills, two camera angles',
      notes: 'Backed up to NAS same night',
      tags: [SEED_TAG, 'keynote', 'day1'],
    },
    {
      sessionId: pick(5)?.id,
      folderPath: 'D:\\Events\\AIM2026\\Day1\\Panel_HighLevelRoundtable',
      mediaType: 'VIDEO' as const,
      description: 'Full panel recording, single fixed camera',
      notes: null,
      tags: [SEED_TAG, 'panel', 'day1'],
    },
    {
      sessionId: pick(12)?.id,
      folderPath: 'D:\\Events\\AIM2026\\Day1\\NexGenStage',
      mediaType: 'MIXED' as const,
      description: 'Stills + short-form video clips for social',
      notes: 'Needs color grading before delivery',
      tags: [SEED_TAG, 'social', 'nexgen'],
    },
    {
      sessionId: pick(20)?.id,
      folderPath: 'D:\\Events\\AIM2026\\Day2\\FiresideChat',
      mediaType: 'PHOTO' as const,
      description: 'Candid + posed shots',
      notes: null,
      tags: [SEED_TAG, 'day2'],
    },
    {
      sessionId: pick(30)?.id,
      folderPath: 'D:\\Events\\AIM2026\\Day2\\InvestmentDestinations',
      mediaType: 'OTHER' as const,
      description: 'Raw drone footage, unedited',
      notes: 'Large files, ~40GB total',
      tags: [SEED_TAG, 'drone', 'day2'],
    },
    {
      sessionId: null,
      folderPath: 'D:\\Events\\AIM2026\\General\\VenueBRoll',
      mediaType: 'VIDEO' as const,
      description: 'General venue and crowd B-roll, not tied to a specific session',
      notes: null,
      tags: [SEED_TAG, 'broll'],
    },
  ]

  const created = await prisma.mediaLocation.createMany({
    data: dummyLocations.map((d) => ({ ...d, eventId: event.id })),
  })

  console.log(`Seeded ${created.count} dummy media locations for event "${event.name}".`)
}

main()
  .catch((err) => {
    console.error(err)
    process.exit(1)
  })
  .finally(() => prisma.$disconnect())

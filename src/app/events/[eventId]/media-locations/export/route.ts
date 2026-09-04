import ExcelJS from 'exceljs'
import { getEventBasic, getMediaLocations } from '@/lib/data'
import { prisma } from '@/lib/prisma'

function slugify(name: string) {
  return (
    name
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '') || 'event'
  )
}

export async function GET(_request: Request, { params }: { params: Promise<{ eventId: string }> }) {
  const { eventId } = await params

  const event = await getEventBasic(eventId)
  if (!event) {
    return new Response('Event not found', { status: 404 })
  }

  // Queried directly (not via getEventWithSessionTree, which only returns isActive sessions) —
  // the export must include every session/booth/item regardless of agenda-sync status, since a
  // session dropped from the live feed can still have real media logged against it historically.
  const [sessions, booths, otherItems, mediaLocations] = await Promise.all([
    prisma.session.findMany({
      where: { eventId },
      select: { name: true, isActive: true, mediaLocations: { select: { folderPath: true } } },
      orderBy: [{ date: 'asc' }, { startTime: 'asc' }],
    }),
    prisma.booth.findMany({
      where: { eventId },
      select: { name: true, mediaLocations: { select: { folderPath: true } } },
      orderBy: { name: 'asc' },
    }),
    prisma.otherItem.findMany({
      where: { eventId },
      select: { name: true, mediaLocations: { select: { folderPath: true } } },
      orderBy: [{ date: 'asc' }, { time: 'asc' }],
    }),
    getMediaLocations(eventId, {}),
  ])

  const workbook = new ExcelJS.Workbook()
  const sheet = workbook.addWorksheet('Media Locations')

  sheet.columns = [
    { header: 'Section Type', key: 'sectionType', width: 16 },
    { header: 'Name', key: 'name', width: 40 },
    { header: 'Status', key: 'status', width: 14 },
    { header: 'Media Location', key: 'mediaLocation', width: 60 },
  ]
  sheet.getRow(1).font = { bold: true }

  // Every session/booth/item gets at least one row — even with zero media locations logged —
  // so the export shows the full picture (what's covered and what's still missing), not just
  // the entries that happen to have a folder path. One row per media location when it has any.
  // Status only applies to sessions (active in the live agenda feed vs. dropped by a later
  // sync) — booths and other items have no such concept, so their Status cell stays blank.
  function addSectionRows(
    sectionType: string,
    items: { name: string; status?: string; mediaLocations: { folderPath: string }[] }[]
  ) {
    for (const item of items) {
      const status = item.status ?? ''
      if (item.mediaLocations.length === 0) {
        sheet.addRow({ sectionType, name: item.name, status, mediaLocation: '' })
      } else {
        for (const ml of item.mediaLocations) {
          sheet.addRow({ sectionType, name: item.name, status, mediaLocation: ml.folderPath })
        }
      }
    }
  }

  addSectionRows(
    'Session',
    sessions.map((s) => ({ ...s, status: s.isActive ? 'Active' : 'Inactive' }))
  )
  addSectionRows('Booth', booths)
  addSectionRows('Other Item', otherItems)

  // Media locations linked to nothing at all don't appear in any of the three lists above.
  for (const ml of mediaLocations) {
    if (!ml.session && !ml.booth && !ml.otherItem) {
      sheet.addRow({ sectionType: 'Unassigned', name: '', status: '', mediaLocation: ml.folderPath })
    }
  }

  const buffer = await workbook.xlsx.writeBuffer()

  return new Response(buffer, {
    headers: {
      'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'Content-Disposition': `attachment; filename="${slugify(event.name)}-media-locations.xlsx"`,
    },
  })
}

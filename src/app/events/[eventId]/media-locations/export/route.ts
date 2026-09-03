import ExcelJS from 'exceljs'
import { getEventBasic, getMediaLocations } from '@/lib/data'

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

  const mediaLocations = await getMediaLocations(eventId, {})

  const workbook = new ExcelJS.Workbook()
  const sheet = workbook.addWorksheet('Media Locations')

  sheet.columns = [
    { header: 'Section Type', key: 'sectionType', width: 16 },
    { header: 'Name', key: 'name', width: 40 },
    { header: 'Media Location', key: 'mediaLocation', width: 60 },
  ]
  sheet.getRow(1).font = { bold: true }

  for (const ml of mediaLocations) {
    const sectionType = ml.session ? 'Session' : ml.booth ? 'Booth' : ml.otherItem ? 'Other Item' : 'Unassigned'
    const name = ml.session?.name ?? ml.booth?.name ?? ml.otherItem?.name ?? ''
    sheet.addRow({ sectionType, name, mediaLocation: ml.folderPath })
  }

  const buffer = await workbook.xlsx.writeBuffer()

  return new Response(buffer, {
    headers: {
      'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'Content-Disposition': `attachment; filename="${slugify(event.name)}-media-locations.xlsx"`,
    },
  })
}

import Link from 'next/link'
import { notFound } from 'next/navigation'
import { getEventWithSessionTree } from '@/lib/data'
import { deleteBooth } from './actions'
import { CoverageRow } from '@/components/CoverageRow'
import { ScrollToRow } from '@/components/ScrollToRow'
import { Breadcrumbs } from '@/components/Breadcrumbs'
import * as ui from '@/lib/ui'

export default async function BoothsPage({
  params,
  searchParams,
}: {
  params: Promise<{ eventId: string }>
  searchParams: Promise<{
    boothAdded?: string
    boothUpdated?: string
    boothDeleted?: string
    mediaAdded?: string
    mediaUpdated?: string
    mediaDeleted?: string
    q?: string
    open?: string
  }>
}) {
  const { eventId } = await params
  const { boothAdded, boothUpdated, boothDeleted, mediaAdded, mediaUpdated, mediaDeleted, q, open } =
    await searchParams
  const focusId = open ?? mediaAdded ?? mediaUpdated

  const event = await getEventWithSessionTree(eventId)
  if (!event) notFound()

  const query = q?.trim().toLowerCase() ?? ''
  const filteredBooths = event.booths.filter((booth) => !query || booth.name.toLowerCase().includes(query))

  const eventBase = `/events/${eventId}/booths`
  const returnTo = q ? `${eventBase}?q=${encodeURIComponent(q)}` : eventBase

  return (
    <div className={ui.page}>
      <ScrollToRow id={focusId} />
      <Breadcrumbs
        items={[
          { label: 'Events', href: '/events' },
          { label: event.name, href: `/events/${eventId}` },
          { label: 'Booths' },
        ]}
      />
      <h1 className={ui.h1}>Booths</h1>
      {boothAdded && <p className={`${ui.bannerOk} mt-3`}>Booth added.</p>}
      {boothUpdated && <p className={`${ui.bannerOk} mt-3`}>Booth updated.</p>}
      {boothDeleted && <p className={`${ui.bannerOk} mt-3`}>Booth deleted.</p>}
      {mediaAdded && <p className={`${ui.bannerOk} mt-3`}>Media location added.</p>}
      {mediaUpdated && <p className={`${ui.bannerOk} mt-3`}>Media location updated.</p>}
      {mediaDeleted && <p className={`${ui.bannerOk} mt-3`}>Media location deleted.</p>}

      <div className="mt-4 mb-4">
        <Link href={`/events/${eventId}/booths/new`}>
          <button className={ui.button}>Add booth</button>
        </Link>
      </div>

      <form className={ui.formInline}>
        <label className={ui.label}>
          Search
          <input type="text" name="q" defaultValue={q} placeholder="booth name" className={ui.input} />
        </label>
        <button type="submit" className={ui.button}>
          Filter
        </button>
      </form>

      {event.booths.length === 0 ? (
        <p className={ui.muted}>No booths added yet.</p>
      ) : filteredBooths.length === 0 ? (
        <p className={ui.muted}>No booths match your search.</p>
      ) : (
        <div className={ui.card}>
          <div className={ui.sessionList}>
            {filteredBooths.map((booth) => (
              <CoverageRow
                key={booth.id}
                kind="booth"
                eventId={eventId}
                id={booth.id}
                name={booth.name}
                detailHref={`/events/${eventId}/booths/${booth.id}`}
                editHref={`/events/${eventId}/booths/${booth.id}/edit`}
                deleteAction={deleteBooth.bind(null, eventId, booth.id)}
                deleteConfirmMessage="Delete this booth? Any media locations linked to it will be kept but unlinked from it."
                mediaLocations={booth.mediaLocations}
                autoOpen={booth.id === focusId}
                returnTo={returnTo}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

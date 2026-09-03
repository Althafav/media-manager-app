import Link from 'next/link'
import { notFound } from 'next/navigation'
import { getEventWithSessionTree } from '@/lib/data'
import { deleteOtherItem } from './actions'
import { CoverageRow } from '@/components/CoverageRow'
import { ScrollToRow } from '@/components/ScrollToRow'
import { Breadcrumbs } from '@/components/Breadcrumbs'
import { dayKeyOf, formatShortDay } from '@/lib/day-key'
import * as ui from '@/lib/ui'

function buildHref(
  base: string,
  overrides: Partial<{ q: string; day: string }>,
  current: { q: string; day: string }
) {
  const params = new URLSearchParams()
  const q = overrides.q ?? current.q
  const day = overrides.day ?? current.day
  if (q) params.set('q', q)
  if (day) params.set('day', day)
  const qs = params.toString()
  return qs ? `${base}?${qs}` : base
}

export default async function OtherItemsPage({
  params,
  searchParams,
}: {
  params: Promise<{ eventId: string }>
  searchParams: Promise<{
    otherItemAdded?: string
    otherItemUpdated?: string
    otherItemDeleted?: string
    mediaAdded?: string
    mediaUpdated?: string
    mediaDeleted?: string
    q?: string
    day?: string
    open?: string
  }>
}) {
  const { eventId } = await params
  const { otherItemAdded, otherItemUpdated, otherItemDeleted, mediaAdded, mediaUpdated, mediaDeleted, q, day, open } =
    await searchParams
  const focusId = open ?? mediaAdded ?? mediaUpdated

  const event = await getEventWithSessionTree(eventId)
  if (!event) notFound()

  const availableDays = [...new Set(event.otherItems.map((i) => dayKeyOf(i.date)))].sort()
  const todayKey = dayKeyOf(new Date())
  const resolvedDay = day === undefined ? (availableDays.includes(todayKey) ? todayKey : 'all') : day
  const showingFallback = day === undefined && resolvedDay === 'all' && availableDays.length > 0

  const query = q?.trim().toLowerCase() ?? ''
  const filteredItems = event.otherItems.filter((item) => {
    if (resolvedDay !== 'all' && dayKeyOf(item.date) !== resolvedDay) return false
    if (query && !item.name.toLowerCase().includes(query)) return false
    return true
  })

  const eventBase = `/events/${eventId}/other-items`
  const currentFilters = { q: q ?? '', day: resolvedDay }
  const returnTo = buildHref(eventBase, {}, currentFilters)

  return (
    <div className={ui.page}>
      <ScrollToRow id={focusId} />
      <Breadcrumbs
        items={[
          { label: 'Events', href: '/events' },
          { label: event.name, href: `/events/${eventId}` },
          { label: 'Other Items' },
        ]}
      />
      <h1 className={ui.h1}>Other Items</h1>
      {otherItemAdded && <p className={`${ui.bannerOk} mt-3`}>Item added.</p>}
      {otherItemUpdated && <p className={`${ui.bannerOk} mt-3`}>Item updated.</p>}
      {otherItemDeleted && <p className={`${ui.bannerOk} mt-3`}>Item deleted.</p>}
      {mediaAdded && <p className={`${ui.bannerOk} mt-3`}>Media location added.</p>}
      {mediaUpdated && <p className={`${ui.bannerOk} mt-3`}>Media location updated.</p>}
      {mediaDeleted && <p className={`${ui.bannerOk} mt-3`}>Media location deleted.</p>}

      <div className="mt-4 mb-4">
        <Link href={`/events/${eventId}/other-items/new`}>
          <button className={ui.button}>Add item</button>
        </Link>
      </div>

      {availableDays.length > 0 && (
        <nav className={ui.dayChipStrip} aria-label="Day">
          {availableDays.map((d) => (
            <Link
              key={d}
              href={buildHref(eventBase, { day: d }, currentFilters)}
              className={`${ui.dayChip} ${resolvedDay === d ? ui.dayChipActive : ui.dayChipInactive}`}
            >
              {formatShortDay(new Date(`${d}T00:00:00`))}
              {d === todayKey && <span aria-hidden> •</span>}
            </Link>
          ))}
          <Link
            href={buildHref(eventBase, { day: 'all' }, currentFilters)}
            className={`${ui.dayChip} ${resolvedDay === 'all' ? ui.dayChipActive : ui.dayChipInactive}`}
          >
            All days
          </Link>
        </nav>
      )}
      {showingFallback && <p className={`${ui.muted} -mt-2 mb-4`}>No items today — showing all days.</p>}

      <form className={ui.filterBar}>
        <input type="hidden" name="day" value={resolvedDay} />
        <label className={ui.label}>
          Search
          <input type="text" name="q" defaultValue={q} placeholder="item name" className={ui.input} />
        </label>
        <button type="submit" className={ui.button}>
          Filter
        </button>
      </form>

      {event.otherItems.length === 0 ? (
        <p className={ui.muted}>No items added yet.</p>
      ) : filteredItems.length === 0 ? (
        <p className={ui.muted}>No items match your filters.</p>
      ) : (
        <div className={ui.card}>
          <div className={ui.sessionList}>
            {filteredItems.map((item) => (
              <CoverageRow
                key={item.id}
                kind="other-item"
                eventId={eventId}
                id={item.id}
                name={item.name}
                detailHref={`/events/${eventId}/other-items/${item.id}`}
                timeLabel={item.time.slice(0, 5)}
                description={item.description ?? undefined}
                editHref={`/events/${eventId}/other-items/${item.id}/edit`}
                deleteAction={deleteOtherItem.bind(null, eventId, item.id)}
                deleteConfirmMessage="Delete this item? Any media locations linked to it will be kept but unlinked from it."
                mediaLocations={item.mediaLocations}
                autoOpen={item.id === focusId}
                returnTo={returnTo}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

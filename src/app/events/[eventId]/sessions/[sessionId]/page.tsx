import Link from 'next/link'
import { notFound } from 'next/navigation'
import { getSessionDetail } from '@/lib/data'
import * as ui from '@/lib/ui'
import { mediaTypeBadgeClasses } from '@/lib/media-type-badge'
import { sessionStatusBadgeClasses, SESSION_STATUS_LABELS } from '@/lib/session-status-badge'
import { SessionStatus } from '@/generated/prisma/enums'
import { updateSessionStatus } from './actions'
import { deleteSession } from '../actions'
import { CopyButton } from '@/components/CopyButton'
import { ConfirmSubmitButton } from '@/components/ConfirmSubmitButton'
import { DeleteMediaLocationForm } from '@/components/DeleteMediaLocationForm'

const SESSION_STATUSES = Object.values(SessionStatus)

export default async function SessionDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ eventId: string; sessionId: string }>
  searchParams: Promise<{ statusUpdated?: string; updated?: string; mediaDeleted?: string }>
}) {
  const { eventId, sessionId } = await params
  const { statusUpdated, updated, mediaDeleted } = await searchParams

  const session = await getSessionDetail(sessionId)

  if (!session || session.eventId !== eventId) notFound()

  const returnTo = `/events/${eventId}/sessions/${sessionId}`

  return (
    <div className={ui.page}>
      <Link href={`/events/${eventId}`} className={ui.backLink}>
        &larr; {session.event.name}
      </Link>
      <h1 className={ui.h1}>{session.name}</h1>
      {statusUpdated && <p className={`${ui.bannerOk} mt-3`}>Session status updated.</p>}
      {updated && <p className={`${ui.bannerOk} mt-3`}>Session updated.</p>}
      {mediaDeleted && <p className={`${ui.bannerOk} mt-3`}>Media location deleted.</p>}
      <div className="mt-2">
        <span className={ui.badgeClasses(sessionStatusBadgeClasses(session.status))}>
          {SESSION_STATUS_LABELS[session.status]}
        </span>
        {!session.isActive && <span className={ui.badge}>No longer in agenda feed</span>}
        {session.isManual && <span className={ui.badgeClasses('bg-rule text-ink')}>Manual</span>}
      </div>
      <p className={`${ui.muted} mt-2`}>
        {session.date.toLocaleDateString()} · {session.startTime.slice(0, 5)}–{session.endTime.slice(0, 5)}
        {session.room && <> · {session.room.name}</>}
        {session.track && <> · {session.track.name}</>}
        {session.sessionType && <> · {session.sessionType}</>}
      </p>

      <form action={updateSessionStatus.bind(null, eventId, sessionId)} className={`${ui.formInline} mt-4`}>
        <label className={ui.label}>
          Status
          <select name="status" defaultValue={session.status} className={ui.input}>
            {SESSION_STATUSES.map((status) => (
              <option key={status} value={status}>
                {SESSION_STATUS_LABELS[status]}
              </option>
            ))}
          </select>
        </label>
        <button type="submit" className={ui.button}>
          Save status
        </button>
      </form>

      {session.isManual && (
        <div className="flex gap-2.5 mt-4">
          <Link href={`/events/${eventId}/sessions/${sessionId}/edit`}>
            <button className={ui.button}>Edit session</button>
          </Link>
          <form action={deleteSession.bind(null, eventId, sessionId)}>
            <ConfirmSubmitButton
              className={ui.button}
              confirmMessage="Delete this session? Any media locations linked to it will be kept but unlinked from it."
            >
              Delete session
            </ConfirmSubmitButton>
          </form>
        </div>
      )}

      <h2 className={ui.h2}>Media Locations</h2>
      <p className={`${ui.muted} mb-3`}>Storage: {session.event.storage}</p>
      <Link href={`/events/${eventId}/media-locations/new?sessionId=${session.id}`}>
        <button className={`${ui.button} mb-4`}>Add media location</button>
      </Link>

      {session.mediaLocations.length === 0 ? (
        <p className={ui.muted}>No media locations registered for this session yet.</p>
      ) : (
        session.mediaLocations.map((ml) => (
          <div key={ml.id} className={ui.card}>
            <span className={ui.badgeClasses(mediaTypeBadgeClasses(ml.mediaType))}>{ml.mediaType}</span>
            <p className="mt-2.5">
              {ml.folderPath}
              <CopyButton text={ml.folderPath} />
            </p>
            {ml.description && <p className={`${ui.muted} mt-2`}>{ml.description}</p>}
            {ml.tags.length > 0 && (
              <p className="mt-2.5">
                {ml.tags.map((tag) => (
                  <span key={tag} className={ui.badge}>
                    {tag}
                  </span>
                ))}
              </p>
            )}
            <div className="mt-2.5 flex items-center gap-3">
              <Link
                href={`/events/${eventId}/media-locations/${ml.id}/edit`}
                className="hover:underline hover:decoration-accent hover:decoration-2"
              >
                Edit
              </Link>
              <DeleteMediaLocationForm
                mediaLocationId={ml.id}
                eventId={eventId}
                returnTo={returnTo}
                className="text-sm text-danger hover:underline hover:decoration-accent hover:decoration-2"
              />
            </div>
          </div>
        ))
      )}
    </div>
  )
}

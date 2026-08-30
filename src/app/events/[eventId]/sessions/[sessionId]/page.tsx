import Link from 'next/link'
import { notFound } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import * as ui from '@/lib/ui'
import { mediaTypeBadgeClasses } from '@/lib/media-type-badge'

export default async function SessionDetailPage({
  params,
}: {
  params: Promise<{ eventId: string; sessionId: string }>
}) {
  const { eventId, sessionId } = await params

  const session = await prisma.session.findUnique({
    where: { id: sessionId },
    include: {
      room: true,
      track: true,
      event: true,
      mediaLocations: { orderBy: { createdAt: 'desc' } },
    },
  })

  if (!session || session.eventId !== eventId) notFound()

  return (
    <div className={ui.page}>
      <Link href={`/events/${eventId}`} className={ui.backLink}>
        &larr; {session.event.name}
      </Link>
      <h1 className={ui.h1}>{session.name}</h1>
      {!session.isActive && <p className={`${ui.badge} mt-2`}>No longer in agenda feed</p>}
      <p className={`${ui.muted} mt-2`}>
        {session.date.toLocaleDateString()} · {session.startTime.slice(0, 5)}–{session.endTime.slice(0, 5)}
        {session.room && <> · {session.room.name}</>}
        {session.track && <> · {session.track.name}</>}
        {session.sessionType && <> · {session.sessionType}</>}
      </p>

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
            <p className="mt-2.5">{ml.folderPath}</p>
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
            <Link
              href={`/events/${eventId}/media-locations/${ml.id}/edit`}
              className="mt-2.5 inline-block hover:underline hover:decoration-accent hover:decoration-2"
            >
              Edit
            </Link>
          </div>
        ))
      )}
    </div>
  )
}

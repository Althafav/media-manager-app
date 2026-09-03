import Link from "next/link";
import type { getEventWithSessionTree } from "@/lib/data";
import { mediaTypeBadgeClasses } from "@/lib/media-type-badge";
import {
  sessionStatusBadgeClasses,
  SESSION_STATUS_LABELS,
} from "@/lib/session-status-badge";
import { SessionStatus } from "@/generated/prisma/enums";
import type { MediaType } from "@/generated/prisma/enums";
import { MediaLocationEntry } from "@/components/MediaLocationEntry";
import { QuickAddMediaLocationForm } from "@/components/QuickAddMediaLocationForm";
import { ConfirmSubmitButton } from "@/components/ConfirmSubmitButton";
import { deleteSession } from "@/app/events/[eventId]/sessions/actions";
import * as ui from "@/lib/ui";

type Event = NonNullable<Awaited<ReturnType<typeof getEventWithSessionTree>>>;
type Session = Event["sessions"][number];

const MEDIA_TYPE_ORDER: MediaType[] = ["PHOTO", "VIDEO", "MIXED", "OTHER"];
const MEDIA_TYPE_LABELS: Record<MediaType, string> = {
  PHOTO: "Photo",
  VIDEO: "Video",
  MIXED: "Mixed",
  OTHER: "Other",
};

function countByMediaType(mediaLocations: { mediaType: MediaType }[]) {
  const counts = new Map<MediaType, number>();
  for (const loc of mediaLocations) {
    counts.set(loc.mediaType, (counts.get(loc.mediaType) ?? 0) + 1);
  }
  return counts;
}

export function SessionRow({
  eventId,
  session,
  returnTo,
  autoOpen,
}: {
  eventId: string;
  session: Session;
  returnTo: string;
  autoOpen?: boolean;
}) {
  const locations = session.mediaLocations;
  const logged = locations.length > 0;
  const counts = countByMediaType(locations);

  return (
    <details
      id={`session-${session.id}`}
      open={autoOpen || undefined}
      className={`${ui.sessionRow} group`}
    >
      <summary className={ui.sessionRowSummary}>
        <span className={ui.sessionRowTime}>
          {session.startTime.slice(0, 5)}–{session.endTime.slice(0, 5)}
        </span>
        <span className="flex-1 min-w-0">
          <Link
            href={`/events/${eventId}/sessions/${session.id}`}
            className="hover:underline hover:decoration-accent hover:decoration-2"
          >
            {session.name}
          </Link>
          {session.status === SessionStatus.CANCELLED && (
            <span
              className={ui.badgeClasses(
                `${sessionStatusBadgeClasses(session.status)} ml-1.5`,
              )}
            >
              {SESSION_STATUS_LABELS[session.status]}
            </span>
          )}
          {session.isManual && (
            <span className={ui.badgeClasses("bg-rule text-ink ml-1.5")}>
              Manual
            </span>
          )}
        </span>
        <div className="flex flex-col gap-1.5">
          {MEDIA_TYPE_ORDER.filter((type) => counts.has(type)).map((type) => (
            <div key={type} className="flex items-center gap-1.5">
              <span className={ui.badgeClasses(mediaTypeBadgeClasses(type))}>
                {counts.get(type)} {MEDIA_TYPE_LABELS[type]}
              </span>
            </div>
          ))}
        </div>
        <span
          aria-hidden
          className="transition-transform group-open:rotate-180 text-ink-soft"
        >
          ⌄
        </span>
      </summary>

      <div className={ui.sessionRowBody}>
        {session.isManual && (
          <div className="flex gap-2.5 mb-3">
            <Link href={`/events/${eventId}/sessions/${session.id}/edit`}>
              <button className={ui.button}>Edit session</button>
            </Link>
            <form action={deleteSession.bind(null, eventId, session.id)}>
              <ConfirmSubmitButton
                className={ui.button}
                confirmMessage="Delete this session? Any media locations linked to it will be kept but unlinked from it."
              >
                Delete session
              </ConfirmSubmitButton>
            </form>
          </div>
        )}
        {logged && (
          <div className="flex flex-col gap-1.5 mb-3">
            {locations.map((loc) => (
              <MediaLocationEntry
                key={loc.id}
                eventId={eventId}
                sessionId={session.id}
                returnTo={returnTo}
                location={loc}
              />
            ))}
          </div>
        )}
        <QuickAddMediaLocationForm
          eventId={eventId}
          sessionId={session.id}
          returnTo={returnTo}
        />
      </div>
    </details>
  );
}

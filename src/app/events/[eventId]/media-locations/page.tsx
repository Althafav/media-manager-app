import Link from "next/link";
import { notFound } from "next/navigation";
import { getEventBasic, getMediaLocations } from "@/lib/data";
import * as ui from "@/lib/ui";
import { mediaTypeBadgeClasses } from "@/lib/media-type-badge";
import { CopyButton } from "@/components/CopyButton";
import { DeleteMediaLocationForm } from "@/components/DeleteMediaLocationForm";

export default async function MediaLocationsPage({
  params,
  searchParams,
}: {
  params: Promise<{ eventId: string }>;
  searchParams: Promise<{
    q?: string;
    mediaType?: string;
    sessionId?: string;
    added?: string;
    updated?: string;
    deleted?: string;
  }>;
}) {
  const { eventId } = await params;
  const { q, mediaType, sessionId, added, updated, deleted } = await searchParams;

  const event = await getEventBasic(eventId);
  if (!event) notFound();

  const mediaLocations = await getMediaLocations(event.id, { q, mediaType, sessionId });

  const filterParams = new URLSearchParams();
  if (q) filterParams.set("q", q);
  if (mediaType) filterParams.set("mediaType", mediaType);
  if (sessionId) filterParams.set("sessionId", sessionId);
  const filterQuery = filterParams.toString();
  const returnTo = `/events/${event.id}/media-locations${filterQuery ? `?${filterQuery}` : ""}`;

  return (
    <div className={ui.page}>
      <Link href={`/events/${event.id}`} className={ui.backLink}>
        &larr; {event.name}
      </Link>
      <h1 className={ui.h1}>Media Locations</h1>
      {added && <p className={`${ui.bannerOk} mt-3`}>Media location added.</p>}
      {updated && <p className={`${ui.bannerOk} mt-3`}>Changes saved.</p>}
      {deleted && <p className={`${ui.bannerOk} mt-3`}>Media location deleted.</p>}
      <p className={`${ui.muted} mt-2`}>Storage: {event.storage}</p>
      <div className="mt-5 mb-4">
        <Link href={`/events/${event.id}/media-locations/new`}>
          <button className={ui.button}>Add media location</button>
        </Link>
      </div>

      <form className={ui.formInline}>
        <label className={ui.label}>
          Search
          <input
            type="text"
            name="q"
            defaultValue={q}
            placeholder="path, description, tag"
            className={ui.input}
          />
        </label>
        <label className={ui.label}>
          Media type
          <select name="mediaType" defaultValue={mediaType ?? ""} className={ui.input}>
            <option value="">Any</option>
            <option value="PHOTO">Photo</option>
            <option value="VIDEO">Video</option>
            <option value="MIXED">Mixed</option>
            <option value="OTHER">Other</option>
          </select>
        </label>
        <button type="submit" className={ui.button}>
          Filter
        </button>
      </form>

      {mediaLocations.length === 0 ? (
        <p className={ui.muted}>No media locations match.</p>
      ) : (
        mediaLocations.map((ml) => (
          <div key={ml.id} className={ui.card}>
            <span className={ui.badgeClasses(mediaTypeBadgeClasses(ml.mediaType))}>
              {ml.mediaType}
            </span>
            <p className="mt-2.5">
              {ml.folderPath}
              <CopyButton text={ml.folderPath} />
            </p>
            {ml.session && (
              <p className={`${ui.muted} mt-2`}>
                Session:{" "}
                <Link
                  href={`/events/${event.id}/sessions/${ml.session.id}`}
                  className="hover:underline hover:decoration-accent hover:decoration-2"
                >
                  {ml.session.name}
                </Link>
              </p>
            )}
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
                href={`/events/${event.id}/media-locations/${ml.id}/edit`}
                className="hover:underline hover:decoration-accent hover:decoration-2"
              >
                Edit
              </Link>
              <DeleteMediaLocationForm
                mediaLocationId={ml.id}
                eventId={event.id}
                returnTo={returnTo}
                className="text-sm text-danger hover:underline hover:decoration-accent hover:decoration-2"
              />
            </div>
          </div>
        ))
      )}
    </div>
  );
}

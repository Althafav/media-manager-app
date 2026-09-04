import type { SessionSpeaker } from '@/lib/session-speaker'
import * as ui from '@/lib/ui'

function initialsOf(name: string) {
  const parts = name.trim().split(/\s+/)
  return ((parts[0]?.[0] ?? '') + (parts[parts.length - 1]?.[0] ?? '')).toUpperCase()
}

export function SessionSpeakers({ speakers }: { speakers: SessionSpeaker[] }) {
  if (speakers.length === 0) return null

  return (
    <div className="grid gap-3 sm:grid-cols-2">
      {speakers.map((speaker, i) => (
        <div key={i} className={`${ui.card} flex items-center gap-3`}>
          {speaker.imageUrl ? (
            // eslint-disable-next-line @next/next/no-img-element -- external agenda-hosted photos, no next/image remote config
            <img
              src={speaker.imageUrl}
              alt={speaker.name}
              className="w-12 h-12 rounded-full object-cover shrink-0 border border-rule"
            />
          ) : (
            <span className="flex items-center justify-center w-12 h-12 rounded-full shrink-0 bg-rule font-display font-bold text-ink-soft">
              {initialsOf(speaker.name)}
            </span>
          )}
          <span>
            <span className="block font-medium">{speaker.name}</span>
            {(speaker.jobTitle || speaker.organization) && (
              <span className={`block ${ui.muted}`}>
                {speaker.jobTitle}
                {speaker.jobTitle && speaker.organization && ' · '}
                {speaker.organization}
              </span>
            )}
          </span>
        </div>
      ))}
    </div>
  )
}

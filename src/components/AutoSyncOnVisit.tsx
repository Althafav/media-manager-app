'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import * as ui from '@/lib/ui'

// Fires once per page visit (no cron job) — on success it silently refreshes the page's
// server data; on failure it surfaces a banner so a stale view is never mistaken for current.
export function AutoSyncOnVisit({ eventId }: { eventId: string }) {
  const router = useRouter()
  const [status, setStatus] = useState<'syncing' | 'failed' | 'done'>('syncing')

  useEffect(() => {
    let cancelled = false

    fetch(`/events/${eventId}/sync`, { method: 'POST' })
      .then((res) => res.json() as Promise<{ ok: boolean; skipped?: boolean }>)
      .then((data) => {
        if (cancelled) return
        if (data.ok) {
          setStatus('done')
          // A throttled/skipped sync means nothing changed server-side — no need to refresh.
          if (!data.skipped) router.refresh()
        } else {
          setStatus('failed')
        }
      })
      .catch(() => {
        if (!cancelled) setStatus('failed')
      })

    return () => {
      cancelled = true
    }
  }, [eventId, router])

  if (status === 'syncing') {
    return (
      <p className={ui.bannerInfo}>
        <span className={ui.spinner} aria-hidden />
        Syncing with the agenda API…
      </p>
    )
  }
  if (status === 'failed') {
    return <p className={ui.bannerError}>Could not sync with the agenda API. Showing the last synced data.</p>
  }
  return null
}

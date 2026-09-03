'use client'

import { useEffect } from 'react'

// The corresponding <details> is already rendered open (server-side, keyed off the same
// sessionId) so this only needs to bring it into view — no need to also expand it here.
export function ScrollToSession({ sessionId }: { sessionId?: string }) {
  useEffect(() => {
    if (!sessionId) return
    document.getElementById(`session-${sessionId}`)?.scrollIntoView({ block: 'center' })
  }, [sessionId])

  return null
}

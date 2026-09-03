'use client'

import { useEffect } from 'react'

const DOM_ID_PREFIXES = ['session', 'booth', 'other-item']

// The corresponding <details> is already rendered open (server-side, keyed off the same
// id) so this only needs to bring it into view — no need to also expand it here. The id
// isn't kind-prefixed (it comes from a generic `open` query param), so this tries each
// row kind's DOM-id prefix rather than requiring the caller to know which kind it is.
export function ScrollToRow({ id }: { id?: string }) {
  useEffect(() => {
    if (!id) return
    for (const prefix of DOM_ID_PREFIXES) {
      const el = document.getElementById(`${prefix}-${id}`)
      if (el) {
        el.scrollIntoView({ block: 'center' })
        return
      }
    }
  }, [id])

  return null
}

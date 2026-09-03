'use client'

import { useEffect, useRef, useState } from 'react'
import * as ui from '@/lib/ui'

type SessionOption = { id: string; name: string }

export function SessionCombobox({
  name,
  sessions,
  defaultSessionId = '',
}: {
  name: string
  sessions: SessionOption[]
  defaultSessionId?: string
}) {
  const initial = sessions.find((s) => s.id === defaultSessionId)

  const [selectedId, setSelectedId] = useState(defaultSessionId)
  const [query, setQuery] = useState(initial ? initial.name : '')
  const [open, setOpen] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)

  const filtered = sessions.filter((s) => s.name.toLowerCase().includes(query.trim().toLowerCase()))

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false)
        const current = sessions.find((s) => s.id === selectedId)
        setQuery(current ? current.name : '')
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query, selectedId])

  function selectSession(s: SessionOption) {
    setSelectedId(s.id)
    setQuery(s.name)
    setOpen(false)
  }

  return (
    <div ref={containerRef} className="relative">
      <input type="hidden" name={name} value={selectedId} />
      <input
        type="text"
        role="combobox"
        aria-expanded={open}
        aria-controls="session-combobox-list"
        placeholder="Search sessions…"
        value={query}
        onFocus={() => setOpen(true)}
        onChange={(e) => {
          setSelectedId('')
          setQuery(e.target.value)
          setOpen(true)
        }}
        className={ui.input}
      />
      {open && (
        <ul
          id="session-combobox-list"
          role="listbox"
          className="absolute z-10 mt-1 w-full max-h-56 overflow-auto border border-rule bg-paper shadow-sm"
        >
          {filtered.map((s) => (
            <li
              key={s.id}
              onMouseDown={(e) => {
                e.preventDefault()
                selectSession(s)
              }}
              className={`px-2.5 py-2 text-sm cursor-pointer hover:bg-accent/10 ${
                selectedId === s.id ? 'bg-accent/5 font-medium' : ''
              }`}
            >
              {s.name}
            </li>
          ))}
          {filtered.length === 0 && (
            <li className="px-2.5 py-2 text-sm text-ink-soft">No matching sessions</li>
          )}
        </ul>
      )}
    </div>
  )
}

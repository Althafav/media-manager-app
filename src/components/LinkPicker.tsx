'use client'

import { Fragment, useEffect, useRef, useState } from 'react'
import * as ui from '@/lib/ui'

type Option = { id: string; name: string }
type Kind = 'session' | 'booth' | 'other-item'
type Selection = { kind: Kind; id: string } | null

const GROUP_LABELS: Record<Kind, string> = {
  session: 'Sessions',
  booth: 'Booths',
  'other-item': 'Other Items',
}

// A single search box over all three linkable entities, replacing three stacked
// comboboxes. Selecting an option from one group clears any other selection, but it
// still posts the same three discrete hidden fields the server action already expects.
export function LinkPicker({
  sessions,
  booths,
  otherItems,
  defaultSessionId = '',
  defaultBoothId = '',
  defaultOtherItemId = '',
}: {
  sessions: Option[]
  booths: Option[]
  otherItems: Option[]
  defaultSessionId?: string
  defaultBoothId?: string
  defaultOtherItemId?: string
}) {
  const groups: { kind: Kind; options: Option[] }[] = [
    { kind: 'session', options: sessions },
    { kind: 'booth', options: booths },
    { kind: 'other-item', options: otherItems },
  ]

  function nameOf(selection: Selection) {
    if (!selection) return ''
    return groups.find((g) => g.kind === selection.kind)?.options.find((o) => o.id === selection.id)?.name ?? ''
  }

  const initial: Selection = defaultSessionId
    ? { kind: 'session', id: defaultSessionId }
    : defaultBoothId
      ? { kind: 'booth', id: defaultBoothId }
      : defaultOtherItemId
        ? { kind: 'other-item', id: defaultOtherItemId }
        : null

  const [selected, setSelected] = useState<Selection>(initial)
  const [query, setQuery] = useState(nameOf(initial))
  const [open, setOpen] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)

  const q = query.trim().toLowerCase()
  const filteredGroups = groups
    .map((g) => ({ ...g, options: g.options.filter((o) => o.name.toLowerCase().includes(q)) }))
    .filter((g) => g.options.length > 0)

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false)
        setQuery(nameOf(selected))
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query, selected])

  function selectOption(kind: Kind, option: Option) {
    setSelected({ kind, id: option.id })
    setQuery(option.name)
    setOpen(false)
  }

  return (
    <div ref={containerRef} className="relative">
      <input type="hidden" name="sessionId" value={selected?.kind === 'session' ? selected.id : ''} />
      <input type="hidden" name="boothId" value={selected?.kind === 'booth' ? selected.id : ''} />
      <input type="hidden" name="otherItemId" value={selected?.kind === 'other-item' ? selected.id : ''} />
      <input
        type="text"
        role="combobox"
        aria-expanded={open}
        aria-controls="link-picker-list"
        placeholder="Search sessions, booths, items…"
        value={query}
        onFocus={() => setOpen(true)}
        onChange={(e) => {
          setSelected(null)
          setQuery(e.target.value)
          setOpen(true)
        }}
        className={ui.input}
      />
      {open && (
        <ul
          id="link-picker-list"
          role="listbox"
          className="absolute z-10 mt-1 w-full max-h-64 overflow-auto border border-rule bg-paper shadow-sm"
        >
          {filteredGroups.map((group) => (
            <Fragment key={group.kind}>
              <li
                aria-hidden
                className="px-2.5 pt-2 pb-1 font-mono text-[0.65rem] font-medium tracking-wider uppercase text-ink-soft bg-paper-card"
              >
                {GROUP_LABELS[group.kind]}
              </li>
              {group.options.map((option) => (
                <li
                  key={option.id}
                  role="option"
                  aria-selected={selected?.kind === group.kind && selected.id === option.id}
                  onMouseDown={(e) => {
                    e.preventDefault()
                    selectOption(group.kind, option)
                  }}
                  className={`px-2.5 py-2 text-sm cursor-pointer hover:bg-accent/10 ${
                    selected?.kind === group.kind && selected.id === option.id ? 'bg-accent/5 font-medium' : ''
                  }`}
                >
                  {option.name}
                </li>
              ))}
            </Fragment>
          ))}
          {filteredGroups.length === 0 && <li className="px-2.5 py-2 text-sm text-ink-soft">No matches</li>}
        </ul>
      )}
    </div>
  )
}

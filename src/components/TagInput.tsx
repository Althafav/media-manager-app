'use client'

import { useState, type KeyboardEvent } from 'react'
import * as ui from '@/lib/ui'

export function TagInput({ name, defaultTags = [] }: { name: string; defaultTags?: string[] }) {
  const [tags, setTags] = useState<string[]>(defaultTags)
  const [draft, setDraft] = useState('')

  function addTag() {
    const value = draft.trim()
    if (value && !tags.includes(value)) setTags([...tags, value])
    setDraft('')
  }

  function removeTag(tag: string) {
    setTags(tags.filter((t) => t !== tag))
  }

  function handleKeyDown(e: KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault()
      addTag()
    }
  }

  return (
    <div>
      <input type="hidden" name={name} value={tags.join(',')} />
      <div className="flex flex-wrap gap-1.5 mb-1.5">
        {tags.map((tag) => (
          <span key={tag} className={ui.tagChip}>
            {tag}
            <button
              type="button"
              onClick={() => removeTag(tag)}
              aria-label={`Remove ${tag}`}
              className="border-none bg-transparent p-0 text-sm leading-none w-auto"
            >
              ×
            </button>
          </span>
        ))}
      </div>
      <input
        type="text"
        placeholder="Add a tag and press Enter"
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        onKeyDown={handleKeyDown}
        onBlur={addTag}
        className={ui.input}
      />
    </div>
  )
}

'use client'

import { useState } from 'react'

export function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false)

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(text)
      setCopied(true)
      setTimeout(() => setCopied(false), 1500)
    } catch {
      // Clipboard access denied or unavailable — nothing to recover, leave the button as-is.
    }
  }

  return (
    <button
      type="button"
      onClick={handleCopy}
      className="font-mono text-[0.7rem] font-medium tracking-wider uppercase px-2 py-1 border border-rule rounded-[2px] bg-paper text-ink-soft cursor-pointer w-auto ml-2 hover:border-accent hover:text-accent transition-colors duration-150"
    >
      {copied ? 'Copied' : 'Copy'}
    </button>
  )
}

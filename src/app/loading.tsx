import * as ui from '@/lib/ui'

export default function Loading() {
  return (
    <div className={ui.page}>
      <div className="flex flex-col items-center justify-center gap-3 py-24">
        <span className="font-mono text-xs font-medium tracking-wider uppercase text-ink-soft">
          Loading…
        </span>
        <span className="h-1 w-40 overflow-hidden rounded-[2px] bg-rule">
          <span className="block h-full w-1/2 animate-pulse bg-accent" />


          
        </span>
      </div>
    </div>
  )
}

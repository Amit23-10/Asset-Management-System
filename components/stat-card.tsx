import type { LucideIcon } from 'lucide-react'
import { cn } from '@/lib/utils'

type StatCardProps = {
  label: string
  value: string | number
  hint?: string
  icon: LucideIcon
  className?: string
}

export function StatCard({ label, value, hint, icon: Icon, className }: StatCardProps) {
  return (
    <div
      className={cn(
        'relative overflow-hidden rounded-xl bg-gradient-to-br from-slate-900 via-slate-900 to-indigo-950 p-5 text-white shadow-lg ring-1 ring-white/10',
        className,
      )}
    >
      <div className="pointer-events-none absolute -top-10 -right-10 size-28 rounded-full bg-indigo-500/25 blur-2xl" />
      <div className="relative flex items-start justify-between gap-4">
        <div className="min-w-0">
          <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-slate-400">{label}</p>
          <p className="mt-2 truncate text-2xl font-extrabold tracking-tight" title={String(value)}>
            {value}
          </p>
          {hint ? <p className="mt-1 truncate text-xs text-slate-400" title={hint}>{hint}</p> : null}
        </div>
        <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-white/10 text-indigo-300">
          <Icon className="size-4" />
        </span>
      </div>
    </div>
  )
}

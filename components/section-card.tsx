import type { LucideIcon } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { cn } from '@/lib/utils'

type SectionCardProps = {
  title: string
  description?: string
  icon?: LucideIcon
  children: React.ReactNode
  className?: string
  contentClassName?: string
}

export function SectionCard({
  title,
  description,
  icon: Icon,
  children,
  className,
  contentClassName,
}: SectionCardProps) {
  return (
    <Card className={cn('gap-0 shadow-sm', className)}>
      <CardHeader className="border-b border-slate-100 px-5 py-4">
        <div className="flex items-center gap-3">
          {Icon ? (
            <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-indigo-50 text-indigo-600">
              <Icon className="size-4" />
            </span>
          ) : null}
          <div className="min-w-0">
            <CardTitle className="text-sm font-bold text-slate-950">{title}</CardTitle>
            {description ? (
              <CardDescription className="mt-0.5 text-xs">{description}</CardDescription>
            ) : null}
          </div>
        </div>
      </CardHeader>
      <CardContent className={cn('px-5 py-5', contentClassName)}>{children}</CardContent>
    </Card>
  )
}

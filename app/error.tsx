'use client'

import { AlertTriangle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader } from '@/components/ui/card'

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  return (
    <main className="flex min-h-svh items-center justify-center bg-slate-950 px-4">
      <Card className="w-full max-w-md gap-0 border-0 bg-white shadow-2xl">
        <CardHeader className="px-8 pt-8 pb-0">
          <div className="mb-5 flex size-11 items-center justify-center rounded-xl bg-red-50 text-red-600">
            <AlertTriangle className="size-5" />
          </div>
          <h1 className="text-2xl font-extrabold tracking-tight text-slate-950">
            Something went wrong
          </h1>
        </CardHeader>
        <CardContent className="space-y-5 px-8 pt-3 pb-8">
          <p className="text-sm text-slate-500">{error.message || 'Unexpected application error.'}</p>
          <Button size="lg" className="w-full" type="button" onClick={reset}>
            Try again
          </Button>
        </CardContent>
      </Card>
    </main>
  )
}

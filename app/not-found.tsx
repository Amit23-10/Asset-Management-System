import Link from 'next/link'
import { Compass } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader } from '@/components/ui/card'

export default function NotFound() {
  return (
    <main className="flex min-h-svh items-center justify-center bg-slate-950 px-4">
      <Card className="w-full max-w-md gap-0 border-0 bg-white shadow-2xl">
        <CardHeader className="px-8 pt-8 pb-0">
          <div className="mb-5 flex size-11 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600">
            <Compass className="size-5" />
          </div>
          <h1 className="text-2xl font-extrabold tracking-tight text-slate-950">Page not found</h1>
        </CardHeader>
        <CardContent className="space-y-5 px-8 pt-3 pb-8">
          <p className="text-sm text-slate-500">
            The route does not exist or you no longer have access.
          </p>
          <Button size="lg" className="w-full" render={<Link href="/" />}>
            Back to workspace
          </Button>
        </CardContent>
      </Card>
    </main>
  )
}

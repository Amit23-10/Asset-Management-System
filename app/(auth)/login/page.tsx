import { redirect } from 'next/navigation'
import { LoginForm } from '@/components/auth/login-form'
import { getServerAuthSession } from '@/lib/auth/session'
import { safeNextPath } from '@/lib/utils'
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'

export const metadata = { title: 'Sign in' }

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>
}) {
  const session = await getServerAuthSession()
  if (session.status === 'authenticated') redirect('/dashboard')

  const { next } = await searchParams

  return (
    <main className="relative flex min-h-svh items-center justify-center overflow-hidden bg-slate-950 px-4 py-10">
      <div className="pointer-events-none absolute -top-28 -left-24 size-[380px] rounded-full bg-indigo-500/30 blur-[110px]" />
      <div className="pointer-events-none absolute -right-20 -bottom-32 size-[420px] rounded-full bg-violet-600/25 blur-[120px]" />
      <div className="auth-grid pointer-events-none absolute inset-0 opacity-70" />

      <Card className="relative z-10 w-full max-w-[430px] gap-0 overflow-hidden border-0 bg-white shadow-2xl ring-0">
        <div className="absolute inset-x-0 top-0 h-[3px] animate-pulse bg-gradient-to-r from-indigo-500 via-violet-500 to-sky-400" />
        <CardHeader className="px-8 pt-9 pb-0">
          <div className="mb-6 flex size-12 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-500 to-violet-600 text-sm font-extrabold text-white shadow-lg">
            AM
          </div>
          <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-indigo-600">
            Continental Works
          </p>
          <h1 className="mt-1 text-[28px] font-extrabold tracking-tight text-slate-950">
            Welcome back
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Sign in to your asset management account
          </p>
        </CardHeader>

        <CardContent className="px-8 pt-6 pb-7">
          <Separator className="mb-6" />
          <LoginForm next={safeNextPath(next, '/dashboard')} />
        </CardContent>

        <CardFooter className="justify-center border-t border-slate-100 bg-slate-50 px-8 py-4 text-xs font-medium tracking-wide text-slate-400 uppercase">
          Asset Management System
        </CardFooter>
      </Card>
    </main>
  )
}

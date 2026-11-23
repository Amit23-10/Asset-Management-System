'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { LogOut } from 'lucide-react'
import { logout } from '@/lib/api/auth-client'
import { Button } from '@/components/ui/button'
import { Spinner } from '@/components/ui/spinner'
import { cn } from '@/lib/utils'

export function useLogout() {
  const router = useRouter()
  const [pending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)

  function runLogout() {
    setError(null)
    startTransition(async () => {
      try {
        await logout()
        router.replace('/login')
        router.refresh()
      } catch (cause) {
        setError(cause instanceof Error ? cause.message : 'Logout failed')
      }
    })
  }

  return { runLogout, pending, error }
}

type LogoutButtonProps = {
  variant?: 'default' | 'icon'
  className?: string
  label?: string
}

export function LogoutButton({
  variant = 'default',
  className,
  label = 'Sign out',
}: LogoutButtonProps) {
  const { runLogout, pending, error } = useLogout()

  if (variant === 'icon') {
    return (
      <Button
        type="button"
        variant="ghost"
        size="icon"
        aria-label={label}
        title={label}
        onClick={runLogout}
        disabled={pending}
        className={cn('text-slate-500 hover:text-slate-900', className)}
      >
        {pending ? <Spinner /> : <LogOut className="size-4" />}
      </Button>
    )
  }

  return (
    <div className={cn('space-y-1', className)}>
      <Button variant="outline" type="button" onClick={runLogout} disabled={pending}>
        {pending ? <Spinner /> : <LogOut className="size-4" />}
        {pending ? 'Signing out…' : label}
      </Button>
      {error ? <p className="text-xs text-destructive">{error}</p> : null}
    </div>
  )
}

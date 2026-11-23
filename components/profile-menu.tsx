'use client'

import { useRouter } from 'next/navigation'
import {
  ChevronDown,
  CircleUserRound,
  KeyRound,
  LogOut,
  PanelLeftClose,
  PanelLeftOpen,
  RotateCcw,
  ShieldCheck,
} from 'lucide-react'
import { useLogout } from '@/components/auth/logout-button'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Spinner } from '@/components/ui/spinner'
import type { SessionUser } from '@/lib/types'
import { cn, initials } from '@/lib/utils'

type ProfileMenuProps = {
  user: SessionUser
  collapsed: boolean
  onToggleCollapsed: () => void
  onResetLayout: () => void
  trigger?: 'avatar' | 'icon'
  className?: string
}

export function ProfileMenu({
  user,
  collapsed,
  onToggleCollapsed,
  onResetLayout,
  trigger = 'avatar',
  className,
}: ProfileMenuProps) {
  const router = useRouter()
  const { runLogout, pending } = useLogout()
  const userInitials = initials(user.name)

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        aria-label="Open profile menu"
        className={cn(
          'group inline-flex items-center rounded-full outline-none transition-colors focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2',
          trigger === 'icon'
            ? 'size-8 justify-center text-white hover:bg-white/10'
            : 'gap-1.5 py-0.5 pr-1 pl-0.5 hover:bg-slate-100',
          className,
        )}
      >
        {trigger === 'icon' ? (
          <CircleUserRound className="size-5" />
        ) : (
          <>
            <Avatar size="sm">
              <AvatarFallback className="bg-indigo-50 text-[10px] font-bold text-indigo-700">
                {userInitials}
              </AvatarFallback>
            </Avatar>
            <ChevronDown className="size-3.5 text-slate-400" />
          </>
        )}
      </DropdownMenuTrigger>

      <DropdownMenuContent align="end" sideOffset={8} className="w-72">
        <div className="flex items-start gap-3 px-2 py-2">
          <Avatar size="lg">
            <AvatarFallback className="bg-indigo-50 text-xs font-bold text-indigo-700">
              {userInitials}
            </AvatarFallback>
          </Avatar>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-bold text-slate-950">{user.name}</p>
            <p className="truncate text-xs text-muted-foreground">
              {user.email || 'No email on file'}
            </p>
            <div className="mt-1.5 flex flex-wrap gap-1">
              {user.roles.length ? (
                user.roles.slice(0, 2).map((role) => (
                  <Badge key={role} variant="secondary" className="text-[10px]">
                    {role}
                  </Badge>
                ))
              ) : (
                <Badge variant="outline" className="text-[10px]">
                  No mapped roles
                </Badge>
              )}
            </div>
          </div>
        </div>

        <DropdownMenuSeparator />
        <DropdownMenuGroup>
          <DropdownMenuLabel>Account</DropdownMenuLabel>
          <DropdownMenuItem onClick={() => router.push('/dashboard#session')}>
            <ShieldCheck />
            Session details
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => router.push('/dashboard#access')}>
            <CircleUserRound />
            Access &amp; roles
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => router.push('/dashboard#capabilities')}>
            <KeyRound />
            Capabilities
          </DropdownMenuItem>
        </DropdownMenuGroup>

        <DropdownMenuSeparator />
        <DropdownMenuGroup>
          <DropdownMenuLabel>Settings</DropdownMenuLabel>
          <DropdownMenuItem onClick={onToggleCollapsed}>
            {collapsed ? <PanelLeftOpen /> : <PanelLeftClose />}
            {collapsed ? 'Expand navigation' : 'Collapse navigation'}
          </DropdownMenuItem>
          <DropdownMenuItem onClick={onResetLayout}>
            <RotateCcw />
            Reset layout
          </DropdownMenuItem>
        </DropdownMenuGroup>

        <DropdownMenuSeparator />
        <DropdownMenuItem variant="destructive" onClick={runLogout} disabled={pending}>
          {pending ? <Spinner /> : <LogOut />}
          {pending ? 'Signing out…' : 'Sign out'}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

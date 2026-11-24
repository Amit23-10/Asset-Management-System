'use client'

import { useEffect, useMemo, useState, useSyncExternalStore } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ChevronUp,
  Menu,
  X,
} from 'lucide-react'
import { LogoutButton } from '@/components/auth/logout-button'
import { ProfileMenu } from '@/components/profile-menu'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  findActiveNavItem,
  hrefPath,
  NAV_GROUPS,
  visibleNavGroups,
} from '@/lib/navigation'
import { useLocalStorageState } from '@/hooks/use-local-storage-state'
import type { SessionUser } from '@/lib/types'
import { cn, initials } from '@/lib/utils'

const SIDEBAR_COLLAPSED_KEY = 'mm.shell.sidebar.collapsed'
const SECTIONS_KEY = 'mm.shell.sections.v1'
const EMPTY_SECTIONS: Record<string, boolean> = {}

function subscribeToHash(listener: () => void) {
  window.addEventListener('hashchange', listener)
  return () => window.removeEventListener('hashchange', listener)
}

function getHashSnapshot() {
  return typeof window === 'undefined' ? '' : window.location.hash
}

export function AppShell({
  user,
  children,
}: {
  user: SessionUser
  children: React.ReactNode
}) {
  const pathname = usePathname()
  const hash = useSyncExternalStore(subscribeToHash, getHashSnapshot, () => '')
  const [mobileOpen, setMobileOpen] = useState(false)
  const [collapsed, setCollapsed] = useLocalStorageState(SIDEBAR_COLLAPSED_KEY, false)
  const [collapsedSections, setCollapsedSections] = useLocalStorageState<Record<string, boolean>>(
    SECTIONS_KEY,
    EMPTY_SECTIONS,
  )

  useEffect(() => {
    const onPopState = () => setMobileOpen(false)
    window.addEventListener('popstate', onPopState)
    return () => window.removeEventListener('popstate', onPopState)
  }, [])

  useEffect(() => {
    if (!mobileOpen) return

    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setMobileOpen(false)
    }
    window.addEventListener('keydown', onKeyDown)

    return () => {
      document.body.style.overflow = previousOverflow
      window.removeEventListener('keydown', onKeyDown)
    }
  }, [mobileOpen])

  const groups = useMemo(() => visibleNavGroups(NAV_GROUPS, user), [user])
  const activeItem = useMemo(
    () => findActiveNavItem(groups, pathname, hash),
    [groups, pathname, hash],
  )
  const activeGroup = groups.find((group) =>
    group.items.some((item) => item.href === activeItem?.href),
  )
  const isDetailRoute = Boolean(
    activeItem && pathname !== hrefPath(activeItem.href),
  )
  const userInitials = initials(user.name)

  function toggleSection(label: string) {
    setCollapsedSections((current) => ({ ...current, [label]: !current[label] }))
  }

  function resetLayout() {
    setCollapsed(false)
    setCollapsedSections(EMPTY_SECTIONS)
  }

  function renderSidebar(mobile: boolean) {
    const rail = !mobile && collapsed

    return (
      <div className="flex h-full flex-col bg-[#0F172A] text-slate-300">
        <div
          className={cn(
            'flex h-14 shrink-0 items-center border-b border-white/10',
            rail ? 'justify-center px-2' : 'gap-3 px-4',
          )}
        >
          {rail ? (
            <Button
              type="button"
              variant="ghost"
              size="icon"
              aria-label="Expand navigation"
              title="Expand navigation"
              onClick={() => setCollapsed(false)}
              className="text-white hover:bg-white/10 hover:text-white"
            >
              <Menu className="size-5" />
            </Button>
          ) : (
            <>
              <span className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 text-[11px] font-extrabold text-white shadow-lg">
                AM
              </span>
              <span className="min-w-0 flex-1">
                <span className="block truncate text-[10px] font-semibold uppercase tracking-[0.16em] text-slate-500">
                  Continental Works
                </span>
                <span className="block truncate text-sm font-bold text-white">Asset Management System</span>
              </span>
              {mobile ? (
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  aria-label="Close navigation menu"
                  onClick={() => setMobileOpen(false)}
                  className="text-slate-300 hover:bg-white/10 hover:text-white"
                >
                  <X className="size-5" />
                </Button>
              ) : (
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  aria-label="Collapse navigation"
                  title="Collapse navigation"
                  onClick={() => setCollapsed(true)}
                  className="text-slate-400 hover:bg-white/10 hover:text-white"
                >
                  <ChevronLeft className="size-5" />
                </Button>
              )}
            </>
          )}
        </div>

        <nav
          aria-label="Main navigation"
          className="min-h-0 flex-1 overflow-y-auto px-2 py-3"
        >
          {groups.map((group) => {
            const sectionCollapsed = collapsedSections[group.label] ?? false

            return (
              <div key={group.label} className="mb-2">
                {!rail ? (
                  <button
                    type="button"
                    onClick={() => toggleSection(group.label)}
                    aria-expanded={!sectionCollapsed}
                    className="mt-1 flex w-full items-center justify-between rounded-lg px-3 py-2 text-left text-[10px] font-extrabold uppercase tracking-[0.14em] text-slate-500 transition-colors hover:bg-white/5 hover:text-slate-300"
                  >
                    {group.label}
                    {sectionCollapsed ? (
                      <ChevronDown className="size-3.5" />
                    ) : (
                      <ChevronUp className="size-3.5" />
                    )}
                  </button>
                ) : (
                  <div className="mx-auto my-2 h-px w-8 bg-white/10" />
                )}

                <div className={cn(sectionCollapsed && !rail && 'hidden')}>
                  {group.items.map((item) => {
                    const Icon = item.icon
                    const selected = activeItem?.href === item.href

                    return (
                      <Link
                        key={item.href}
                        href={item.href}
                        onClick={() => setMobileOpen(false)}
                        aria-current={selected ? 'page' : undefined}
                        title={rail ? item.label : undefined}
                        className={cn(
                          'relative flex items-center rounded-lg text-sm transition-colors focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-indigo-400',
                          rail ? 'justify-center px-2 py-2.5' : 'gap-3 px-3 py-2.5',
                          selected
                            ? 'bg-white/10 font-semibold text-white'
                            : 'font-medium text-slate-400 hover:bg-white/5 hover:text-white',
                        )}
                      >
                        {selected ? (
                          <span className="absolute top-1/2 left-0 h-6 w-1 -translate-y-1/2 rounded-r-full bg-indigo-400" />
                        ) : null}
                        <Icon className="size-[18px] shrink-0" />
                        {!rail ? <span className="truncate">{item.label}</span> : null}
                      </Link>
                    )
                  })}
                </div>
              </div>
            )
          })}
        </nav>

        <div className={cn('shrink-0 border-t border-white/10', rail ? 'p-2' : 'p-3')}>
          {!rail ? (
            <>
              <div className="flex items-center gap-3">
                <Avatar size="lg" className="border border-white/10 bg-slate-800">
                  <AvatarFallback className="bg-slate-800 text-xs font-bold text-indigo-200">
                    {userInitials}
                  </AvatarFallback>
                </Avatar>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold text-white">{user.name}</p>
                  <p className="truncate text-xs text-slate-500">{user.email || 'No email on file'}</p>
                </div>
              </div>
              <div className="mt-2 flex flex-wrap gap-1.5">
                {user.roles.length ? (
                  user.roles.slice(0, 3).map((role) => (
                    <Badge
                      key={role}
                      variant="secondary"
                      className="bg-white/10 text-[10px] text-slate-200"
                    >
                      {role}
                    </Badge>
                  ))
                ) : (
                  <Badge
                    variant="outline"
                    className="border-white/15 text-[10px] text-slate-500"
                  >
                    No mapped roles
                  </Badge>
                )}
              </div>
              <LogoutButton
                className="mt-3 [&>button]:w-full"
                label="Sign out"
              />
            </>
          ) : (
            <LogoutButton
              variant="icon"
              label="Sign out"
              className="mx-auto text-slate-400 hover:bg-white/10 hover:text-white"
            />
          )}
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-svh bg-[#F8F9FC] text-slate-900">
      {/* Mobile app bar */}
      <div className="fixed inset-x-0 top-0 z-40 flex h-14 items-center border-b border-white/10 bg-[#0F172A]/95 px-2 text-white backdrop-blur lg:hidden">
        <Button
          type="button"
          variant="ghost"
          size="icon"
          aria-label="Open navigation menu"
          aria-expanded={mobileOpen}
          aria-controls="mobile-navigation"
          onClick={() => setMobileOpen(true)}
          className="text-white hover:bg-white/10 hover:text-white"
        >
          <Menu className="size-5" />
        </Button>
        <Link href="/dashboard" className="ml-2 truncate text-sm font-bold">
          Asset Management System
        </Link>
        <div className="ml-auto flex items-center">
          <ProfileMenu
            user={user}
            collapsed={collapsed}
            onToggleCollapsed={() => setCollapsed(!collapsed)}
            onResetLayout={resetLayout}
            trigger="icon"
          />
        </div>
      </div>

      {/* Mobile drawer */}
      <div
        className={cn(
          'fixed inset-0 z-50 lg:hidden',
          mobileOpen ? '' : 'pointer-events-none',
        )}
        aria-hidden={!mobileOpen}
      >
        <button
          type="button"
          aria-label="Close navigation menu"
          tabIndex={mobileOpen ? 0 : -1}
          onClick={() => setMobileOpen(false)}
          className={cn(
            'absolute inset-0 bg-slate-950/60 backdrop-blur-sm transition-opacity duration-200',
            mobileOpen ? 'opacity-100' : 'opacity-0',
          )}
        />
        <aside
          id="mobile-navigation"
          role="dialog"
          aria-modal="true"
          aria-label="Navigation"
          className={cn(
            'absolute inset-y-0 left-0 w-[min(18rem,85vw)] shadow-2xl transition-transform duration-200 ease-out',
            mobileOpen ? 'translate-x-0' : '-translate-x-full',
          )}
        >
          {renderSidebar(true)}
        </aside>
      </div>

      {/* Desktop sidebar */}
      <aside
        className={cn(
          'hidden lg:fixed lg:inset-y-0 lg:left-0 lg:z-40 lg:flex lg:flex-col transition-[width] duration-200 ease-out',
          collapsed ? 'lg:w-[76px]' : 'lg:w-64',
        )}
      >
        {renderSidebar(false)}
      </aside>

      <div
        className={cn(
          'min-h-svh pt-14 transition-[padding] duration-200 ease-out lg:pt-0',
          collapsed ? 'lg:pl-[76px]' : 'lg:pl-64',
        )}
      >
        {/* Dynamic page context navbar */}
        <div className="sticky top-14 z-30 flex h-12 items-center gap-3 border-b border-slate-200 bg-white/90 px-3 backdrop-blur sm:px-6 lg:top-0">
          <nav aria-label="Page context" className="flex min-w-0 items-center gap-2 text-xs">
            <span className="hidden font-semibold text-slate-500 sm:inline">
              Asset Management System
            </span>
            <ChevronRight className="hidden size-3.5 text-slate-300 sm:block" />
            {activeGroup ? (
              <>
                <span className="truncate font-semibold text-slate-500">
                  {activeGroup.label}
                </span>
                <ChevronRight className="size-3.5 shrink-0 text-slate-300" />
              </>
            ) : null}
            <span className="truncate font-bold text-slate-900">
              {activeItem?.label ?? 'Dashboard'}
            </span>
            {isDetailRoute ? (
              <>
                <ChevronRight className="size-3.5 shrink-0 text-slate-300" />
                <span className="font-semibold text-indigo-600">Details</span>
              </>
            ) : null}
          </nav>

          <div className="ml-auto flex shrink-0 items-center gap-2">
            <Badge className="hidden bg-emerald-50 text-emerald-700 sm:inline-flex">
              Session active
            </Badge>
            <ProfileMenu
              user={user}
              collapsed={collapsed}
              onToggleCollapsed={() => setCollapsed(!collapsed)}
              onResetLayout={resetLayout}
              className="hidden sm:inline-flex"
            />
          </div>
        </div>

        <main className="px-3 py-5 sm:px-6 lg:px-8">{children}</main>
      </div>
    </div>
  )
}

import { Boxes, Building2, CircleUserRound, Coins, KeyRound, ShieldCheck, TrendingDown, Wallet } from 'lucide-react'
import { SectionCard } from '@/components/section-card'
import { StatCard } from '@/components/stat-card'
import { MockDataNotice } from '@/components/features/mock-data-notice'
import { MOCK_ASSET_STATS } from '@/lib/mock-data'
import { Badge } from '@/components/ui/badge'
import { serverFrappeRequest } from '@/lib/api/frappe'
import { requireUser } from '@/lib/auth/session'

export const metadata = { title: 'Dashboard' }

type AssetStats = {
  assetCount: number
  activeCount: number
  disposedCount: number
  totalCost: number
  totalAccumulatedDepn: number
  totalBookValue: number
  monthAdditions: number
  monthDisposals: number
  lastPeriod: string
}

function money(value: number): string {
  return value.toLocaleString('en-IN', { maximumFractionDigits: 2 })
}

function Detail({ label, value }: { label: string; value: string }) {
  return (
    <div className="min-w-0">
      <dt className="text-[11px] font-bold uppercase tracking-[0.12em] text-slate-400">{label}</dt>
      <dd className="mt-1 truncate text-sm font-medium text-slate-900" title={value}>
        {value}
      </dd>
    </div>
  )
}

export default async function DashboardPage() {
  const user = await requireUser()
  const firstName = user.name.split(/\s+/)[0] || user.name
  const elevated = user.isAdministrator || user.isWorkshopAdmin
  const liveStats = await serverFrappeRequest<AssetStats>('/api/method/asset.api.dashboard.stats').catch(
    () => null,
  )
  const stats = liveStats ?? MOCK_ASSET_STATS
  const usingMock = liveStats === null

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-indigo-600">
            Overview
          </p>
          <h1 className="mt-1 text-2xl font-extrabold tracking-tight text-slate-950 sm:text-3xl">
            Welcome back, {firstName}
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            ERP session active. Protected routes read identity and access from the server.
          </p>
        </div>
        <Badge variant="secondary" className="bg-emerald-50 text-emerald-700">
          Signed in
        </Badge>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Account"
          value={user.name}
          hint={user.email || 'No email on file'}
          icon={CircleUserRound}
        />
        <StatCard
          label="Roles"
          value={user.roles.length}
          hint={user.roles.length ? user.roles.slice(0, 2).join(', ') : 'No mapped roles'}
          icon={ShieldCheck}
        />
        <StatCard
          label="Shop scope"
          value={user.shopIds.length}
          hint={user.shopIds.length ? 'ERP-scoped shops' : 'No shop scope returned'}
          icon={Building2}
        />
        <StatCard
          label="Capabilities"
          value={user.capabilities.length}
          hint={user.capabilities.length ? 'From ERP session' : 'No capabilities returned'}
          icon={KeyRound}
        />
      </div>

      {usingMock ? <MockDataNotice /> : null}

      <div className="space-y-3">
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <StatCard
            label="Total Assets"
            value={stats.assetCount}
            hint={`${stats.activeCount} active · ${stats.disposedCount} disposed`}
            icon={Boxes}
          />
          <StatCard
            label="Total Cost"
            value={money(stats.totalCost)}
            hint={`${stats.monthAdditions} added this month`}
            icon={Wallet}
          />
          <StatCard
            label="Accumulated Depreciation"
            value={money(stats.totalAccumulatedDepn)}
            hint={`Last period: ${stats.lastPeriod}`}
            icon={TrendingDown}
          />
          <StatCard
            label="Book Value"
            value={money(stats.totalBookValue)}
            hint={`${stats.monthDisposals} disposals this month`}
            icon={Coins}
          />
        </div>
      </div>

      <div className="grid gap-5 lg:grid-cols-2">
        <SectionCard
          title="Access"
          description="Normalized frontend roles derived from the ERP session."
          icon={ShieldCheck}
          className="scroll-mt-20"
        >
          <div id="access" className="scroll-mt-20">
            <div className="flex flex-wrap gap-2">
              {user.roles.length ? (
                user.roles.map((role) => (
                  <Badge key={role} variant="secondary" className="bg-indigo-50 text-indigo-700">
                    {role}
                  </Badge>
                ))
              ) : (
                <Badge variant="outline">No mapped roles</Badge>
              )}
            </div>
            <div className="mt-5 rounded-lg border border-slate-200 bg-slate-50 px-4 py-3 text-sm">
              <span className="font-semibold text-slate-900">
                {elevated ? 'Elevated access' : 'Standard access'}
              </span>
              <span className="ml-2 text-slate-500">
                {elevated
                  ? 'Administrator flags bypass frontend role guards.'
                  : 'Frontend guards apply; ERP still enforces authorization.'}
              </span>
            </div>
          </div>
        </SectionCard>

        <SectionCard
          title="ERP session"
          description="Identity supplied by workshop.api.auth.me."
          icon={CircleUserRound}
        >
          <div id="session" className="scroll-mt-20">
            <dl className="grid gap-4 sm:grid-cols-2">
              <Detail label="User ID" value={user.id} />
              <Detail label="Email" value={user.email || '—'} />
              <Detail label="Site" value={user.siteName || '—'} />
              <Detail
                label="Shops"
                value={user.shopIds.length ? user.shopIds.join(', ') : '—'}
              />
            </dl>
          </div>
        </SectionCard>
      </div>

      <SectionCard
        title="Capabilities"
        description="Raw ERP capability list. UI guards never replace ERP authorization."
        icon={KeyRound}
      >
        <div id="capabilities" className="scroll-mt-20">
          {user.capabilities.length ? (
            <div className="flex flex-wrap gap-2">
              {user.capabilities.map((capability) => (
                <Badge key={capability} variant="outline" className="font-mono text-[11px]">
                  {capability}
                </Badge>
              ))}
            </div>
          ) : (
            <div className="rounded-lg border border-dashed border-slate-300 py-10 text-center">
              <p className="text-sm font-medium text-slate-900">No capabilities returned</p>
              <p className="mt-1 text-xs text-slate-500">
                ERP may rely on roles instead of capability strings.
              </p>
            </div>
          )}
        </div>
      </SectionCard>
    </div>
  )
}

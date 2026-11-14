import type { AnalyticsStat } from '../../lib/analyticsApi.ts'
import type { Stat, StatIcon } from '../../content/studypal.ts'
import { PanelError } from './PanelError.tsx'
import { StatCard } from './StatCard.tsx'

type StatsGridProps = {
  stats: readonly AnalyticsStat[]
  loading: boolean
  error: string | null
  onRetry: () => void
}

const STAT_ICONS: Record<string, StatIcon> = {
  study_minutes: 'clock',
  completed_goals: 'check',
  streak_days: 'flame',
  weekly_progress: 'target',
}

function toStat(item: AnalyticsStat): Stat {
  return {
    ...item,
    icon: STAT_ICONS[item.id] ?? 'clock',
  }
}

function StatsSkeleton() {
  return (
    <ul
      aria-label="学习统计加载中"
      aria-busy="true"
      className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4"
    >
      {Array.from({ length: 4 }, (_, index) => (
        <li key={index}>
          <div className="h-full rounded-2xl border border-[var(--dashboard-border)] bg-[var(--dashboard-surface)] p-5 shadow-[var(--dashboard-shadow)]">
            <div className="flex items-start justify-between gap-3">
              <span className="h-4 w-24 animate-pulse rounded bg-[var(--dashboard-surface-soft)] motion-reduce:animate-none" />
              <span className="size-10 animate-pulse rounded-xl bg-[var(--dashboard-surface-soft)] motion-reduce:animate-none" />
            </div>
            <span className="mt-5 block h-8 w-20 animate-pulse rounded bg-[var(--dashboard-surface-soft)] motion-reduce:animate-none" />
            <span className="mt-3 block h-3 w-full animate-pulse rounded bg-[var(--dashboard-surface-soft)] motion-reduce:animate-none" />
          </div>
        </li>
      ))}
    </ul>
  )
}

export function StatsGrid({ stats, loading, error, onRetry }: StatsGridProps) {
  if (loading) {
    return (
      <section aria-label="学习统计">
        <StatsSkeleton />
      </section>
    )
  }

  if (error !== null) {
    return (
      <section aria-label="学习统计">
        <PanelError message={error} onRetry={onRetry} />
      </section>
    )
  }

  if (stats.length === 0) {
    return (
      <section aria-label="学习统计">
        <p className="rounded-2xl border border-dashed border-[var(--dashboard-border-strong)] bg-[var(--dashboard-surface-soft)] px-4 py-8 text-center text-sm text-[var(--dashboard-muted)]">
          暂无学习统计。
        </p>
      </section>
    )
  }

  return (
    <section aria-label="学习统计">
      <ul className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {stats.map((item) => {
          const stat = toStat(item)
          return (
            <li key={stat.id} className="h-full">
              <StatCard stat={stat} />
            </li>
          )
        })}
      </ul>
    </section>
  )
}

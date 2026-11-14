import type { Stat } from '../../content/studypal.ts'
import { DashboardIcon } from './DashboardIcon.tsx'

type StatCardProps = {
  stat: Stat
}

export function StatCard({ stat }: StatCardProps) {
  return (
    <article className="flex h-full flex-col rounded-2xl border border-[var(--dashboard-border)] bg-[var(--dashboard-surface)] p-5 shadow-[var(--dashboard-shadow)]">
      <div className="flex items-start justify-between gap-3">
        <p className="text-sm font-medium text-[var(--dashboard-muted)]">
          {stat.label}
        </p>
        <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-[var(--dashboard-accent-soft)] text-[var(--dashboard-accent-strong)]">
          <DashboardIcon name={stat.icon} className="size-5" />
        </span>
      </div>
      <p className="mt-4 flex items-baseline gap-1 text-3xl font-bold tracking-tight text-[var(--dashboard-text)]">
        <span>{stat.value}</span>
        <span className="text-sm font-medium text-[var(--dashboard-muted)]">
          {stat.unit}
        </span>
      </p>
      <p className="mt-2 text-xs leading-relaxed text-[var(--dashboard-muted)]">
        {stat.description}
      </p>
    </article>
  )
}

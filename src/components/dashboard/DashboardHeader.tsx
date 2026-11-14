import { studyPalContent } from '../../content/studypal.ts'

type DashboardHeaderProps = {
  streakDays: number | null
  level: number | null
}

export function DashboardHeader({ streakDays, level }: DashboardHeaderProps) {
  const { user } = studyPalContent

  return (
    <header
      id="overview"
      className="scroll-mt-28 rounded-3xl border border-[var(--dashboard-border)] bg-[var(--dashboard-surface)] p-6 shadow-[var(--dashboard-shadow)] sm:p-8 lg:scroll-mt-8"
    >
      <div className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
        <div className="max-w-2xl">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--dashboard-accent-strong)]">
            {studyPalContent.productName} / 总览
          </p>
          <h1
            id="dashboard-title"
            className="mt-2 text-3xl font-bold tracking-tight text-balance sm:text-4xl"
          >
            {user.greeting}，{user.name}
          </h1>
          <p className="mt-3 text-pretty text-sm leading-relaxed text-[var(--dashboard-muted)] sm:text-base">
            {user.summary}
          </p>
        </div>
        <div className="flex w-fit items-center gap-2 rounded-full border border-[var(--dashboard-border)] bg-[var(--dashboard-surface-soft)] px-4 py-2 text-xs font-medium text-[var(--dashboard-muted)]">
          <span
            aria-hidden="true"
            className="size-2 rounded-full bg-[var(--dashboard-success)]"
          />
          {streakDays === null || level === null
            ? '今天 · 继续积累'
            : `连续 ${streakDays} 天 · Lv.${level}`}
        </div>
      </div>
    </header>
  )
}

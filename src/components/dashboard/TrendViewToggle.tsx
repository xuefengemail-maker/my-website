import type { TrendView } from '../../lib/analyticsApi.ts'

type TrendViewToggleProps = {
  view: TrendView
  onChange: (view: TrendView) => void
}

const VIEW_LABELS: Record<TrendView, string> = {
  week: '本周',
  month: '本月',
}

export function TrendViewToggle({ view, onChange }: TrendViewToggleProps) {
  return (
    <div
      role="group"
      aria-label="趋势时间范围"
      className="inline-flex w-fit rounded-xl border border-[var(--dashboard-border)] bg-[var(--dashboard-surface-soft)] p-1"
    >
      {(Object.keys(VIEW_LABELS) as TrendView[]).map((option) => {
        const isSelected = view === option

        return (
          <button
            key={option}
            type="button"
            aria-pressed={isSelected}
            onClick={() => onChange(option)}
            className={
              isSelected
                ? 'inline-flex min-h-11 items-center justify-center rounded-lg bg-[var(--dashboard-accent)] px-4 text-sm font-semibold text-[var(--dashboard-accent-contrast)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--hero-focus-ring)]'
                : 'inline-flex min-h-11 items-center justify-center rounded-lg px-4 text-sm font-medium text-[var(--dashboard-muted)] hover:text-[var(--dashboard-text)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--hero-focus-ring)]'
            }
          >
            {VIEW_LABELS[option]}
          </button>
        )
      })}
    </div>
  )
}

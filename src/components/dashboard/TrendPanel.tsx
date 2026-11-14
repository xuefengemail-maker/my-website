import type { TrendPoint, TrendView } from '../../lib/analyticsApi.ts'
import { PanelError } from './PanelError.tsx'
import { TrendChart } from './TrendChart.tsx'
import { TrendViewToggle } from './TrendViewToggle.tsx'

type TrendPanelProps = {
  view: TrendView
  onViewChange: (view: TrendView) => void
  points: readonly TrendPoint[] | null
  loading: boolean
  error: string | null
  onRetry: () => void
}

function TrendSkeleton() {
  return (
    <div
      aria-busy="true"
      aria-label="学习趋势加载中"
      className="mt-5 flex h-64 items-end gap-3 rounded-2xl border border-[var(--dashboard-border)] bg-[var(--dashboard-surface-soft)] p-4"
    >
      {Array.from({ length: 7 }, (_, index) => (
        <span
          key={index}
          className="flex-1 animate-pulse rounded-t-xl bg-[var(--dashboard-border)] motion-reduce:animate-none"
        />
      ))}
    </div>
  )
}

export function TrendPanel({
  view,
  onViewChange,
  points,
  loading,
  error,
  onRetry,
}: TrendPanelProps) {
  const chartPoints = points?.map((point) => ({ ...point, value: point.value / 60 })) ?? []
  const hasChartData = chartPoints.length >= 2

  return (
    <section
      id="trends"
      aria-labelledby="trends-title"
      className="scroll-mt-28 rounded-3xl border border-[var(--dashboard-border)] bg-[var(--dashboard-surface)] p-5 shadow-[var(--dashboard-shadow)] sm:p-6 lg:scroll-mt-8"
      aria-busy={loading}
    >
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--dashboard-accent-strong)]">
            Momentum
          </p>
          <h2 id="trends-title" className="mt-1 text-xl font-bold tracking-tight">
            学习趋势
          </h2>
          <p className="mt-1 text-sm text-[var(--dashboard-muted)]">
            观察学习节奏，及时调整每日计划。
          </p>
        </div>
        <TrendViewToggle view={view} onChange={onViewChange} />
      </div>

      {loading ? <TrendSkeleton /> : null}

      {!loading && error !== null ? (
        <div className="mt-5">
          <PanelError message={error} onRetry={onRetry} />
        </div>
      ) : null}

      {!loading && error === null && hasChartData ? (
        <TrendChart points={chartPoints} view={view} />
      ) : null}

      {!loading && error === null && !hasChartData ? (
        <p
          role="status"
          className="mt-5 rounded-2xl border border-dashed border-[var(--dashboard-border-strong)] bg-[var(--dashboard-surface-soft)] px-4 py-8 text-center text-sm text-[var(--dashboard-muted)]"
        >
          当前视图暂无可展示的趋势数据。
        </p>
      ) : null}
    </section>
  )
}

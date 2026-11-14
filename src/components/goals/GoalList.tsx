import { formatDateLabel } from '../../lib/date.ts'
import type { Goal } from '../../lib/goalsApi.ts'
import { GoalItem } from '../dashboard/GoalItem.tsx'
import { PanelError } from '../dashboard/PanelError.tsx'

type GoalListProps = {
  date: string
  goals: readonly Goal[]
  loading: boolean
  error: string | null
  pendingGoalId: number | null
  onRetry: () => void
  onToggle: (id: number) => void
}

function GoalsSkeleton() {
  return (
    <div aria-busy="true" aria-label="学习目标加载中" className="mt-5 flex flex-col gap-2">
      {Array.from({ length: 3 }, (_, index) => (
        <span
          key={index}
          className="h-14 animate-pulse rounded-xl bg-[var(--dashboard-surface-soft)] motion-reduce:animate-none"
        />
      ))}
    </div>
  )
}

export function GoalList({
  date,
  goals,
  loading,
  error,
  pendingGoalId,
  onRetry,
  onToggle,
}: GoalListProps) {
  const total = goals.length
  const completedCount = goals.filter((goal) => goal.status === 'completed').length
  const isComplete = total > 0 && completedCount === total

  return (
    <section
      aria-labelledby="goal-list-title"
      aria-busy={loading}
      className="rounded-3xl border border-[var(--dashboard-border)] bg-[var(--dashboard-surface)] p-5 shadow-[var(--dashboard-shadow)] sm:p-6"
    >
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--dashboard-accent-strong)]">
            Plan
          </p>
          <h2 id="goal-list-title" className="mt-1 text-xl font-bold tracking-tight">
            {formatDateLabel(date)}的目标
          </h2>
        </div>
        {total > 0 ? (
          <span className="inline-flex w-fit items-center rounded-full bg-[var(--dashboard-accent-soft)] px-3 py-1 text-xs font-semibold text-[var(--dashboard-accent-strong)]">
            {completedCount}/{total}
          </span>
        ) : null}
      </div>

      {loading ? <GoalsSkeleton /> : null}

      {!loading && error !== null ? (
        <div className="mt-5">
          <PanelError message={error} onRetry={onRetry} />
        </div>
      ) : null}

      {!loading && total === 0 && error === null ? (
        <div className="mt-6 rounded-2xl border border-dashed border-[var(--dashboard-border-strong)] bg-[var(--dashboard-surface-soft)] px-4 py-8 text-center">
          <p className="text-sm text-[var(--dashboard-muted)]">
            这一天还没有学习目标，使用上方表单创建第一个目标。
          </p>
        </div>
      ) : null}

      {!loading && total > 0 ? (
        <>
          <div className="mt-5 flex flex-col gap-2">
            <div className="flex items-center justify-between gap-3 text-xs text-[var(--dashboard-muted)]">
              <span aria-live="polite">
                {isComplete
                  ? '这一天的目标全部完成，做得不错。'
                  : `还剩 ${total - completedCount} 个目标`}
              </span>
              <span>{Math.round((completedCount / total) * 100)}%</span>
            </div>
            <progress
              role="progressbar"
              value={completedCount}
              max={total}
              aria-label="学习目标完成进度"
              aria-valuemin={0}
              aria-valuemax={total}
              aria-valuenow={completedCount}
              aria-valuetext={`${completedCount} / ${total}`}
              className="h-2 w-full appearance-none overflow-hidden rounded-full bg-[var(--dashboard-track)] accent-[var(--dashboard-accent)] [&::-moz-progress-bar]:bg-[var(--dashboard-accent)] [&::-webkit-progress-bar]:bg-[var(--dashboard-track)] [&::-webkit-progress-value]:bg-[var(--dashboard-accent)]"
            />
          </div>

          {isComplete ? (
            <p className="mt-4 rounded-xl bg-[var(--dashboard-success-soft)] px-3 py-2 text-sm font-medium text-[var(--dashboard-success)]">
              全部完成，这一天的学习目标已达成。
            </p>
          ) : null}

          <ul className="mt-4 flex flex-col gap-2">
            {goals.map((goal) => (
              <GoalItem
                key={goal.id}
                goal={goal}
                disabled={pendingGoalId !== null}
                onToggle={onToggle}
              />
            ))}
          </ul>
        </>
      ) : null}
    </section>
  )
}

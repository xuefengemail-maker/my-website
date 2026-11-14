import { useCallback, useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../../auth/useAuth.ts'
import { localDateIso } from '../../lib/date.ts'
import { listGoals, updateGoalStatus, type Goal } from '../../lib/goalsApi.ts'
import { isUnauthorizedError, requestErrorMessage } from '../../lib/requestError.ts'
import { GoalItem } from './GoalItem.tsx'
import { PanelError } from './PanelError.tsx'

type DailyGoalsPanelProps = {
  onGoalsChanged: () => void
}

function GoalsSkeleton() {
  return (
    <div aria-busy="true" aria-label="今日目标加载中" className="mt-5 flex flex-col gap-2">
      {Array.from({ length: 3 }, (_, index) => (
        <span
          key={index}
          className="h-14 animate-pulse rounded-xl bg-[var(--dashboard-surface-soft)] motion-reduce:animate-none"
        />
      ))}
    </div>
  )
}

export function DailyGoalsPanel({ onGoalsChanged }: DailyGoalsPanelProps) {
  const { authorizedFetch, signOut } = useAuth()
  const [today] = useState(localDateIso)
  const [goals, setGoals] = useState<Goal[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [pendingGoalId, setPendingGoalId] = useState<number | null>(null)
  const requestIdRef = useRef(0)
  const abortRef = useRef<AbortController | null>(null)

  const loadGoals = useCallback(async () => {
    const requestId = ++requestIdRef.current
    abortRef.current?.abort()
    const controller = new AbortController()
    abortRef.current = controller
    setIsLoading(true)
    setError(null)

    try {
      const data = await listGoals(authorizedFetch, today, controller.signal)
      if (requestId !== requestIdRef.current) {
        return
      }
      setGoals(data)
    } catch (loadError) {
      if (controller.signal.aborted) {
        return
      }
      if (isUnauthorizedError(loadError)) {
        signOut()
        return
      }
      setError(requestErrorMessage(loadError, { notFound: '今日目标不存在' }))
    } finally {
      if (requestId === requestIdRef.current) {
        setIsLoading(false)
      }
    }
  }, [authorizedFetch, signOut, today])

  useEffect(() => {
    const timeout = window.setTimeout(() => {
      void loadGoals()
    }, 0)
    return () => {
      window.clearTimeout(timeout)
      requestIdRef.current += 1
      abortRef.current?.abort()
    }
  }, [loadGoals])

  const toggleGoal = async (goalId: number) => {
    if (pendingGoalId !== null) {
      return
    }
    const target = goals.find((goal) => goal.id === goalId)
    if (target === undefined) {
      return
    }

    const nextStatus = target.status === 'completed' ? 'pending' : 'completed'
    const previousGoals = goals
    setPendingGoalId(goalId)
    setError(null)
    setGoals((current) =>
      current.map((goal) =>
        goal.id === goalId
          ? {
              ...goal,
              status: nextStatus,
              completed_at: nextStatus === 'completed' ? new Date().toISOString() : null,
            }
          : goal,
      ),
    )

    try {
      const updated = await updateGoalStatus(authorizedFetch, goalId, nextStatus)
      setGoals((current) =>
        current.map((goal) => (goal.id === updated.id ? updated : goal)),
      )
      onGoalsChanged()
    } catch (toggleError) {
      if (isUnauthorizedError(toggleError)) {
        signOut()
        return
      }
      setGoals(previousGoals)
      setError(
        requestErrorMessage(toggleError, {
          notFound: '目标不存在，可能已被删除',
          validation: '目标状态更新失败，请刷新后重试',
        }),
      )
    } finally {
      setPendingGoalId(null)
    }
  }

  const total = goals.length
  const completedCount = goals.filter((goal) => goal.status === 'completed').length
  const remainingCount = total - completedCount
  const isComplete = total > 0 && completedCount === total

  return (
    <section
      id="goals"
      aria-labelledby="goals-title"
      aria-busy={isLoading}
      className="rounded-3xl border border-[var(--dashboard-border)] bg-[var(--dashboard-surface)] p-5 shadow-[var(--dashboard-shadow)] sm:p-6"
    >
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--dashboard-accent-strong)]">
            Today
          </p>
          <h2 id="goals-title" className="mt-1 text-xl font-bold tracking-tight">
            每日目标
          </h2>
        </div>
        {total > 0 ? (
          <span className="inline-flex w-fit items-center rounded-full bg-[var(--dashboard-accent-soft)] px-3 py-1 text-xs font-semibold text-[var(--dashboard-accent-strong)]">
            {completedCount}/{total}
          </span>
        ) : null}
      </div>

      {isLoading ? <GoalsSkeleton /> : null}

      {!isLoading && error !== null ? (
        <div className="mt-5">
          <PanelError message={error} onRetry={loadGoals} />
        </div>
      ) : null}

      {!isLoading && error === null && total === 0 ? (
        <div className="mt-6 rounded-2xl border border-dashed border-[var(--dashboard-border-strong)] bg-[var(--dashboard-surface-soft)] px-4 py-6">
          <p className="text-sm text-[var(--dashboard-muted)]">
            今天还没有学习目标，先添加一个小目标开始今天的学习。
          </p>
          <Link
            to="/goals"
            className="mt-3 inline-flex min-h-11 items-center justify-center rounded-xl bg-[var(--dashboard-accent)] px-4 text-sm font-semibold text-[var(--dashboard-accent-contrast)] transition-colors hover:bg-[var(--dashboard-accent-strong)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--hero-focus-ring)] motion-reduce:transition-none"
          >
            前往学习目标页
          </Link>
        </div>
      ) : null}

      {!isLoading && total > 0 ? (
        <>
          <div className="mt-5 flex flex-col gap-2">
            <div className="flex items-center justify-between gap-3 text-xs text-[var(--dashboard-muted)]">
              <span aria-live="polite">
                {isComplete
                  ? '今日目标全部完成，做得不错。'
                  : `还剩 ${remainingCount} 个目标`}
              </span>
              <span>{Math.round((completedCount / total) * 100)}%</span>
            </div>
            <progress
              role="progressbar"
              value={completedCount}
              max={total}
              aria-label="每日目标完成进度"
              aria-valuemin={0}
              aria-valuemax={total}
              aria-valuenow={completedCount}
              aria-valuetext={`${completedCount} / ${total}`}
              className="h-2 w-full appearance-none overflow-hidden rounded-full bg-[var(--dashboard-track)] accent-[var(--dashboard-accent)] [&::-moz-progress-bar]:bg-[var(--dashboard-accent)] [&::-webkit-progress-bar]:bg-[var(--dashboard-track)] [&::-webkit-progress-value]:bg-[var(--dashboard-accent)]"
            />
          </div>

          {isComplete ? (
            <p className="mt-4 rounded-xl bg-[var(--dashboard-success-soft)] px-3 py-2 text-sm font-medium text-[var(--dashboard-success)]">
              全部完成，今天的学习目标已达成。
            </p>
          ) : null}

          <ul className="mt-4 flex flex-col gap-2">
            {goals.map((goal) => (
              <GoalItem
                key={goal.id}
                goal={goal}
                disabled={pendingGoalId !== null}
                onToggle={(id) => void toggleGoal(id)}
              />
            ))}
          </ul>
        </>
      ) : null}
    </section>
  )
}

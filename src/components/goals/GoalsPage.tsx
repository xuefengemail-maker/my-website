import { useCallback, useEffect, useRef, useState } from 'react'
import { useAuth } from '../../auth/useAuth.ts'
import { isLocalDateIso, localDateIso } from '../../lib/date.ts'
import { listGoals, updateGoalStatus, type Goal } from '../../lib/goalsApi.ts'
import { isUnauthorizedError, requestErrorMessage } from '../../lib/requestError.ts'
import { GoalComposer } from './GoalComposer.tsx'
import { GoalList } from './GoalList.tsx'

export function GoalsPage() {
  const { authorizedFetch, signOut } = useAuth()
  const [selectedDate, setSelectedDate] = useState(localDateIso)
  const [composerDate, setComposerDate] = useState(localDateIso)
  const [goals, setGoals] = useState<Goal[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [pendingGoalId, setPendingGoalId] = useState<number | null>(null)
  const selectedDateRef = useRef(selectedDate)
  const requestIdRef = useRef(0)
  const abortRef = useRef<AbortController | null>(null)

  useEffect(() => {
    selectedDateRef.current = selectedDate
  }, [selectedDate])

  const loadGoals = useCallback(
    async (date: string) => {
      const requestId = ++requestIdRef.current
      abortRef.current?.abort()
      const controller = new AbortController()
      abortRef.current = controller
      setIsLoading(true)
      setError(null)

      try {
        const data = await listGoals(authorizedFetch, date, controller.signal)
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
        setError(requestErrorMessage(loadError))
      } finally {
        if (requestId === requestIdRef.current) {
          setIsLoading(false)
        }
      }
    },
    [authorizedFetch, signOut],
  )

  useEffect(() => {
    const timeout = window.setTimeout(() => {
      void loadGoals(selectedDate)
    }, 0)
    return () => window.clearTimeout(timeout)
  }, [loadGoals, selectedDate])

  useEffect(
    () => () => {
      abortRef.current?.abort()
    },
    [],
  )

  const handleDateChange = (value: string) => {
    if (!isLocalDateIso(value)) {
      return
    }
    if (value !== selectedDate) {
      setIsLoading(true)
      setError(null)
      setSelectedDate(value)
    }
    setComposerDate(value)
  }

  const handleCreated = (goal: Goal) => {
    setError(null)
    if (goal.target_date === selectedDateRef.current) {
      setGoals((current) =>
        current.some((item) => item.id === goal.id) ? current : [...current, goal],
      )
      return
    }
    setIsLoading(true)
    setError(null)
    setSelectedDate(goal.target_date)
    setComposerDate(goal.target_date)
  }

  const toggleGoal = async (goalId: number) => {
    if (pendingGoalId !== null) {
      return
    }
    const target = goals.find((goal) => goal.id === goalId)
    if (target === undefined) {
      return
    }

    const dateAtRequest = selectedDateRef.current
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
      if (selectedDateRef.current !== dateAtRequest) {
        return
      }
      setGoals((current) =>
        current.map((goal) => (goal.id === updated.id ? updated : goal)),
      )
    } catch (toggleError) {
      if (isUnauthorizedError(toggleError)) {
        signOut()
        return
      }
      if (selectedDateRef.current !== dateAtRequest) {
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

  return (
    <main
      aria-labelledby="goals-title"
      className="mx-auto flex w-full max-w-5xl flex-col gap-6 px-4 py-6 sm:px-6 lg:px-8 lg:py-8"
    >
      <header className="rounded-3xl border border-[var(--dashboard-border)] bg-[var(--dashboard-surface)] p-6 shadow-[var(--dashboard-shadow)] sm:p-8">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--dashboard-accent-strong)]">
          StudyPal / 学习目标
        </p>
        <div className="mt-2 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h1
              id="goals-title"
              className="text-3xl font-bold tracking-tight text-[var(--dashboard-text)] sm:text-4xl"
            >
              学习目标
            </h1>
            <p className="mt-3 max-w-2xl text-pretty text-sm leading-relaxed text-[var(--dashboard-muted)] sm:text-base">
              按日期规划学习目标，完成后会同步到学习数据与成就进度。
            </p>
          </div>
          <label className="flex w-full flex-col gap-2 text-sm font-medium text-[var(--dashboard-text)] sm:w-48">
            查看日期
            <input
              type="date"
              required
              value={selectedDate}
              onChange={(event) => handleDateChange(event.target.value)}
              className="min-h-11 rounded-xl border border-[var(--dashboard-border)] bg-[var(--dashboard-surface-soft)] px-3 text-sm text-[var(--dashboard-text)] outline-none transition-colors focus:border-[var(--dashboard-accent)] focus:ring-2 focus:ring-[var(--dashboard-accent-soft)] motion-reduce:transition-none"
            />
          </label>
        </div>
      </header>

      <GoalComposer
        date={composerDate}
        onDateChange={setComposerDate}
        onCreated={handleCreated}
      />

      <GoalList
        date={selectedDate}
        goals={goals}
        loading={isLoading}
        error={error}
        pendingGoalId={pendingGoalId}
        onRetry={() => void loadGoals(selectedDate)}
        onToggle={(id) => void toggleGoal(id)}
      />
    </main>
  )
}

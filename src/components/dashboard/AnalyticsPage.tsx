import { useCallback, useEffect, useRef, useState } from 'react'
import { useAuth } from '../../auth/useAuth.ts'
import {
  getAchievements,
  getAnalyticsCalendar,
  getAnalyticsOverview,
  type AchievementItem,
  type CalendarResponse,
  type OverviewResponse,
  type TrendView,
} from '../../lib/analyticsApi.ts'
import { currentMonthIso } from '../../lib/date.ts'
import { isUnauthorizedError, requestErrorMessage } from '../../lib/requestError.ts'
import { AchievementWall } from './AchievementWall.tsx'
import { DailyGoalsPanel } from './DailyGoalsPanel.tsx'
import { DashboardHeader } from './DashboardHeader.tsx'
import { LearningCalendar } from './LearningCalendar.tsx'
import { RecordStudyForm } from './RecordStudyForm.tsx'
import { StatsGrid } from './StatsGrid.tsx'
import { TrendPanel } from './TrendPanel.tsx'

export function AnalyticsPage() {
  const { authorizedFetch, signOut } = useAuth()
  const [view, setView] = useState<TrendView>('week')
  const [calendarMonth, setCalendarMonth] = useState(currentMonthIso)
  const [overview, setOverview] = useState<OverviewResponse | null>(null)
  const [overviewLoading, setOverviewLoading] = useState(true)
  const [overviewError, setOverviewError] = useState<string | null>(null)
  const [calendar, setCalendar] = useState<CalendarResponse | null>(null)
  const [calendarLoading, setCalendarLoading] = useState(true)
  const [calendarError, setCalendarError] = useState<string | null>(null)
  const [achievements, setAchievements] = useState<AchievementItem[] | null>(null)
  const [achievementsLoading, setAchievementsLoading] = useState(true)
  const [achievementsError, setAchievementsError] = useState<string | null>(null)
  const overviewRequestRef = useRef(0)
  const calendarRequestRef = useRef(0)
  const achievementsRequestRef = useRef(0)
  const overviewAbortRef = useRef<AbortController | null>(null)
  const calendarAbortRef = useRef<AbortController | null>(null)
  const achievementsAbortRef = useRef<AbortController | null>(null)

  const loadOverview = useCallback(
    async (nextView: TrendView) => {
      const requestId = ++overviewRequestRef.current
      overviewAbortRef.current?.abort()
      const controller = new AbortController()
      overviewAbortRef.current = controller
      setOverviewLoading(true)
      setOverviewError(null)

      try {
        const data = await getAnalyticsOverview(
          authorizedFetch,
          nextView,
          controller.signal,
        )
        if (requestId !== overviewRequestRef.current) {
          return
        }
        setOverview(data)
      } catch (loadError) {
        if (controller.signal.aborted) {
          return
        }
        if (isUnauthorizedError(loadError)) {
          signOut()
          return
        }
        setOverviewError(requestErrorMessage(loadError))
      } finally {
        if (requestId === overviewRequestRef.current) {
          setOverviewLoading(false)
        }
      }
    },
    [authorizedFetch, signOut],
  )

  const loadCalendar = useCallback(
    async (month: string) => {
      const requestId = ++calendarRequestRef.current
      calendarAbortRef.current?.abort()
      const controller = new AbortController()
      calendarAbortRef.current = controller
      setCalendarLoading(true)
      setCalendarError(null)

      try {
        const data = await getAnalyticsCalendar(
          authorizedFetch,
          month,
          controller.signal,
        )
        if (requestId !== calendarRequestRef.current) {
          return
        }
        setCalendar(data)
      } catch (loadError) {
        if (controller.signal.aborted) {
          return
        }
        if (isUnauthorizedError(loadError)) {
          signOut()
          return
        }
        setCalendarError(requestErrorMessage(loadError))
      } finally {
        if (requestId === calendarRequestRef.current) {
          setCalendarLoading(false)
        }
      }
    },
    [authorizedFetch, signOut],
  )

  const loadAchievements = useCallback(async () => {
    const requestId = ++achievementsRequestRef.current
    achievementsAbortRef.current?.abort()
    const controller = new AbortController()
    achievementsAbortRef.current = controller
    setAchievementsLoading(true)
    setAchievementsError(null)

    try {
      const data = await getAchievements(authorizedFetch, controller.signal)
      if (requestId !== achievementsRequestRef.current) {
        return
      }
      setAchievements(data)
    } catch (loadError) {
      if (controller.signal.aborted) {
        return
      }
      if (isUnauthorizedError(loadError)) {
        signOut()
        return
      }
      setAchievementsError(requestErrorMessage(loadError))
    } finally {
      if (requestId === achievementsRequestRef.current) {
        setAchievementsLoading(false)
      }
    }
  }, [authorizedFetch, signOut])

  useEffect(() => {
    const timeout = window.setTimeout(() => {
      void loadOverview(view)
    }, 0)
    return () => window.clearTimeout(timeout)
  }, [loadOverview, view])

  useEffect(() => {
    const timeout = window.setTimeout(() => {
      void loadCalendar(calendarMonth)
    }, 0)
    return () => window.clearTimeout(timeout)
  }, [calendarMonth, loadCalendar])

  useEffect(() => {
    const timeout = window.setTimeout(() => {
      void loadAchievements()
    }, 0)
    return () => window.clearTimeout(timeout)
  }, [loadAchievements])

  useEffect(
    () => () => {
      overviewAbortRef.current?.abort()
      calendarAbortRef.current?.abort()
      achievementsAbortRef.current?.abort()
    },
    [],
  )

  const handleStudyCreated = useCallback(
    (studiedOn: string) => {
      void loadOverview(view)
      void loadAchievements()
      const studiedMonth = studiedOn.slice(0, 7)
      if (studiedMonth === calendarMonth) {
        void loadCalendar(studiedMonth)
      } else {
        setCalendarMonth(studiedMonth)
      }
    },
    [calendarMonth, loadAchievements, loadCalendar, loadOverview, view],
  )

  const handleGoalsChanged = useCallback(() => {
    void loadOverview(view)
    void loadCalendar(calendarMonth)
    void loadAchievements()
  }, [calendarMonth, loadAchievements, loadCalendar, loadOverview, view])

  const handleViewChange = (nextView: TrendView) => {
    if (nextView === view) {
      return
    }
    setOverviewLoading(true)
    setOverviewError(null)
    setView(nextView)
  }

  const trendPoints =
    overview !== null && overview.trend.view === view ? overview.trend.points : null

  return (
    <main
      aria-labelledby="dashboard-title"
      className="mx-auto flex w-full max-w-7xl flex-col gap-6 px-4 py-6 sm:px-6 lg:px-8 lg:py-8"
    >
      <DashboardHeader
        streakDays={overview?.streak_days ?? null}
        level={overview?.level ?? null}
      />
      <RecordStudyForm onCreated={handleStudyCreated} />
      <StatsGrid
        stats={overview?.stats ?? []}
        loading={overviewLoading}
        error={overviewError}
        onRetry={() => void loadOverview(view)}
      />
      <LearningCalendar
        month={calendarMonth}
        data={calendar}
        loading={calendarLoading}
        error={calendarError}
        onMonthChange={setCalendarMonth}
        onRetry={() => void loadCalendar(calendarMonth)}
      />
      <AchievementWall
        achievements={achievements}
        loading={achievementsLoading}
        error={achievementsError}
        onRetry={() => void loadAchievements()}
      />
      <DailyGoalsPanel onGoalsChanged={handleGoalsChanged} />
      <TrendPanel
        view={view}
        onViewChange={handleViewChange}
        points={trendPoints}
        loading={overviewLoading}
        error={overviewError}
        onRetry={() => void loadOverview(view)}
      />
    </main>
  )
}

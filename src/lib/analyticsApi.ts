import type { AuthorizedFetch } from './apiClient.ts'
import { apiErrorFromResponse } from './apiClient.ts'

export type TrendView = 'week' | 'month'

export type TrendPoint = {
  label: string
  value: number
}

export type AnalyticsStat = {
  id: string
  label: string
  value: number
  unit: string
  description: string
}

export type GoalSummary = {
  completed: number
  total: number
  progress: number
}

export type OverviewResponse = {
  stats: AnalyticsStat[]
  trend: {
    view: TrendView
    points: TrendPoint[]
  }
  streak_days: number
  level: number
  goal_summary: GoalSummary
}

export type CalendarDay = {
  date: string
  minutes: number
  sessions: number
  completed_goals: number
  is_today: boolean
  is_future: boolean
}

export type CalendarResponse = {
  month: string
  timezone: string
  days: CalendarDay[]
}

export type AchievementItem = {
  code: string
  title: string
  description: string
  target: number
  progress: number
  unlocked: boolean
  unlocked_at: string | null
}

export type StudySessionInput = {
  subject: string
  duration_minutes: number
  studied_on: string
}

export type StudySession = {
  id: number
  subject: string
  duration_minutes: number
  studied_on: string
  created_at: string
  updated_at: string
}

export type StudySessionCreateResponse = {
  session: StudySession
  daily: CalendarDay
}

type AchievementListResponse = {
  items: AchievementItem[]
}

async function readJson<T>(response: Response): Promise<T> {
  if (!response.ok) {
    throw await apiErrorFromResponse(response)
  }
  return (await response.json()) as T
}

export async function getAnalyticsOverview(
  authorizedFetch: AuthorizedFetch,
  view: TrendView,
  signal?: AbortSignal,
): Promise<OverviewResponse> {
  const response = await authorizedFetch(
    `/analytics/overview?range=${view}`,
    signal === undefined ? undefined : { signal },
  )
  return readJson<OverviewResponse>(response)
}

export async function getAnalyticsCalendar(
  authorizedFetch: AuthorizedFetch,
  month: string,
  signal?: AbortSignal,
): Promise<CalendarResponse> {
  const response = await authorizedFetch(
    `/analytics/calendar?month=${encodeURIComponent(month)}`,
    signal === undefined ? undefined : { signal },
  )
  return readJson<CalendarResponse>(response)
}

export async function getAchievements(
  authorizedFetch: AuthorizedFetch,
  signal?: AbortSignal,
): Promise<AchievementItem[]> {
  const response = await authorizedFetch(
    '/analytics/achievements',
    signal === undefined ? undefined : { signal },
  )
  const payload = await readJson<AchievementListResponse>(response)
  return payload.items
}

export async function createStudySession(
  authorizedFetch: AuthorizedFetch,
  input: StudySessionInput,
): Promise<StudySessionCreateResponse> {
  const response = await authorizedFetch('/study-sessions', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
  })
  return readJson<StudySessionCreateResponse>(response)
}

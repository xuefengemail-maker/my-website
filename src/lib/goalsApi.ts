import type { AuthorizedFetch } from './apiClient.ts'
import { apiErrorFromResponse } from './apiClient.ts'

export type GoalStatus = 'pending' | 'completed'

export type Goal = {
  id: number
  title: string
  category: string
  target_date: string
  status: GoalStatus
  completed_at: string | null
  created_at: string
  updated_at: string
}

type GoalListResponse = {
  items: Goal[]
}

export type CreateGoalInput = {
  title: string
  category: string
  target_date: string
}

export async function listGoals(
  authorizedFetch: AuthorizedFetch,
  date: string,
  signal?: AbortSignal,
): Promise<Goal[]> {
  const response = await authorizedFetch(
    `/goals?date=${encodeURIComponent(date)}`,
    signal === undefined ? undefined : { signal },
  )
  if (!response.ok) {
    throw await apiErrorFromResponse(response)
  }
  const payload = (await response.json()) as GoalListResponse
  return payload.items
}

export async function updateGoalStatus(
  authorizedFetch: AuthorizedFetch,
  goalId: number,
  status: GoalStatus,
): Promise<Goal> {
  const response = await authorizedFetch(`/goals/${goalId}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ status }),
  })
  if (!response.ok) {
    throw await apiErrorFromResponse(response)
  }
  return (await response.json()) as Goal
}

export async function createGoal(
  authorizedFetch: AuthorizedFetch,
  input: CreateGoalInput,
): Promise<Goal> {
  const response = await authorizedFetch('/goals', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
  })
  if (!response.ok) {
    throw await apiErrorFromResponse(response)
  }
  return (await response.json()) as Goal
}

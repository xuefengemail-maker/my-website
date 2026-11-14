export const API_BASE_URL = (
  import.meta.env.VITE_STUDYPAL_API_BASE_URL ?? 'http://localhost:8000/api/v1'
).replace(/\/$/, '')

export type AuthorizedFetch = (
  path: string,
  init?: RequestInit,
) => Promise<Response>

export class ApiError extends Error {
  readonly status: number

  constructor(status: number, message: string) {
    super(message)
    this.name = 'ApiError'
    this.status = status
  }
}

export async function apiFetch(path: string, init?: RequestInit): Promise<Response> {
  return fetch(`${API_BASE_URL}${path}`, init)
}

function errorMessage(payload: unknown): string {
  if (
    typeof payload === 'object' &&
    payload !== null &&
    'detail' in payload
  ) {
    const detail = (payload as { detail: unknown }).detail

    if (typeof detail === 'string') {
      return detail
    }

    if (Array.isArray(detail)) {
      return '请求内容格式不正确'
    }
  }

  return '请求失败，请稍后重试'
}

export async function apiJson<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await apiFetch(path, init)
  const payload = (await response.json().catch(() => null)) as unknown

  if (!response.ok) {
    throw new ApiError(response.status, errorMessage(payload))
  }

  return payload as T
}

export async function apiErrorFromResponse(response: Response): Promise<ApiError> {
  const payload = (await response.json().catch(() => null)) as unknown
  return new ApiError(response.status, errorMessage(payload))
}

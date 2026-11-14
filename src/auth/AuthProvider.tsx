import { useCallback, useMemo, useRef, useState } from 'react'
import type { ReactNode } from 'react'
import {
  ApiError,
  apiFetch,
  apiJson,
  type AuthorizedFetch,
} from '../lib/apiClient.ts'
import { AuthContext } from './useAuth.ts'
import type { AuthTokens } from './useAuth.ts'

const STORAGE_KEY = 'studypal.auth.tokens'

type LoginResponse = {
  access_token: string
  refresh_token: string
  expires_in: number
  refresh_expires_in: number
}

type RefreshResponse = {
  access_token: string
  expires_in: number
}

function isAuthTokens(value: unknown): value is AuthTokens {
  if (typeof value !== 'object' || value === null) {
    return false
  }

  const tokens = value as Partial<AuthTokens>

  return (
    typeof tokens.accessToken === 'string' &&
    typeof tokens.refreshToken === 'string' &&
    typeof tokens.accessExpiresAt === 'number' &&
    typeof tokens.refreshExpiresAt === 'number'
  )
}

function readStoredTokens(): AuthTokens | null {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    if (raw === null) {
      return null
    }

    const parsed: unknown = JSON.parse(raw)
    return isAuthTokens(parsed) ? parsed : null
  } catch {
    return null
  }
}

function withAuthorization(init: RequestInit | undefined, token: string): RequestInit {
  const headers = new Headers(init?.headers)
  headers.set('Authorization', `Bearer ${token}`)
  return { ...init, headers }
}

type AuthProviderProps = {
  children: ReactNode
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [tokens, setTokensState] = useState<AuthTokens | null>(() => readStoredTokens())
  const tokensRef = useRef<AuthTokens | null>(tokens)
  const refreshPromiseRef = useRef<Promise<string | null> | null>(null)

  const setTokens = useCallback((nextTokens: AuthTokens | null) => {
    tokensRef.current = nextTokens
    setTokensState(nextTokens)

    try {
      if (nextTokens === null) {
        window.localStorage.removeItem(STORAGE_KEY)
      } else {
        window.localStorage.setItem(STORAGE_KEY, JSON.stringify(nextTokens))
      }
    } catch {
      // The in-memory session remains usable when storage is unavailable.
    }
  }, [])

  const clearSession = useCallback(() => {
    setTokens(null)
  }, [setTokens])

  const saveLogin = useCallback(
    (payload: LoginResponse) => {
      const now = Date.now()
      setTokens({
        accessToken: payload.access_token,
        refreshToken: payload.refresh_token,
        accessExpiresAt: now + payload.expires_in * 1000,
        refreshExpiresAt: now + payload.refresh_expires_in * 1000,
      })
    },
    [setTokens],
  )

  const login = useCallback(
    async (email: string, password: string) => {
      const payload = await apiJson<LoginResponse>('/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      })
      saveLogin(payload)
    },
    [saveLogin],
  )

  const register = useCallback(
    async (email: string, password: string) => {
      await apiJson('/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      })
      await login(email, password)
    },
    [login],
  )

  const refreshAccessToken = useCallback(async (): Promise<string | null> => {
    if (refreshPromiseRef.current !== null) {
      return refreshPromiseRef.current
    }

    const current = tokensRef.current
    if (current === null) {
      return null
    }

    const refreshPromise = (async () => {
      try {
        const payload = await apiJson<RefreshResponse>('/auth/refresh', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ refresh_token: current.refreshToken }),
        })
        const nextTokens: AuthTokens = {
          ...current,
          accessToken: payload.access_token,
          accessExpiresAt: Date.now() + payload.expires_in * 1000,
        }
        setTokens(nextTokens)
        return nextTokens.accessToken
      } catch {
        clearSession()
        return null
      } finally {
        refreshPromiseRef.current = null
      }
    })()

    refreshPromiseRef.current = refreshPromise
    return refreshPromise
  }, [clearSession, setTokens])

  const authorizedFetch: AuthorizedFetch = useCallback(
    async (path, init) => {
      const current = tokensRef.current
      if (current === null) {
        throw new ApiError(401, '请先登录')
      }

      const firstResponse = await apiFetch(path, withAuthorization(init, current.accessToken))
      if (firstResponse.status !== 401) {
        return firstResponse
      }

      const refreshedToken = await refreshAccessToken()
      if (refreshedToken === null) {
        throw new ApiError(401, '登录已过期，请重新登录')
      }

      return apiFetch(path, withAuthorization(init, refreshedToken))
    },
    [refreshAccessToken],
  )

  const signOut = useCallback(() => {
    clearSession()
  }, [clearSession])

  const value = useMemo(
    () => ({
      isAuthenticated: tokens !== null,
      login,
      register,
      signOut,
      authorizedFetch,
    }),
    [tokens, login, register, signOut, authorizedFetch],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

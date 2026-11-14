import { createContext, useContext } from 'react'
import type { AuthorizedFetch } from '../lib/apiClient.ts'

export type AuthTokens = {
  accessToken: string
  refreshToken: string
  accessExpiresAt: number
  refreshExpiresAt: number
}

export type AuthContextValue = {
  isAuthenticated: boolean
  login: (email: string, password: string) => Promise<void>
  register: (email: string, password: string) => Promise<void>
  signOut: () => void
  authorizedFetch: AuthorizedFetch
}

export const AuthContext = createContext<AuthContextValue | null>(null)

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext)

  if (context === null) {
    throw new Error('useAuth must be used inside AuthProvider')
  }

  return context
}

import { useCallback, useEffect, useMemo, useState } from 'react'
import type { ReactNode } from 'react'
import { ThemeContext } from './useTheme'
import type { Theme } from './useTheme'

const STORAGE_KEY = 'theme'

function getSystemTheme(): Theme {
  try {
    return window.matchMedia('(prefers-color-scheme: dark)').matches
      ? 'dark'
      : 'light'
  } catch {
    return 'light'
  }
}

function readStoredTheme(): Theme | null {
  try {
    const value = window.localStorage.getItem(STORAGE_KEY)

    return value === 'light' || value === 'dark' ? value : null
  } catch {
    return null
  }
}

function applyTheme(theme: Theme) {
  document.documentElement.classList.toggle('dark', theme === 'dark')
}

type ThemeProviderProps = {
  children: ReactNode
}

export function ThemeProvider({ children }: ThemeProviderProps) {
  const [theme, setTheme] = useState<Theme>(
    () => readStoredTheme() ?? getSystemTheme(),
  )
  const [hasStoredTheme, setHasStoredTheme] = useState(
    () => readStoredTheme() !== null,
  )

  useEffect(() => {
    applyTheme(theme)
  }, [theme])

  useEffect(() => {
    if (hasStoredTheme) {
      return
    }

    let media: MediaQueryList

    try {
      media = window.matchMedia('(prefers-color-scheme: dark)')
    } catch {
      return
    }

    const handleChange = (event: MediaQueryListEvent) => {
      setTheme(event.matches ? 'dark' : 'light')
    }

    media.addEventListener('change', handleChange)

    return () => media.removeEventListener('change', handleChange)
  }, [hasStoredTheme])

  const toggleTheme = useCallback(() => {
    const nextTheme: Theme = theme === 'dark' ? 'light' : 'dark'

    setTheme(nextTheme)
    setHasStoredTheme(true)

    try {
      window.localStorage.setItem(STORAGE_KEY, nextTheme)
    } catch {
      // The current session keeps the new theme when storage is unavailable.
    }
  }, [theme])

  const value = useMemo(
    () => ({ theme, toggleTheme }),
    [theme, toggleTheme],
  )

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
}

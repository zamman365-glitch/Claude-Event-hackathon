/**
 * ThemeContext — Manages application-wide Light / Dark theme state.
 *
 * Capabilities:
 * 1. Checks `localStorage.getItem('bvs-theme')` ('light' | 'dark').
 * 2. If unset, inspects `window.matchMedia('(prefers-color-scheme: dark)')`.
 * 3. Sets `data-theme="dark"` or `data-theme="light"` on document.documentElement.
 * 4. Listens to system theme changes when no explicit user override is saved.
 * 5. Provides `theme`, `setTheme`, and `toggleTheme` to all consumers.
 */

import {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  type ReactNode,
} from 'react'
import type { Theme } from '../types'

interface ThemeContextValue {
  theme: Theme
  setTheme: (t: Theme) => void
  toggleTheme: () => void
}

const ThemeContext = createContext<ThemeContextValue | null>(null)

const THEME_STORAGE_KEY = 'bvs-theme'

const getInitialTheme = (): Theme => {
  if (typeof window === 'undefined') return 'light'

  try {
    const saved = localStorage.getItem(THEME_STORAGE_KEY)
    if (saved === 'dark' || saved === 'light') {
      return saved
    }
  } catch {
    // localStorage may be disabled in private browsing or strict sandboxes
  }

  // Fallback to system OS preference
  if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
    return 'dark'
  }

  return 'light'
}

export const ThemeProvider = ({ children }: { children: ReactNode }) => {
  const [theme, setThemeState] = useState<Theme>(getInitialTheme)

  // Synchronize data-theme on <html> element
  useEffect(() => {
    const root = document.documentElement
    root.setAttribute('data-theme', theme)
    // Also toggle standard dark class for maximum compatibility
    if (theme === 'dark') {
      root.classList.add('dark')
    } else {
      root.classList.remove('dark')
    }
  }, [theme])

  // Explicit user setter persists to localStorage
  const setTheme = useCallback((newTheme: Theme) => {
    setThemeState(newTheme)
    try {
      localStorage.setItem(THEME_STORAGE_KEY, newTheme)
    } catch {
      // Ignore storage errors
    }
  }, [])

  const toggleTheme = useCallback(() => {
    setThemeState((prev) => {
      const next: Theme = prev === 'dark' ? 'light' : 'dark'
      try {
        localStorage.setItem(THEME_STORAGE_KEY, next)
      } catch {
        // Ignore storage errors
      }
      return next
    })
  }, [])

  // Listen to OS color scheme changes if user hasn't explicitly set localStorage
  useEffect(() => {
    if (!window.matchMedia) return

    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')
    const handleChange = (e: MediaQueryListEvent) => {
      try {
        const saved = localStorage.getItem(THEME_STORAGE_KEY)
        if (!saved) {
          setThemeState(e.matches ? 'dark' : 'light')
        }
      } catch {
        setThemeState(e.matches ? 'dark' : 'light')
      }
    }

    if (mediaQuery.addEventListener) {
      mediaQuery.addEventListener('change', handleChange)
      return () => mediaQuery.removeEventListener('change', handleChange)
    } else if (mediaQuery.addListener) {
      mediaQuery.addListener(handleChange)
      return () => mediaQuery.removeListener(handleChange)
    }
  }, [])

  return (
    <ThemeContext.Provider value={{ theme, setTheme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  )
}

// eslint-disable-next-line react-refresh/only-export-components
export const useTheme = () => {
  const ctx = useContext(ThemeContext)
  if (!ctx) {
    throw new Error('useTheme must be used inside <ThemeProvider>')
  }
  return ctx
}

export default ThemeContext

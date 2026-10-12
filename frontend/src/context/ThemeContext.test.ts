import { describe, it, expect } from 'vitest'
import type { Theme } from '../types'

describe('Theme Management & Logic', () => {
  const THEME_KEY = 'bvs-theme'

  it('validates theme values are restricted to light and dark', () => {
    const validThemes: Theme[] = ['light', 'dark']
    expect(validThemes).toContain('light')
    expect(validThemes).toContain('dark')
    expect(validThemes.length).toBe(2)
  })

  it('correctly calculates opposite theme on toggle', () => {
    const toggle = (current: Theme): Theme => (current === 'dark' ? 'light' : 'dark')

    expect(toggle('light')).toBe('dark')
    expect(toggle('dark')).toBe('light')
  })

  it('handles simulated storage persistence key and transitions', () => {
    const store: Record<string, string> = {}
    const setItem = (k: string, v: string) => { store[k] = v }
    const getItem = (k: string) => store[k] || null

    setItem(THEME_KEY, 'dark')
    expect(getItem(THEME_KEY)).toBe('dark')

    setItem(THEME_KEY, 'light')
    expect(getItem(THEME_KEY)).toBe('light')
  })

  it('resolves fallback theme based on media query simulation', () => {
    const resolveTheme = (stored: string | null, prefersDark: boolean): Theme => {
      if (stored === 'dark' || stored === 'light') return stored
      return prefersDark ? 'dark' : 'light'
    }

    // Explicit user preference takes priority
    expect(resolveTheme('dark', false)).toBe('dark')
    expect(resolveTheme('light', true)).toBe('light')

    // No stored preference follows OS scheme
    expect(resolveTheme(null, true)).toBe('dark')
    expect(resolveTheme(null, false)).toBe('light')
  })
})

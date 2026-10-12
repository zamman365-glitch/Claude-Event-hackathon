/**
 * Shared utility functions.
 * Pure functions only — no side effects, no imports from services.
 */

/** Format a number of hectares with localised label */
export const formatHectares = (ha: number, lang: 'en' | 'hi' = 'en') =>
  lang === 'hi' ? `${ha} हेक्टेयर` : `${ha} ha`

/** Capitalise the first letter of a string */
export const capitalise = (s: string) =>
  s.length === 0 ? '' : s[0].toUpperCase() + s.slice(1)

/** Truncate a string to maxLen characters, appending '…' */
export const truncate = (s: string, maxLen = 80) =>
  s.length <= maxLen ? s : s.slice(0, maxLen) + '…'

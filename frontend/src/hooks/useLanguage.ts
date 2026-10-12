/**
 * useLanguage hook — manages UI language (English / Hindi).
 * Replace with i18next integration in a later phase if needed.
 */

import { useState } from 'react'
import type { Language } from '../types'

export const useLanguage = () => {
  const [language, setLanguage] = useState<Language>('hi')

  const toggle = () => setLanguage((l) => (l === 'en' ? 'hi' : 'en'))

  return { language, setLanguage, toggle }
}

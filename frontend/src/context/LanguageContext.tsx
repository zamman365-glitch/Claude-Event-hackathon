/**
 * LanguageContext — provides lang + t() function to the entire tree.
 * Wrap <App> with <LanguageProvider> so all components can useLanguage().
 */

import { createContext, useContext, useState, type ReactNode } from 'react'
import { STRINGS, type Lang } from '../constants/strings'

interface LanguageContextValue {
  lang: Lang
  setLang: (l: Lang) => void
  toggle: () => void
  t: (key: keyof typeof STRINGS.en) => string
}

const LanguageContext = createContext<LanguageContextValue | null>(null)

export const LanguageProvider = ({ children }: { children: ReactNode }) => {
  const [lang, setLang] = useState<Lang>('hi') // Hindi default for MP users

  const toggle = () => setLang((l) => (l === 'en' ? 'hi' : 'en'))

  const t = (key: keyof typeof STRINGS.en): string =>
    (STRINGS[lang] as Record<string, string>)[key] ?? STRINGS.en[key]

  return (
    <LanguageContext.Provider value={{ lang, setLang, toggle, t }}>
      {children}
    </LanguageContext.Provider>
  )
}

// eslint-disable-next-line react-refresh/only-export-components
export const useLanguage = () => {
  const ctx = useContext(LanguageContext)
  if (!ctx) throw new Error('useLanguage must be used inside <LanguageProvider>')
  return ctx
}

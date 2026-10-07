import { createContext, useContext } from 'react'
import { en, type Messages } from './messages'

export type Language = 'en' | 'es'

export const STORAGE_KEY = 'language'

/** The last language used on this browser, or the browser's own language. */
export function detectLanguage(): Language {
  try {
    const saved = localStorage.getItem(STORAGE_KEY)
    if (saved === 'en' || saved === 'es') return saved
  } catch {
    // storage unavailable
  }
  return navigator.language.toLowerCase().startsWith('es') ? 'es' : 'en'
}

export const I18nContext = createContext<{ language: Language; t: Messages }>({
  language: 'en',
  t: en,
})

export const useI18n = () => useContext(I18nContext)

import { useEffect, type ReactNode } from 'react'
import { I18nContext, STORAGE_KEY, type Language } from './context'
import { en, es, type Messages } from './messages'

const messages: Record<Language, Messages> = { en, es }

export function I18nProvider({ language, children }: { language: Language; children: ReactNode }) {
  useEffect(() => {
    document.documentElement.lang = language
    try {
      localStorage.setItem(STORAGE_KEY, language)
    } catch {
      // storage unavailable
    }
  }, [language])

  return (
    <I18nContext.Provider value={{ language, t: messages[language] }}>
      {children}
    </I18nContext.Provider>
  )
}

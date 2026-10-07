import { useEffect } from 'react'

export type Theme = 'system' | 'light' | 'dark'

const STORAGE_KEY = 'theme'
const darkQuery = () => matchMedia('(prefers-color-scheme: dark)')

/** The last theme used on this browser (index.html applies it before React loads). */
export function savedTheme(): Theme {
  try {
    const saved = localStorage.getItem(STORAGE_KEY)
    if (saved === 'light' || saved === 'dark') return saved
  } catch {
    // storage unavailable
  }
  return 'system'
}

function apply(theme: Theme) {
  const dark = theme === 'dark' || (theme === 'system' && darkQuery().matches)
  document.documentElement.classList.toggle('dark', dark)
  document.documentElement.style.colorScheme = dark ? 'dark' : 'light'
}

/** Applies the theme to <html> and follows OS changes while it is "system". */
export function useApplyTheme(theme: Theme) {
  useEffect(() => {
    apply(theme)
    try {
      localStorage.setItem(STORAGE_KEY, theme)
    } catch {
      // storage unavailable
    }
    if (theme !== 'system') return
    const query = darkQuery()
    const onChange = () => apply('system')
    query.addEventListener('change', onChange)
    return () => query.removeEventListener('change', onChange)
  }, [theme])
}

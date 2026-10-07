import { useEffect, useRef } from 'react'
import { useI18n } from '../i18n'
import { useLogin } from '../queries'
import { Logo } from './Logo'

export function LoginPage() {
  const { language, t } = useI18n()
  const buttonRef = useRef<HTMLDivElement>(null)
  const login = useLogin()
  const { mutate } = login

  useEffect(() => {
    // The Google script loads async; wait until it's available.
    const timer = setInterval(() => {
      const google = window.google
      if (!google || !buttonRef.current) return
      clearInterval(timer)
      google.accounts.id.initialize({
        client_id: import.meta.env.VITE_GOOGLE_CLIENT_ID,
        callback: ({ credential }) => mutate(credential),
      })
      const dark = document.documentElement.classList.contains('dark')
      buttonRef.current.replaceChildren()
      google.accounts.id.renderButton(buttonRef.current, {
        theme: dark ? 'filled_black' : 'outline',
        size: 'large',
        shape: 'pill',
        text: 'continue_with',
        locale: language,
      })
    }, 100)
    return () => clearInterval(timer)
  }, [mutate, language])

  return (
    <div className="flex min-h-screen items-center justify-center px-4">
      <div className="w-full max-w-sm text-center motion-safe:animate-fade-in">
        <Logo className="mx-auto size-12" />
        <h1 className="mt-4 text-2xl font-bold tracking-tight">Where Was I</h1>
        <p className="mt-2 text-sm text-zinc-500">{t.tagline}</p>
        <div className="mt-8 flex h-11 justify-center" ref={buttonRef} />
        {login.error && (
          <p className="mt-4 text-sm text-red-600 dark:text-red-400">{login.error.message}</p>
        )}
      </div>
    </div>
  )
}

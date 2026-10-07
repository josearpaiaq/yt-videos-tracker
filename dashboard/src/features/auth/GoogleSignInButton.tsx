import { useEffect, useRef } from 'react'
import { useI18n } from '@/i18n'
import { useLogin } from '@/lib/queries'

/** Renders Google's "Continue with Google" button and signs in with the returned credential. */
export function GoogleSignInButton() {
  const { language } = useI18n()
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
    <>
      <div className="flex h-11 justify-center" ref={buttonRef} />
      {login.error && (
        <p className="mt-4 text-sm text-red-600 dark:text-red-400">{login.error.message}</p>
      )}
    </>
  )
}

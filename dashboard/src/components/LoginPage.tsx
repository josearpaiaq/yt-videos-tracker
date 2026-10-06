import { useEffect, useRef } from 'react'
import { useLogin } from '../queries'

export function LoginPage() {
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
      const dark = matchMedia('(prefers-color-scheme: dark)').matches
      google.accounts.id.renderButton(buttonRef.current, {
        theme: dark ? 'filled_black' : 'outline',
        size: 'large',
        shape: 'pill',
        text: 'continue_with',
      })
    }, 100)
    return () => clearInterval(timer)
  }, [mutate])

  return (
    <div className="flex min-h-screen items-center justify-center px-4">
      <div className="w-full max-w-sm text-center">
        <svg viewBox="0 0 32 32" className="mx-auto size-12" aria-hidden>
          <rect width="32" height="32" rx="8" fill="#dc2626" />
          <path d="M12 9.5v13l10-6.5z" fill="#fff" />
        </svg>
        <h1 className="mt-4 text-2xl font-bold tracking-tight">Where Was I</h1>
        <p className="mt-2 text-sm text-zinc-500">
          Keep track of the minute you're at in long YouTube videos.
        </p>
        <div className="mt-8 flex justify-center" ref={buttonRef} />
        {login.error && (
          <p className="mt-4 text-sm text-red-600 dark:text-red-400">{login.error.message}</p>
        )}
      </div>
    </div>
  )
}

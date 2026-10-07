import { Logo } from '@/components/ui/Logo'
import { GoogleSignInButton } from '@/features/auth/GoogleSignInButton'
import { useI18n } from '@/i18n'

export function LoginView() {
  const { t } = useI18n()
  return (
    <div className="flex min-h-screen items-center justify-center px-4">
      <div className="w-full max-w-sm text-center motion-safe:animate-fade-in">
        <Logo className="mx-auto size-12" />
        <h1 className="mt-4 text-2xl font-bold tracking-tight">Where Was I</h1>
        <p className="mt-2 text-sm text-zinc-500">{t.tagline}</p>
        <div className="mt-8">
          <GoogleSignInButton />
        </div>
      </div>
    </div>
  )
}

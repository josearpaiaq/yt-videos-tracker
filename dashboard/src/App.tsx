import { Toaster } from 'sonner'
import { ConfirmProvider } from '@/components/ui/ConfirmDialog'
import { detectLanguage, I18nProvider } from '@/i18n'
import { useMe } from '@/lib/queries'
import { savedTheme, useApplyTheme } from '@/lib/theme'
import { DashboardView } from '@/views/DashboardView'
import { LoginView } from '@/views/LoginView'
import { ServerErrorView } from '@/views/ServerErrorView'

/** App-wide providers, and which view to show depending on the session. */
export default function App() {
  const me = useMe()
  const theme = me.data?.theme ?? savedTheme()
  useApplyTheme(theme)

  return (
    <I18nProvider language={me.data?.language || detectLanguage()}>
      <ConfirmProvider>
        <Toaster theme={theme} position="bottom-right" richColors />
        {me.isPending ? null : me.error ? (
          <ServerErrorView message={me.error.message} />
        ) : me.data ? (
          <DashboardView user={me.data} />
        ) : (
          <LoginView />
        )}
      </ConfirmProvider>
    </I18nProvider>
  )
}

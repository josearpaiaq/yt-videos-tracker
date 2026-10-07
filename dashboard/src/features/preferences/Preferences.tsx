import { Monitor, Moon, Sun } from 'lucide-react'
import { Segmented } from '@/components/ui/Segmented'
import { useI18n } from '@/i18n'
import type { User } from '@/lib/api'
import { useUpdateMe } from '@/lib/queries'

/** Language and theme switches, saved to the user's account. */
export function Preferences({ user }: { user: User }) {
  const { language, t } = useI18n()
  const updateMe = useUpdateMe()

  return (
    <div className="space-y-3 px-3">
      <Segmented
        label={t.language}
        value={language}
        onChange={(language) => updateMe.mutate({ language })}
        options={[
          { value: 'es', label: 'ES' },
          { value: 'en', label: 'EN' },
        ]}
      />
      <Segmented
        label={t.theme}
        value={user.theme}
        onChange={(theme) => updateMe.mutate({ theme })}
        options={[
          { value: 'system', label: t.themeSystem, icon: Monitor },
          { value: 'light', label: t.themeLight, icon: Sun },
          { value: 'dark', label: t.themeDark, icon: Moon },
        ]}
      />
    </div>
  )
}

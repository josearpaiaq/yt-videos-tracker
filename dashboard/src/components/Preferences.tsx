import { Monitor, Moon, Sun, type LucideIcon } from 'lucide-react'
import type { User } from '../api'
import { useI18n } from '../i18n'
import { useUpdateMe } from '../queries'

type Option<T extends string> = { value: T; label: string; icon?: LucideIcon }

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

function Segmented<T extends string>({
  label,
  value,
  options,
  onChange,
}: {
  label: string
  value: T
  options: Option<T>[]
  onChange: (value: T) => void
}) {
  return (
    <div className="flex items-center justify-between gap-2">
      <span className="text-xs text-zinc-500">{label}</span>
      <div role="radiogroup" aria-label={label} className="flex rounded-lg bg-zinc-200/70 p-0.5 dark:bg-zinc-800">
        {options.map(({ value: v, label: optionLabel, icon: Icon }) => (
          <button
            key={v}
            type="button"
            role="radio"
            aria-checked={value === v}
            aria-label={optionLabel}
            title={optionLabel}
            onClick={() => onChange(v)}
            className={`rounded-md px-2 py-1 text-xs font-semibold ${
              value === v
                ? 'bg-white text-zinc-900 shadow-sm dark:bg-zinc-600 dark:text-zinc-50'
                : 'text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100'
            }`}
          >
            {Icon ? <Icon className="size-3.5" /> : optionLabel}
          </button>
        ))}
      </div>
    </div>
  )
}

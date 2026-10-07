import { useState } from 'react'
import { useI18n } from '@/i18n'
import { formatTime, parseTime } from '@/lib/time'

/** Editable "current minute" input: accepts h:mm:ss, m:ss or plain minutes. */
export function TimeField({
  seconds,
  duration,
  onSave,
}: {
  seconds: number
  duration: number
  onSave: (seconds: number) => void
}) {
  const { t } = useI18n()
  const [draft, setDraft] = useState(formatTime(seconds))
  const [invalid, setInvalid] = useState(false)
  const [synced, setSynced] = useState(seconds)

  // Reset the draft whenever the saved value changes.
  if (seconds !== synced) {
    setSynced(seconds)
    setDraft(formatTime(seconds))
    setInvalid(false)
  }

  function commit() {
    const parsed = parseTime(draft)
    if (parsed === null) {
      setInvalid(true)
      return
    }
    const clamped = duration > 0 ? Math.min(parsed, duration) : parsed
    setInvalid(false)
    setDraft(formatTime(clamped))
    if (clamped !== seconds) onSave(clamped)
  }

  return (
    <label className="flex items-center gap-2 text-sm">
      <span className="text-zinc-500">{t.at}</span>
      <input
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        onBlur={commit}
        onKeyDown={(e) => {
          if (e.key === 'Enter') e.currentTarget.blur()
          if (e.key === 'Escape') {
            setDraft(formatTime(seconds))
            setInvalid(false)
          }
        }}
        title={t.timeHint}
        aria-invalid={invalid}
        className={`w-24 rounded-md border px-2 py-1 text-center font-mono text-base font-medium tabular-nums outline-none focus:ring-2 dark:bg-zinc-950 ${
          invalid
            ? 'border-red-500 ring-2 ring-red-500/20'
            : 'border-zinc-300 focus:border-red-500 focus:ring-red-500/20 dark:border-zinc-700'
        }`}
      />
    </label>
  )
}

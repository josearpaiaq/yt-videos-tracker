import type { LucideIcon } from 'lucide-react'

export type SegmentedOption<T extends string> = { value: T; label: string; icon?: LucideIcon }

/** A small radio group rendered as a segmented control. Options with an icon show only the icon. */
export function Segmented<T extends string>({
  label,
  value,
  options,
  onChange,
}: {
  label: string
  value: T
  options: SegmentedOption<T>[]
  onChange: (value: T) => void
}) {
  return (
    <div className="flex items-center justify-between gap-2">
      <span className="text-xs text-zinc-500">{label}</span>
      <div
        role="radiogroup"
        aria-label={label}
        className="flex rounded-lg bg-zinc-200/70 p-0.5 dark:bg-zinc-800"
      >
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

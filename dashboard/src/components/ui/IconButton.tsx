import type { LucideIcon } from 'lucide-react'

export function IconButton({
  label,
  icon: Icon,
  onClick,
}: {
  label: string
  icon: LucideIcon
  onClick: () => void
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      title={label}
      className="rounded-md p-1.5 text-zinc-500 hover:bg-zinc-200 hover:text-zinc-900 dark:hover:bg-zinc-700 dark:hover:text-zinc-100"
    >
      <Icon className="size-4" />
    </button>
  )
}

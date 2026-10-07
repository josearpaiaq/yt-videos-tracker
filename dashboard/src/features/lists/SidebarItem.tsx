import type { LucideIcon } from 'lucide-react'

export function SidebarItem({
  icon: Icon,
  label,
  count,
  active,
  onClick,
}: {
  icon: LucideIcon
  label: string
  count: number
  active: boolean
  onClick: () => void
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-current={active ? 'page' : undefined}
      className={`flex w-full items-center gap-2.5 rounded-lg px-3 py-1.5 text-left text-sm ${
        active
          ? 'bg-zinc-200 font-semibold dark:bg-zinc-800'
          : 'text-zinc-600 hover:bg-zinc-100 dark:text-zinc-400 dark:hover:bg-zinc-900'
      }`}
    >
      <Icon className="size-4 shrink-0 text-zinc-500" />
      <span className="flex-1 truncate">{label}</span>
      <span className="ml-2 font-mono text-xs text-zinc-500 tabular-nums">{count}</span>
    </button>
  )
}

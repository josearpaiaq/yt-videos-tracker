import type { ReactNode } from 'react'

export function IconButton({
  label,
  onClick,
  children,
}: {
  label: string
  onClick: () => void
  children: ReactNode
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      title={label}
      className="rounded p-1 text-zinc-500 hover:bg-zinc-200 hover:text-zinc-900 dark:hover:bg-zinc-700 dark:hover:text-zinc-100"
    >
      <svg
        viewBox="0 0 24 24"
        className="size-3.5"
        fill="none"
        stroke="currentColor"
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        {children}
      </svg>
    </button>
  )
}

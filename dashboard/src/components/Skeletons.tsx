export function VideoCardSkeleton() {
  return (
    <div className="flex animate-pulse flex-col gap-4 rounded-xl border border-zinc-200 bg-white p-3 sm:flex-row dark:border-zinc-800 dark:bg-zinc-900">
      <div className="aspect-video rounded-lg bg-zinc-200 sm:w-56 dark:bg-zinc-800" />
      <div className="flex flex-1 flex-col gap-3 py-1">
        <div className="h-4 w-3/4 rounded bg-zinc-200 dark:bg-zinc-800" />
        <div className="h-3 w-1/3 rounded bg-zinc-200 dark:bg-zinc-800" />
        <div className="mt-2 h-8 w-48 rounded bg-zinc-200 dark:bg-zinc-800" />
        <div className="h-6 w-40 rounded bg-zinc-200 dark:bg-zinc-800" />
      </div>
    </div>
  )
}

export function SidebarSkeleton() {
  return (
    <div className="animate-pulse space-y-2 px-3 py-1">
      {[70, 55, 80].map((width) => (
        <div key={width} className="h-4 rounded bg-zinc-200 dark:bg-zinc-800" style={{ width: `${width}%` }} />
      ))}
    </div>
  )
}

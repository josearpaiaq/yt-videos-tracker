import { Skeleton } from '@/components/ui/Skeleton'

export function VideoCardSkeleton() {
  return (
    <div className="flex flex-col gap-4 rounded-xl border border-zinc-200 bg-white p-3 sm:flex-row dark:border-zinc-800 dark:bg-zinc-900">
      <Skeleton className="aspect-video rounded-lg sm:w-56" />
      <div className="flex flex-1 flex-col gap-3 py-1">
        <Skeleton className="h-4 w-3/4" />
        <Skeleton className="h-3 w-1/3" />
        <Skeleton className="mt-2 h-8 w-48" />
        <Skeleton className="h-6 w-40" />
      </div>
    </div>
  )
}

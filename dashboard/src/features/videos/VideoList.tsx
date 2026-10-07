import { useI18n } from '@/i18n'
import type { List, Video } from '@/lib/api'
import type { StatusFilter } from './filters'
import { VideoCard } from './VideoCard'
import { VideoCardSkeleton } from './VideoCardSkeleton'

interface Props {
  videos: Video[]
  lists: List[]
  isPending: boolean
  error: Error | null
  query: string
  status: StatusFilter
}

/** The video cards, or the loading, error or empty state that replaces them. */
export function VideoList({ videos, lists, isPending, error, query, status }: Props) {
  const { t } = useI18n()

  if (isPending) {
    return (
      <div className="space-y-3">
        <VideoCardSkeleton />
        <VideoCardSkeleton />
        <VideoCardSkeleton />
      </div>
    )
  }
  if (error) {
    return (
      <p className="text-sm text-red-600">
        {t.couldNotLoadVideos}: {error.message}
      </p>
    )
  }
  if (videos.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-zinc-300 px-6 py-12 text-center dark:border-zinc-700">
        {query.trim() ? (
          <p className="text-sm text-zinc-500">{t.noResults(query.trim())}</p>
        ) : (
          <>
            <p className="font-medium">{t.emptyTitle}</p>
            <p className="mt-1 text-sm text-zinc-500">
              {status === 'done' ? t.emptyDone : t.emptyActive}
            </p>
          </>
        )}
      </div>
    )
  }
  return (
    <div className="space-y-3">
      {videos.map((video) => (
        <VideoCard key={video.id} video={video} lists={lists} />
      ))}
    </div>
  )
}

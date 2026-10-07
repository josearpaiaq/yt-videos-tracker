import type { ListFilter } from '@/features/lists/types'
import type { Video } from '@/lib/api'

export type StatusFilter = 'active' | 'done' | 'all'
export type Sort = 'recent' | 'progress' | 'remaining' | 'title'

export const statusMatchers: Record<StatusFilter, (v: Video) => boolean> = {
  active: (v) => v.status !== 'done',
  done: (v) => v.status === 'done',
  all: () => true,
}

const progressOf = (v: Video) =>
  v.duration_seconds > 0 ? v.position_seconds / v.duration_seconds : 0

// Videos without a known duration go last when sorting by time left.
const remainingOf = (v: Video) =>
  v.duration_seconds > 0 ? v.duration_seconds - v.position_seconds : Number.POSITIVE_INFINITY

export const sorters: Record<Sort, (a: Video, b: Video) => number> = {
  recent: (a, b) => b.updated_at.localeCompare(a.updated_at),
  progress: (a, b) => progressOf(b) - progressOf(a),
  remaining: (a, b) => remainingOf(a) - remainingOf(b),
  title: (a, b) => a.title.localeCompare(b.title),
}

/** Lowercases and strips accents so "canción" matches "cancion". */
export const normalize = (s: string) =>
  s.normalize('NFD').replace(/\p{Diacritic}/gu, '').toLowerCase()

/** Videos in the selected list whose title or channel matches the query. */
export function matchVideos(videos: Video[], list: ListFilter, query: string): Video[] {
  const needle = normalize(query.trim())
  return videos.filter(
    (v) =>
      (list === 'all' || (list === 'none' ? v.list_id === null : v.list_id === list)) &&
      (!needle || normalize(`${v.title} ${v.channel}`).includes(needle)),
  )
}

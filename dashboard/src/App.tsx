import { useState } from 'react'
import type { User, Video } from './api'
import { AddVideoForm } from './components/AddVideoForm'
import { LoginPage } from './components/LoginPage'
import { ListsSidebar, type ListFilter } from './components/ListsSidebar'
import { VideoCard } from './components/VideoCard'
import { useLists, useLogout, useMe, useVideos } from './queries'

type StatusFilter = 'active' | 'done' | 'all'

const statusTabs: { value: StatusFilter; label: string; match: (v: Video) => boolean }[] = [
  { value: 'active', label: 'To watch', match: (v) => v.status !== 'done' },
  { value: 'done', label: 'Done', match: (v) => v.status === 'done' },
  { value: 'all', label: 'All', match: () => true },
]

export default function App() {
  const me = useMe()

  if (me.isPending) return null
  if (me.error) {
    return <p className="p-8 text-sm text-red-600">Could not reach the server: {me.error.message}</p>
  }
  if (!me.data) return <LoginPage />
  return <Dashboard user={me.data} />
}

function Dashboard({ user }: { user: User }) {
  const [listFilter, setListFilter] = useState<ListFilter>('all')
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('active')
  const lists = useLists()
  const videos = useVideos()
  const logout = useLogout()

  const allLists = lists.data ?? []
  const inList = (videos.data ?? []).filter((v) =>
    listFilter === 'all' ? true : listFilter === 'none' ? v.list_id === null : v.list_id === listFilter,
  )
  const tab = statusTabs.find((t) => t.value === statusFilter)!
  const visible = inList.filter(tab.match)

  const title =
    listFilter === 'all'
      ? 'All videos'
      : listFilter === 'none'
        ? 'Unlisted'
        : (allLists.find((l) => l.id === listFilter)?.name ?? '')

  return (
    <div className="mx-auto max-w-6xl px-4 py-6 lg:grid lg:grid-cols-[220px_1fr] lg:gap-8 lg:py-10">
      <aside className="mb-6 lg:mb-0">
        <div className="mb-6 flex items-center gap-2 px-3">
          <svg viewBox="0 0 32 32" className="size-7" aria-hidden>
            <rect width="32" height="32" rx="8" fill="#dc2626" />
            <path d="M12 9.5v13l10-6.5z" fill="#fff" />
          </svg>
          <span className="text-lg font-bold tracking-tight">Where Was I</span>
        </div>
        <ListsSidebar
          lists={allLists}
          videos={videos.data ?? []}
          selected={listFilter}
          onSelect={setListFilter}
        />
        <div className="mt-8 flex items-center gap-2 border-t border-zinc-200 px-3 pt-4 dark:border-zinc-800">
          {user.avatar_url && (
            <img src={user.avatar_url} alt="" className="size-7 rounded-full" referrerPolicy="no-referrer" />
          )}
          <span className="min-w-0 flex-1 truncate text-sm text-zinc-600 dark:text-zinc-400">
            {user.name || user.email}
          </span>
          <button
            type="button"
            onClick={() => logout.mutate()}
            className="text-xs text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100"
          >
            Sign out
          </button>
        </div>
      </aside>

      <main className="min-w-0 space-y-6">
        <header className="space-y-4">
          <h1 className="text-2xl font-bold tracking-tight">{title}</h1>
          <AddVideoForm listId={typeof listFilter === 'number' ? listFilter : null} />
        </header>

        <div className="flex gap-1 border-b border-zinc-200 dark:border-zinc-800" role="tablist">
          {statusTabs.map((t) => (
            <button
              key={t.value}
              type="button"
              role="tab"
              aria-selected={statusFilter === t.value}
              onClick={() => setStatusFilter(t.value)}
              className={`-mb-px border-b-2 px-3 py-2 text-sm font-medium ${
                statusFilter === t.value
                  ? 'border-red-600 text-zinc-900 dark:text-zinc-100'
                  : 'border-transparent text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100'
              }`}
            >
              {t.label}
              <span className="ml-1.5 font-mono text-xs text-zinc-400 tabular-nums">
                {inList.filter(t.match).length}
              </span>
            </button>
          ))}
        </div>

        {videos.isPending ? (
          <p className="text-sm text-zinc-500">Loading…</p>
        ) : videos.error ? (
          <p className="text-sm text-red-600">Could not load videos: {videos.error.message}</p>
        ) : visible.length === 0 ? (
          <div className="rounded-xl border border-dashed border-zinc-300 px-6 py-12 text-center dark:border-zinc-700">
            <p className="font-medium">Nothing here yet</p>
            <p className="mt-1 text-sm text-zinc-500">
              {statusFilter === 'done'
                ? 'Videos you mark as done will show up here.'
                : 'Paste a YouTube link above to start tracking where you left off.'}
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {visible.map((video) => (
              <VideoCard key={video.id} video={video} lists={allLists} />
            ))}
          </div>
        )}
      </main>
    </div>
  )
}

import { ArrowUpDown, LogOut, Menu, Search, X } from 'lucide-react'
import { useEffect, useState, type ReactNode } from 'react'
import { Toaster } from 'sonner'
import type { List, User, Video } from './api'
import { AddVideoForm } from './components/AddVideoForm'
import { ConfirmProvider } from './components/ConfirmDialog'
import { ListsSidebar, type ListFilter } from './components/ListsSidebar'
import { LoginPage } from './components/LoginPage'
import { Logo } from './components/Logo'
import { Preferences } from './components/Preferences'
import { VideoCardSkeleton } from './components/Skeletons'
import { VideoCard } from './components/VideoCard'
import { detectLanguage, I18nProvider, useI18n } from './i18n'
import { useLists, useLogout, useMe, useVideos } from './queries'
import { savedTheme, useApplyTheme } from './theme'

type StatusFilter = 'active' | 'done' | 'all'
type Sort = 'recent' | 'progress' | 'remaining' | 'title'

const statusMatchers: Record<StatusFilter, (v: Video) => boolean> = {
  active: (v) => v.status !== 'done',
  done: (v) => v.status === 'done',
  all: () => true,
}

const progressOf = (v: Video) => (v.duration_seconds > 0 ? v.position_seconds / v.duration_seconds : 0)
const remainingOf = (v: Video) =>
  v.duration_seconds > 0 ? v.duration_seconds - v.position_seconds : Number.POSITIVE_INFINITY

const sorters: Record<Sort, (a: Video, b: Video) => number> = {
  recent: (a, b) => b.updated_at.localeCompare(a.updated_at),
  progress: (a, b) => progressOf(b) - progressOf(a),
  remaining: (a, b) => remainingOf(a) - remainingOf(b),
  title: (a, b) => a.title.localeCompare(b.title),
}

const normalize = (s: string) =>
  s.normalize('NFD').replace(/\p{Diacritic}/gu, '').toLowerCase()

export default function App() {
  const me = useMe()
  const theme = me.data?.theme ?? savedTheme()
  useApplyTheme(theme)

  return (
    <I18nProvider language={me.data?.language || detectLanguage()}>
      <ConfirmProvider>
        <Toaster theme={theme} position="bottom-right" richColors />
        {me.isPending ? null : me.error ? (
          <ServerError message={me.error.message} />
        ) : me.data ? (
          <Dashboard user={me.data} />
        ) : (
          <LoginPage />
        )}
      </ConfirmProvider>
    </I18nProvider>
  )
}

function ServerError({ message }: { message: string }) {
  const { t } = useI18n()
  return (
    <p className="p-8 text-sm text-red-600">
      {t.serverUnreachable}: {message}
    </p>
  )
}

function Dashboard({ user }: { user: User }) {
  const { t } = useI18n()
  const [listFilter, setListFilter] = useState<ListFilter>('all')
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('active')
  const [query, setQuery] = useState('')
  const [sort, setSort] = useState<Sort>('recent')
  const [menuOpen, setMenuOpen] = useState(false)
  const lists = useLists()
  const videos = useVideos()

  const allLists = lists.data ?? []
  const needle = normalize(query.trim())
  const matching = (videos.data ?? []).filter(
    (v) =>
      (listFilter === 'all' ||
        (listFilter === 'none' ? v.list_id === null : v.list_id === listFilter)) &&
      (!needle || normalize(`${v.title} ${v.channel}`).includes(needle)),
  )
  const visible = matching.filter(statusMatchers[statusFilter]).sort(sorters[sort])

  const title =
    listFilter === 'all'
      ? t.allVideos
      : listFilter === 'none'
        ? t.unlisted
        : (allLists.find((l) => l.id === listFilter)?.name ?? '')

  const sidebar = (
    <Sidebar
      user={user}
      lists={lists.data}
      videos={videos.data ?? []}
      selected={listFilter}
      onSelect={(filter) => {
        setListFilter(filter)
        setMenuOpen(false)
      }}
    />
  )

  const tabs: { value: StatusFilter; label: string }[] = [
    { value: 'active', label: t.toWatch },
    { value: 'done', label: t.done },
    { value: 'all', label: t.all },
  ]

  return (
    <div className="mx-auto max-w-6xl px-4 py-4 lg:grid lg:grid-cols-[240px_1fr] lg:gap-8 lg:py-10">
      <header className="mb-4 flex items-center justify-between lg:hidden">
        <span className="flex items-center gap-2">
          <Logo className="size-7" />
          <span className="text-lg font-bold tracking-tight">Where Was I</span>
        </span>
        <button
          type="button"
          onClick={() => setMenuOpen(true)}
          aria-label={t.openMenu}
          className="rounded-lg p-2 hover:bg-zinc-200 dark:hover:bg-zinc-800"
        >
          <Menu className="size-5" />
        </button>
      </header>

      <aside className="hidden lg:block">{sidebar}</aside>
      {menuOpen && <Drawer onClose={() => setMenuOpen(false)}>{sidebar}</Drawer>}

      <main className="min-w-0 space-y-6">
        <header className="space-y-4">
          <h1 className="text-2xl font-bold tracking-tight">{title}</h1>
          <AddVideoForm listId={typeof listFilter === 'number' ? listFilter : null} />
        </header>

        <div className="space-y-3">
          <div className="flex gap-1 overflow-x-auto border-b border-zinc-200 dark:border-zinc-800" role="tablist">
            {tabs.map((tab) => (
              <button
                key={tab.value}
                type="button"
                role="tab"
                aria-selected={statusFilter === tab.value}
                onClick={() => setStatusFilter(tab.value)}
                className={`-mb-px shrink-0 border-b-2 px-3 py-2 text-sm font-medium ${
                  statusFilter === tab.value
                    ? 'border-red-600 text-zinc-900 dark:text-zinc-100'
                    : 'border-transparent text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100'
                }`}
              >
                {tab.label}
                <span className="ml-1.5 font-mono text-xs text-zinc-400 tabular-nums">
                  {matching.filter(statusMatchers[tab.value]).length}
                </span>
              </button>
            ))}
          </div>

          <div className="flex flex-col gap-2 sm:flex-row">
            <label className="relative flex-1">
              <Search className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-zinc-400" />
              <input
                type="search"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder={t.search}
                aria-label={t.search}
                className="w-full rounded-lg border border-zinc-300 bg-white py-1.5 pr-3 pl-8 text-sm outline-none placeholder:text-zinc-400 focus:border-red-500 focus:ring-2 focus:ring-red-500/20 dark:border-zinc-700 dark:bg-zinc-900"
              />
            </label>
            <label className="relative">
              <ArrowUpDown className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-zinc-400" />
              <select
                value={sort}
                onChange={(e) => setSort(e.target.value as Sort)}
                aria-label={t.sortBy}
                className="w-full rounded-lg border border-zinc-300 bg-white py-1.5 pr-3 pl-8 text-sm outline-none focus:border-red-500 sm:w-auto dark:border-zinc-700 dark:bg-zinc-900"
              >
                <option value="recent">{t.sortRecent}</option>
                <option value="progress">{t.sortProgress}</option>
                <option value="remaining">{t.sortRemaining}</option>
                <option value="title">{t.sortTitle}</option>
              </select>
            </label>
          </div>
        </div>

        {videos.isPending ? (
          <div className="space-y-3">
            <VideoCardSkeleton />
            <VideoCardSkeleton />
            <VideoCardSkeleton />
          </div>
        ) : videos.error ? (
          <p className="text-sm text-red-600">
            {t.couldNotLoadVideos}: {videos.error.message}
          </p>
        ) : visible.length === 0 ? (
          <div className="rounded-xl border border-dashed border-zinc-300 px-6 py-12 text-center dark:border-zinc-700">
            {needle ? (
              <p className="text-sm text-zinc-500">{t.noResults(query.trim())}</p>
            ) : (
              <>
                <p className="font-medium">{t.emptyTitle}</p>
                <p className="mt-1 text-sm text-zinc-500">
                  {statusFilter === 'done' ? t.emptyDone : t.emptyActive}
                </p>
              </>
            )}
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

function Sidebar({
  user,
  lists,
  videos,
  selected,
  onSelect,
}: {
  user: User
  lists: List[] | undefined
  videos: Video[]
  selected: ListFilter
  onSelect: (filter: ListFilter) => void
}) {
  const { t } = useI18n()
  const logout = useLogout()

  return (
    <div className="flex h-full flex-col">
      <div className="mb-6 hidden items-center gap-2 px-3 lg:flex">
        <Logo className="size-7" />
        <span className="text-lg font-bold tracking-tight">Where Was I</span>
      </div>
      <ListsSidebar lists={lists} videos={videos} selected={selected} onSelect={onSelect} />

      <div className="mt-8 space-y-4 border-t border-zinc-200 pt-4 dark:border-zinc-800">
        <Preferences user={user} />
        <div className="flex items-center gap-2 px-3">
          {user.avatar_url && (
            <img
              src={user.avatar_url}
              alt=""
              className="size-7 rounded-full"
              referrerPolicy="no-referrer"
            />
          )}
          <span className="min-w-0 flex-1 truncate text-sm text-zinc-600 dark:text-zinc-400">
            {user.name || user.email}
          </span>
          <button
            type="button"
            onClick={() => logout.mutate()}
            aria-label={t.signOut}
            title={t.signOut}
            className="rounded-md p-1.5 text-zinc-500 hover:bg-zinc-200 hover:text-zinc-900 dark:hover:bg-zinc-800 dark:hover:text-zinc-100"
          >
            <LogOut className="size-4" />
          </button>
        </div>
      </div>
    </div>
  )
}

function Drawer({ onClose, children }: { onClose: () => void; children: ReactNode }) {
  const { t } = useI18n()

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose()
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [onClose])

  return (
    <div className="fixed inset-0 z-40 lg:hidden">
      <button
        type="button"
        aria-label={t.closeMenu}
        onClick={onClose}
        className="absolute inset-0 bg-black/50 motion-safe:animate-fade-in"
      />
      <div className="absolute inset-y-0 left-0 w-72 max-w-[85vw] overflow-y-auto bg-zinc-50 p-4 shadow-xl motion-safe:animate-fade-in dark:bg-zinc-950">
        <div className="mb-4 flex items-center justify-between px-3">
          <span className="flex items-center gap-2">
            <Logo className="size-7" />
            <span className="text-lg font-bold tracking-tight">Where Was I</span>
          </span>
          <button
            type="button"
            onClick={onClose}
            aria-label={t.closeMenu}
            className="rounded-lg p-1.5 hover:bg-zinc-200 dark:hover:bg-zinc-800"
          >
            <X className="size-5" />
          </button>
        </div>
        {children}
      </div>
    </div>
  )
}

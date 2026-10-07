import { useState } from 'react'
import type { ListFilter } from '@/features/lists/types'
import { Drawer } from '@/features/layout/Drawer'
import { MobileHeader } from '@/features/layout/MobileHeader'
import { Sidebar } from '@/features/layout/Sidebar'
import { AddVideoForm } from '@/features/videos/AddVideoForm'
import { matchVideos, sorters, statusMatchers, type Sort, type StatusFilter } from '@/features/videos/filters'
import { VideoFilters } from '@/features/videos/VideoFilters'
import { VideoList } from '@/features/videos/VideoList'
import { useI18n } from '@/i18n'
import type { User } from '@/lib/api'
import { useLists, useVideos } from '@/lib/queries'

/** The signed-in screen: owns the filter state and composes sidebar, filters and list. */
export function DashboardView({ user }: { user: User }) {
  const { t } = useI18n()
  const [listFilter, setListFilter] = useState<ListFilter>('all')
  const [status, setStatus] = useState<StatusFilter>('active')
  const [query, setQuery] = useState('')
  const [sort, setSort] = useState<Sort>('recent')
  const [menuOpen, setMenuOpen] = useState(false)
  const lists = useLists()
  const videos = useVideos()

  const matching = matchVideos(videos.data ?? [], listFilter, query)
  const visible = matching.filter(statusMatchers[status]).sort(sorters[sort])
  const counts = {
    active: matching.filter(statusMatchers.active).length,
    done: matching.filter(statusMatchers.done).length,
    all: matching.length,
  }

  const title =
    listFilter === 'all'
      ? t.allVideos
      : listFilter === 'none'
        ? t.unlisted
        : (lists.data?.find((l) => l.id === listFilter)?.name ?? '')

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

  return (
    <div className="mx-auto max-w-6xl px-4 py-4 lg:grid lg:grid-cols-[240px_1fr] lg:gap-8 lg:py-10">
      <MobileHeader onOpenMenu={() => setMenuOpen(true)} />
      <aside className="hidden lg:block">{sidebar}</aside>
      {menuOpen && <Drawer onClose={() => setMenuOpen(false)}>{sidebar}</Drawer>}

      <main className="min-w-0 space-y-6">
        <header className="space-y-4">
          <h1 className="text-2xl font-bold tracking-tight">{title}</h1>
          <AddVideoForm listId={typeof listFilter === 'number' ? listFilter : null} />
        </header>
        <VideoFilters
          status={status}
          counts={counts}
          onStatusChange={setStatus}
          query={query}
          onQueryChange={setQuery}
          sort={sort}
          onSortChange={setSort}
        />
        <VideoList
          videos={visible}
          lists={lists.data ?? []}
          isPending={videos.isPending}
          error={videos.error}
          query={query}
          status={status}
        />
      </main>
    </div>
  )
}

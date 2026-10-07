import { Inbox, Library } from 'lucide-react'
import { Skeleton } from '@/components/ui/Skeleton'
import { useI18n } from '@/i18n'
import type { List, Video } from '@/lib/api'
import { ListItem } from './ListItem'
import { NewListForm } from './NewListForm'
import { SidebarItem } from './SidebarItem'
import type { ListFilter } from './types'

interface Props {
  lists: List[] | undefined
  videos: Video[]
  selected: ListFilter
  onSelect: (filter: ListFilter) => void
}

/** "All videos", "Unlisted" and the user's lists, each with its count of videos to watch. */
export function ListsSidebar({ lists, videos, selected, onSelect }: Props) {
  const { t } = useI18n()
  const active = videos.filter((v) => v.status !== 'done')
  const countFor = (filter: ListFilter) =>
    filter === 'all'
      ? active.length
      : active.filter((v) => (filter === 'none' ? v.list_id === null : v.list_id === filter))
          .length

  return (
    <nav className="space-y-1" aria-label={t.lists}>
      <SidebarItem
        icon={Library}
        label={t.allVideos}
        count={countFor('all')}
        active={selected === 'all'}
        onClick={() => onSelect('all')}
      />
      <SidebarItem
        icon={Inbox}
        label={t.unlisted}
        count={countFor('none')}
        active={selected === 'none'}
        onClick={() => onSelect('none')}
      />

      <h2 className="px-3 pt-4 pb-1 text-xs font-semibold tracking-wide text-zinc-500 uppercase">
        {t.lists}
      </h2>
      {lists === undefined ? (
        <div className="space-y-2 px-3 py-1">
          <Skeleton className="h-4 w-3/4" />
          <Skeleton className="h-4 w-1/2" />
          <Skeleton className="h-4 w-2/3" />
        </div>
      ) : (
        lists.map((list) => (
          <ListItem
            key={list.id}
            list={list}
            count={countFor(list.id)}
            active={selected === list.id}
            onSelect={() => onSelect(list.id)}
            onDeleted={() => selected === list.id && onSelect('all')}
          />
        ))
      )}
      <NewListForm onCreated={(list) => onSelect(list.id)} />
    </nav>
  )
}

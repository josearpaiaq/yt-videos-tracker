import { UserBadge } from '@/features/auth/UserBadge'
import { ListsSidebar } from '@/features/lists/ListsSidebar'
import type { ListFilter } from '@/features/lists/types'
import { Preferences } from '@/features/preferences/Preferences'
import type { List, User, Video } from '@/lib/api'
import { Brand } from './Brand'

interface Props {
  user: User
  lists: List[] | undefined
  videos: Video[]
  selected: ListFilter
  onSelect: (filter: ListFilter) => void
}

/** Lists navigation plus preferences and account, shared by the desktop aside and the mobile drawer. */
export function Sidebar({ user, lists, videos, selected, onSelect }: Props) {
  return (
    <div className="flex h-full flex-col">
      <div className="mb-6 hidden px-3 lg:block">
        <Brand />
      </div>
      <ListsSidebar lists={lists} videos={videos} selected={selected} onSelect={onSelect} />
      <div className="mt-8 space-y-4 border-t border-zinc-200 pt-4 dark:border-zinc-800">
        <Preferences user={user} />
        <UserBadge user={user} />
      </div>
    </div>
  )
}

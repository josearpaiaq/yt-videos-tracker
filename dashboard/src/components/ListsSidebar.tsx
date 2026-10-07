import { Inbox, Library, ListVideo, Pencil, Plus, Trash2, type LucideIcon } from 'lucide-react'
import { useState, type FormEvent } from 'react'
import { toast } from 'sonner'
import type { List, Video } from '../api'
import { useI18n } from '../i18n'
import { useCreateList, useDeleteList, useRenameList } from '../queries'
import { useConfirm } from './confirm'
import { IconButton } from './IconButton'
import { SidebarSkeleton } from './Skeletons'

export type ListFilter = 'all' | 'none' | number

interface Props {
  lists: List[] | undefined
  videos: Video[]
  selected: ListFilter
  onSelect: (filter: ListFilter) => void
}

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
        <SidebarSkeleton />
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

function SidebarItem({
  icon: Icon,
  label,
  count,
  active,
  onClick,
}: {
  icon: LucideIcon
  label: string
  count: number
  active: boolean
  onClick: () => void
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-current={active ? 'page' : undefined}
      className={`flex w-full items-center gap-2.5 rounded-lg px-3 py-1.5 text-left text-sm ${
        active
          ? 'bg-zinc-200 font-semibold dark:bg-zinc-800'
          : 'text-zinc-600 hover:bg-zinc-100 dark:text-zinc-400 dark:hover:bg-zinc-900'
      }`}
    >
      <Icon className="size-4 shrink-0 text-zinc-500" />
      <span className="flex-1 truncate">{label}</span>
      <span className="ml-2 font-mono text-xs text-zinc-500 tabular-nums">{count}</span>
    </button>
  )
}

function ListItem({
  list,
  count,
  active,
  onSelect,
  onDeleted,
}: {
  list: List
  count: number
  active: boolean
  onSelect: () => void
  onDeleted: () => void
}) {
  const { t } = useI18n()
  const confirm = useConfirm()
  const [editing, setEditing] = useState(false)
  const [name, setName] = useState(list.name)
  const renameList = useRenameList()
  const deleteList = useDeleteList()

  function submitRename(e: { preventDefault: () => void }) {
    e.preventDefault()
    if (renameList.isPending) return
    const trimmed = name.trim()
    if (!trimmed || trimmed === list.name) {
      setName(list.name)
      setEditing(false)
      return
    }
    renameList.mutate(
      { id: list.id, name: trimmed },
      {
        onSuccess: () => {
          setEditing(false)
          toast.success(t.listRenamed(trimmed))
        },
      },
    )
  }

  async function remove() {
    const ok = await confirm({
      title: t.confirmDeleteList(list.name),
      description: t.confirmDeleteListBody,
      confirmLabel: t.delete,
    })
    if (!ok) return
    deleteList.mutate(list.id, {
      onSuccess: () => {
        onDeleted()
        toast.success(t.listDeleted(list.name))
      },
      onError: (err) => toast.error(err.message),
    })
  }

  if (editing) {
    return (
      <form onSubmit={submitRename} className="px-1">
        <input
          autoFocus
          value={name}
          onChange={(e) => setName(e.target.value)}
          onBlur={submitRename}
          onKeyDown={(e) => {
            if (e.key === 'Escape') {
              setName(list.name)
              setEditing(false)
            }
          }}
          aria-label={t.listName}
          className="w-full rounded-lg border border-red-500 bg-white px-2 py-1 text-sm outline-none dark:bg-zinc-900"
        />
        {renameList.error && (
          <p className="px-1 pt-1 text-xs text-red-600">{renameList.error.message}</p>
        )}
      </form>
    )
  }

  return (
    <div className="group relative">
      <SidebarItem icon={ListVideo} label={list.name} count={count} active={active} onClick={onSelect} />
      <div className="absolute inset-y-0 right-8 hidden items-center group-focus-within:flex group-hover:flex">
        <IconButton label={t.renameList(list.name)} icon={Pencil} onClick={() => setEditing(true)} />
        <IconButton label={t.deleteList(list.name)} icon={Trash2} onClick={remove} />
      </div>
    </div>
  )
}

function NewListForm({ onCreated }: { onCreated: (list: List) => void }) {
  const { t } = useI18n()
  const [name, setName] = useState('')
  const createList = useCreateList()

  function submit(e: FormEvent) {
    e.preventDefault()
    if (!name.trim()) return
    createList.mutate(name.trim(), {
      onSuccess: (list) => {
        setName('')
        onCreated(list)
        toast.success(t.listCreated(list.name))
      },
    })
  }

  return (
    <form onSubmit={submit} className="relative px-1 pt-1">
      <Plus className="pointer-events-none absolute top-1/2 left-3.5 mt-0.5 size-4 -translate-y-1/2 text-zinc-500" />
      <input
        value={name}
        onChange={(e) => {
          setName(e.target.value)
          createList.reset()
        }}
        placeholder={t.newList}
        aria-label={t.newList}
        className="w-full rounded-lg border border-transparent bg-transparent py-1.5 pr-2 pl-8 text-sm outline-none placeholder:text-zinc-500 hover:border-zinc-300 focus:border-red-500 focus:bg-white dark:hover:border-zinc-700 dark:focus:bg-zinc-900"
      />
      {createList.error && (
        <p className="px-1 pt-1 text-xs text-red-600">{createList.error.message}</p>
      )}
    </form>
  )
}

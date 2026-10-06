import { useState, type FormEvent } from 'react'
import type { List, Video } from '../api'
import { useCreateList, useDeleteList, useRenameList } from '../queries'
import { IconButton } from './IconButton'

export type ListFilter = 'all' | 'none' | number

interface Props {
  lists: List[]
  videos: Video[]
  selected: ListFilter
  onSelect: (filter: ListFilter) => void
}

export function ListsSidebar({ lists, videos, selected, onSelect }: Props) {
  const active = videos.filter((v) => v.status !== 'done')
  const countFor = (filter: ListFilter) =>
    filter === 'all'
      ? active.length
      : active.filter((v) => (filter === 'none' ? v.list_id === null : v.list_id === filter))
          .length

  return (
    <nav className="space-y-1" aria-label="Lists">
      <SidebarItem
        label="All videos"
        count={countFor('all')}
        active={selected === 'all'}
        onClick={() => onSelect('all')}
      />
      <SidebarItem
        label="Unlisted"
        count={countFor('none')}
        active={selected === 'none'}
        onClick={() => onSelect('none')}
      />

      <h2 className="px-3 pt-4 pb-1 text-xs font-semibold tracking-wide text-zinc-500 uppercase">
        Lists
      </h2>
      {lists.map((list) => (
        <ListItem
          key={list.id}
          list={list}
          count={countFor(list.id)}
          active={selected === list.id}
          onSelect={() => onSelect(list.id)}
          onDeleted={() => selected === list.id && onSelect('all')}
        />
      ))}
      <NewListForm onCreated={(list) => onSelect(list.id)} />
    </nav>
  )
}

function SidebarItem({
  label,
  count,
  active,
  onClick,
}: {
  label: string
  count: number
  active: boolean
  onClick: () => void
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex w-full items-center justify-between rounded-lg px-3 py-1.5 text-left text-sm ${
        active
          ? 'bg-zinc-200 font-semibold dark:bg-zinc-800'
          : 'text-zinc-600 hover:bg-zinc-100 dark:text-zinc-400 dark:hover:bg-zinc-900'
      }`}
    >
      <span className="truncate">{label}</span>
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
    renameList.mutate({ id: list.id, name: trimmed }, { onSuccess: () => setEditing(false) })
  }

  function remove() {
    if (!confirm(`Delete the list “${list.name}”? Its videos will be kept as unlisted.`)) return
    deleteList.mutate(list.id, { onSuccess: onDeleted })
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
          aria-label="List name"
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
      <SidebarItem label={list.name} count={count} active={active} onClick={onSelect} />
      <div className="absolute inset-y-0 right-8 hidden items-center gap-0.5 group-focus-within:flex group-hover:flex">
        <IconButton label={`Rename ${list.name}`} onClick={() => setEditing(true)}>
          <path d="M4 20h4L18.5 9.5a2.1 2.1 0 0 0-3-3L5 17v3z" />
        </IconButton>
        <IconButton label={`Delete ${list.name}`} onClick={remove}>
          <path d="M6 6l12 12M18 6L6 18" />
        </IconButton>
      </div>
    </div>
  )
}

function NewListForm({ onCreated }: { onCreated: (list: List) => void }) {
  const [name, setName] = useState('')
  const createList = useCreateList()

  function submit(e: FormEvent) {
    e.preventDefault()
    if (!name.trim()) return
    createList.mutate(name.trim(), {
      onSuccess: (list) => {
        setName('')
        onCreated(list)
      },
    })
  }

  return (
    <form onSubmit={submit} className="px-1 pt-1">
      <input
        value={name}
        onChange={(e) => {
          setName(e.target.value)
          createList.reset()
        }}
        placeholder="+ New list"
        aria-label="New list name"
        className="w-full rounded-lg border border-transparent bg-transparent px-2 py-1.5 text-sm outline-none placeholder:text-zinc-500 hover:border-zinc-300 focus:border-red-500 focus:bg-white dark:hover:border-zinc-700 dark:focus:bg-zinc-900"
      />
      {createList.error && (
        <p className="px-1 pt-1 text-xs text-red-600">{createList.error.message}</p>
      )}
    </form>
  )
}

import { ListVideo, Pencil, Trash2 } from 'lucide-react'
import { useState } from 'react'
import { toast } from 'sonner'
import { useConfirm } from '@/components/ui/confirm'
import { IconButton } from '@/components/ui/IconButton'
import { useI18n } from '@/i18n'
import type { List } from '@/lib/api'
import { useDeleteList, useRenameList } from '@/lib/queries'
import { SidebarItem } from './SidebarItem'

/** A user list in the sidebar, with inline rename and delete. */
export function ListItem({
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

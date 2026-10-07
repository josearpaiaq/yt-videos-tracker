import { Plus } from 'lucide-react'
import { useState, type FormEvent } from 'react'
import { toast } from 'sonner'
import { useI18n } from '@/i18n'
import type { List } from '@/lib/api'
import { useCreateList } from '@/lib/queries'

export function NewListForm({ onCreated }: { onCreated: (list: List) => void }) {
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

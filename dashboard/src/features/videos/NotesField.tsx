import { NotebookPen } from 'lucide-react'
import { useState } from 'react'
import { useI18n } from '@/i18n'

/** Collapsed note preview that turns into a textarea and saves on blur. */
export function NotesField({ notes, onSave }: { notes: string; onSave: (notes: string) => void }) {
  const { t } = useI18n()
  const [open, setOpen] = useState(false)
  const [draft, setDraft] = useState(notes)

  if (!open) {
    return notes ? (
      <button
        type="button"
        onClick={() => {
          setDraft(notes)
          setOpen(true)
        }}
        className="flex gap-2 text-left text-sm text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100"
      >
        <NotebookPen className="mt-0.5 size-3.5 shrink-0" />
        <span className="line-clamp-2 whitespace-pre-line italic">{notes}</span>
      </button>
    ) : (
      <button
        type="button"
        onClick={() => {
          setDraft('')
          setOpen(true)
        }}
        className="inline-flex items-center gap-1.5 self-start text-xs text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100"
      >
        <NotebookPen className="size-3.5" />
        {t.addNote}
      </button>
    )
  }

  return (
    <textarea
      autoFocus
      value={draft}
      onChange={(e) => setDraft(e.target.value)}
      onBlur={() => {
        setOpen(false)
        if (draft !== notes) onSave(draft)
      }}
      onKeyDown={(e) => {
        if (e.key === 'Escape') {
          setDraft(notes)
          setOpen(false)
        }
      }}
      rows={3}
      placeholder={t.notesPlaceholder}
      aria-label={t.notes}
      className="w-full rounded-md border border-zinc-300 bg-white px-2 py-1.5 text-sm outline-none focus:border-red-500 focus:ring-2 focus:ring-red-500/20 dark:border-zinc-700 dark:bg-zinc-950"
    />
  )
}

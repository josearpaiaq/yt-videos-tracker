import { Loader2, Plus } from 'lucide-react'
import { useState, type FormEvent } from 'react'
import { toast } from 'sonner'
import { ApiError } from '@/lib/api'
import { useI18n } from '@/i18n'
import { useCreateVideo } from '@/lib/queries'

export function AddVideoForm({ listId }: { listId: number | null }) {
  const { t } = useI18n()
  const [url, setUrl] = useState('')
  const createVideo = useCreateVideo()

  function submit(e: FormEvent) {
    e.preventDefault()
    if (!url.trim()) return
    createVideo.mutate(
      { url: url.trim(), listId },
      {
        onSuccess: (video) => {
          setUrl('')
          toast.success(t.videoAdded(video.title))
        },
      },
    )
  }

  const error = createVideo.error
  const errorMessage =
    error instanceof ApiError && error.status === 409 ? t.alreadyAdded : error?.message

  return (
    <form onSubmit={submit} className="space-y-2">
      <div className="flex gap-2">
        <input
          type="text"
          value={url}
          onChange={(e) => {
            setUrl(e.target.value)
            createVideo.reset()
          }}
          placeholder={t.pasteLink}
          aria-label={t.youtubeLink}
          className="min-w-0 flex-1 rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm outline-none placeholder:text-zinc-400 focus:border-red-500 focus:ring-2 focus:ring-red-500/20 dark:border-zinc-700 dark:bg-zinc-900"
        />
        <button
          type="submit"
          disabled={createVideo.isPending || !url.trim()}
          className="inline-flex items-center gap-1.5 rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {createVideo.isPending ? (
            <Loader2 className="size-4 animate-spin" />
          ) : (
            <Plus className="size-4" />
          )}
          {createVideo.isPending ? t.adding : t.add}
        </button>
      </div>
      {errorMessage ? (
        <p className="text-sm text-red-600 dark:text-red-400">{errorMessage}</p>
      ) : (
        <p className="text-xs text-zinc-500">{t.addTip}</p>
      )}
    </form>
  )
}

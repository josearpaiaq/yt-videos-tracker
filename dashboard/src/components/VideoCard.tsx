import { Loader2, NotebookPen, Play, Trash2 } from 'lucide-react'
import { useState } from 'react'
import { toast } from 'sonner'
import type { List, Video, VideoPatch, VideoStatus } from '../api'
import { useI18n } from '../i18n'
import { useDeleteVideo, useUpdateVideo } from '../queries'
import { formatTime, parseTime, youtubeUrl } from '../time'
import { useConfirm } from './confirm'
import { IconButton } from './IconButton'

const statusStyles: Record<VideoStatus, string> = {
  pending: 'bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300',
  watching: 'bg-amber-100 text-amber-800 dark:bg-amber-500/15 dark:text-amber-300',
  done: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-500/15 dark:text-emerald-300',
}

const selectClass =
  'rounded-md border border-zinc-200 bg-white px-1.5 py-1 text-xs outline-none focus:border-red-500 dark:border-zinc-700 dark:bg-zinc-900'

export function VideoCard({ video, lists }: { video: Video; lists: List[] }) {
  const { t } = useI18n()
  const confirm = useConfirm()
  const updateVideo = useUpdateVideo()
  const deleteVideo = useDeleteVideo()

  const update = (patch: VideoPatch, successMessage?: (video: Video) => string) =>
    updateVideo.mutate(
      { id: video.id, patch },
      {
        onSuccess: (updated) => successMessage && toast.success(successMessage(updated)),
        onError: (err) => toast.error(err.message),
      },
    )

  const progress =
    video.duration_seconds > 0 ? (video.position_seconds / video.duration_seconds) * 100 : 0
  const resumeUrl = youtubeUrl(video.youtube_id, video.position_seconds)

  async function remove() {
    const ok = await confirm({
      title: t.confirmRemoveVideo,
      description: t.confirmRemoveVideoBody(video.title),
      confirmLabel: t.remove,
    })
    if (!ok) return
    deleteVideo.mutate(video.id, {
      onSuccess: () => toast.success(t.videoRemoved),
      onError: (err) => toast.error(err.message),
    })
  }

  return (
    <article className="flex flex-col gap-4 rounded-xl border border-zinc-200 bg-white p-3 motion-safe:animate-fade-in sm:flex-row dark:border-zinc-800 dark:bg-zinc-900">
      <a
        href={resumeUrl}
        target="_blank"
        rel="noreferrer"
        className="relative block aspect-video shrink-0 self-start overflow-hidden rounded-lg bg-zinc-200 max-sm:w-full sm:w-56 dark:bg-zinc-800"
      >
        {video.thumbnail_url && (
          <img src={video.thumbnail_url} alt="" className="size-full object-cover" loading="lazy" />
        )}
        {video.duration_seconds > 0 && (
          <span className="absolute right-1.5 bottom-2.5 rounded bg-black/80 px-1 font-mono text-[11px] text-white">
            {formatTime(video.duration_seconds)}
          </span>
        )}
        <span className="absolute inset-x-0 bottom-0 h-1 bg-white/30">
          <span className="block h-full bg-red-600" style={{ width: `${progress}%` }} />
        </span>
      </a>

      <div className="flex min-w-0 flex-1 flex-col gap-3">
        <div className="flex items-start gap-2">
          <div className="min-w-0 flex-1">
            <a
              href={resumeUrl}
              target="_blank"
              rel="noreferrer"
              className="line-clamp-2 leading-snug font-semibold hover:underline"
            >
              {video.title}
            </a>
            <p className="truncate text-sm text-zinc-500">{video.channel}</p>
          </div>
          <IconButton label={t.removeVideo} icon={Trash2} onClick={remove} />
        </div>

        <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
          <TimeField
            seconds={video.position_seconds}
            duration={video.duration_seconds}
            onSave={(position_seconds) =>
              update({ position_seconds }, (v) => t.positionSaved(formatTime(v.position_seconds)))
            }
          />
          {video.duration_seconds > 0 && (
            <span className="font-mono text-sm text-zinc-500 tabular-nums">
              / {formatTime(video.duration_seconds)} · {Math.round(progress)}%
            </span>
          )}
          {updateVideo.isPending && (
            <Loader2 className="size-4 animate-spin text-zinc-400" aria-label="…" />
          )}
          <a
            href={resumeUrl}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1.5 rounded-md bg-zinc-900 px-2.5 py-1 text-xs font-semibold text-white hover:bg-zinc-700 max-sm:w-full max-sm:justify-center max-sm:py-2 sm:ml-auto dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-300"
          >
            <Play className="size-3 fill-current" />
            {t.resumeAt(formatTime(video.position_seconds))}
          </a>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <select
            value={video.status}
            onChange={(e) => update({ status: e.target.value as VideoStatus })}
            aria-label={t.status}
            className={`rounded-md px-2 py-1 text-xs font-semibold outline-none ${statusStyles[video.status]}`}
          >
            <option value="pending">{t.pending}</option>
            <option value="watching">{t.watching}</option>
            <option value="done">{t.statusDone}</option>
          </select>
          <select
            value={video.list_id ?? ''}
            onChange={(e) => update({ list_id: e.target.value ? Number(e.target.value) : null })}
            aria-label={t.list}
            className={selectClass}
          >
            <option value="">{t.noList}</option>
            {lists.map((l) => (
              <option key={l.id} value={l.id}>
                {l.name}
              </option>
            ))}
          </select>
        </div>

        <NotesField notes={video.notes} onSave={(notes) => update({ notes }, () => t.notesSaved)} />
      </div>
    </article>
  )
}

function TimeField({
  seconds,
  duration,
  onSave,
}: {
  seconds: number
  duration: number
  onSave: (seconds: number) => void
}) {
  const { t } = useI18n()
  const [draft, setDraft] = useState(formatTime(seconds))
  const [invalid, setInvalid] = useState(false)
  const [synced, setSynced] = useState(seconds)

  // Reset the draft whenever the saved value changes.
  if (seconds !== synced) {
    setSynced(seconds)
    setDraft(formatTime(seconds))
    setInvalid(false)
  }

  function commit() {
    const parsed = parseTime(draft)
    if (parsed === null) {
      setInvalid(true)
      return
    }
    const clamped = duration > 0 ? Math.min(parsed, duration) : parsed
    setInvalid(false)
    setDraft(formatTime(clamped))
    if (clamped !== seconds) onSave(clamped)
  }

  return (
    <label className="flex items-center gap-2 text-sm">
      <span className="text-zinc-500">{t.at}</span>
      <input
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        onBlur={commit}
        onKeyDown={(e) => {
          if (e.key === 'Enter') e.currentTarget.blur()
          if (e.key === 'Escape') {
            setDraft(formatTime(seconds))
            setInvalid(false)
          }
        }}
        title={t.timeHint}
        aria-invalid={invalid}
        className={`w-24 rounded-md border px-2 py-1 text-center font-mono text-base font-medium tabular-nums outline-none focus:ring-2 dark:bg-zinc-950 ${
          invalid
            ? 'border-red-500 ring-2 ring-red-500/20'
            : 'border-zinc-300 focus:border-red-500 focus:ring-red-500/20 dark:border-zinc-700'
        }`}
      />
    </label>
  )
}

function NotesField({ notes, onSave }: { notes: string; onSave: (notes: string) => void }) {
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

import { useState } from 'react'
import type { List, Video, VideoPatch, VideoStatus } from '../api'
import { useDeleteVideo, useUpdateVideo } from '../queries'
import { formatTime, parseTime, youtubeUrl } from '../time'
import { IconButton } from './IconButton'

const statusStyles: Record<VideoStatus, string> = {
  pending: 'bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300',
  watching: 'bg-amber-100 text-amber-800 dark:bg-amber-500/15 dark:text-amber-300',
  done: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-500/15 dark:text-emerald-300',
}

const selectClass =
  'rounded-md border border-zinc-200 bg-white px-1.5 py-1 text-xs outline-none focus:border-red-500 dark:border-zinc-700 dark:bg-zinc-900'

export function VideoCard({ video, lists }: { video: Video; lists: List[] }) {
  const updateVideo = useUpdateVideo()
  const deleteVideo = useDeleteVideo()
  const update = (patch: VideoPatch) => updateVideo.mutate({ id: video.id, patch })

  const progress =
    video.duration_seconds > 0 ? (video.position_seconds / video.duration_seconds) * 100 : 0
  const resumeUrl = youtubeUrl(video.youtube_id, video.position_seconds)

  function remove() {
    if (confirm(`Remove “${video.title}”?`)) deleteVideo.mutate(video.id)
  }

  return (
    <article className="flex flex-col gap-4 rounded-xl border border-zinc-200 bg-white p-3 sm:flex-row dark:border-zinc-800 dark:bg-zinc-900">
      <a
        href={resumeUrl}
        target="_blank"
        rel="noreferrer"
        className="relative block aspect-video shrink-0 self-start overflow-hidden rounded-lg bg-zinc-200 sm:w-56 dark:bg-zinc-800"
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
              className="line-clamp-2 font-semibold leading-snug hover:underline"
            >
              {video.title}
            </a>
            <p className="truncate text-sm text-zinc-500">{video.channel}</p>
          </div>
          <IconButton label="Remove video" onClick={remove}>
            <path d="M4 7h16M10 11v6M14 11v6M5 7l1 12a2 2 0 0 0 2 2h8a2 2 0 0 0 2-2l1-12M9 7V4h6v3" />
          </IconButton>
        </div>

        <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
          <TimeField
            seconds={video.position_seconds}
            duration={video.duration_seconds}
            onSave={(position_seconds) => update({ position_seconds })}
          />
          {video.duration_seconds > 0 && (
            <span className="font-mono text-sm text-zinc-500 tabular-nums">
              / {formatTime(video.duration_seconds)} · {Math.round(progress)}%
            </span>
          )}
          <a
            href={resumeUrl}
            target="_blank"
            rel="noreferrer"
            className="ml-auto inline-flex items-center gap-1 rounded-md bg-zinc-900 px-2.5 py-1 text-xs font-semibold text-white hover:bg-zinc-700 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-300"
          >
            <svg viewBox="0 0 24 24" className="size-3" fill="currentColor" aria-hidden>
              <path d="M7 4v16l13-8z" />
            </svg>
            Resume at {formatTime(video.position_seconds)}
          </a>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <select
            value={video.status}
            onChange={(e) => update({ status: e.target.value as VideoStatus })}
            aria-label="Status"
            className={`rounded-md px-2 py-1 text-xs font-semibold outline-none ${statusStyles[video.status]}`}
          >
            <option value="pending">Pending</option>
            <option value="watching">Watching</option>
            <option value="done">Done</option>
          </select>
          <select
            value={video.list_id ?? ''}
            onChange={(e) => update({ list_id: e.target.value ? Number(e.target.value) : null })}
            aria-label="List"
            className={selectClass}
          >
            <option value="">No list</option>
            {lists.map((l) => (
              <option key={l.id} value={l.id}>
                {l.name}
              </option>
            ))}
          </select>
          {updateVideo.isPending && <span className="text-xs text-zinc-400">Saving…</span>}
          {updateVideo.error && (
            <span className="text-xs text-red-600">{updateVideo.error.message}</span>
          )}
        </div>

        <NotesField notes={video.notes} onSave={(notes) => update({ notes })} />
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
      <span className="text-zinc-500">At</span>
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
        title="h:mm:ss, m:ss or minutes"
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
        className="line-clamp-2 text-left text-sm whitespace-pre-line text-zinc-600 italic hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100"
      >
        {notes}
      </button>
    ) : (
      <button
        type="button"
        onClick={() => {
          setDraft('')
          setOpen(true)
        }}
        className="self-start text-xs text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100"
      >
        + Add note
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
      placeholder="Where you left off, what to look for…"
      aria-label="Notes"
      className="w-full rounded-md border border-zinc-300 bg-white px-2 py-1.5 text-sm outline-none focus:border-red-500 focus:ring-2 focus:ring-red-500/20 dark:border-zinc-700 dark:bg-zinc-950"
    />
  )
}

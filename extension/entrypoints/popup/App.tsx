import { useEffect, useState } from 'react';
import { api, ApiError, type List, type Video, type VideoPatch, type VideoStatus } from '@/lib/api';
import { DASHBOARD_URL } from '@/lib/config';
import type { ContentMessage, PlayerState } from '@/lib/messages';
import { formatTime } from '@/lib/time';

type State =
  | { kind: 'loading' }
  | { kind: 'signed-out' }
  | { kind: 'error'; message: string }
  | { kind: 'no-video' }
  | { kind: 'video'; tabId: number; player: PlayerState; video: Video | null; lists: List[] };

const selectClass =
  'w-full rounded-md border border-zinc-300 bg-white px-2 py-1.5 text-sm outline-none focus:border-red-500 dark:border-zinc-700 dark:bg-zinc-900';

async function load(): Promise<State> {
  try {
    await api.me();
  } catch (err) {
    if (err instanceof ApiError && err.status === 401) return { kind: 'signed-out' };
    return { kind: 'error', message: 'Could not reach the server.' };
  }

  const [tab] = await browser.tabs.query({ active: true, currentWindow: true });
  if (tab?.id === undefined) return { kind: 'no-video' };
  let player: PlayerState | null = null;
  try {
    player = await browser.tabs.sendMessage(tab.id, { type: 'GET_PLAYER_STATE' } satisfies ContentMessage);
  } catch {
    // No content script in this tab (not YouTube, or opened before installing).
  }
  if (!player) return { kind: 'no-video' };

  const [video, lists] = await Promise.all([api.findVideo(player.youtubeId), api.getLists()]);
  return { kind: 'video', tabId: tab.id, player, video, lists };
}

export default function App() {
  const [state, setState] = useState<State>({ kind: 'loading' });

  useEffect(() => {
    load().then(setState, (err: Error) => setState({ kind: 'error', message: err.message }));
  }, []);

  return (
    <div className="p-4">
      <header className="mb-4 flex items-center gap-2">
        <img src="/icon/32.png" alt="" className="size-5" />
        <span className="font-bold tracking-tight">Where Was I</span>
        <a
          href={DASHBOARD_URL}
          target="_blank"
          rel="noreferrer"
          className="ml-auto text-xs text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100"
        >
          Dashboard ↗
        </a>
      </header>
      <Body state={state} setState={setState} />
    </div>
  );
}

function Body({ state, setState }: { state: State; setState: (s: State) => void }) {
  switch (state.kind) {
    case 'loading':
      return <p className="text-zinc-500">Loading…</p>;
    case 'error':
      return <p className="text-red-600 dark:text-red-400">{state.message}</p>;
    case 'signed-out':
      return (
        <div className="space-y-3">
          <p className="text-zinc-600 dark:text-zinc-400">
            Sign in on the dashboard to start tracking your videos.
          </p>
          <a
            href={DASHBOARD_URL}
            target="_blank"
            rel="noreferrer"
            className="block rounded-lg bg-red-600 px-3 py-2 text-center font-semibold text-white hover:bg-red-700"
          >
            Sign in
          </a>
        </div>
      );
    case 'no-video':
      return (
        <p className="text-zinc-600 dark:text-zinc-400">
          Open a YouTube video to track it. If one is already open, reload its tab.
        </p>
      );
    case 'video':
      return <VideoPanel state={state} setState={setState} />;
  }
}

function VideoPanel({
  state,
  setState,
}: {
  state: Extract<State, { kind: 'video' }>;
  setState: (s: State) => void;
}) {
  const { player, video, lists, tabId } = state;
  const [listId, setListId] = useState<number | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const title = video?.title ?? player.title;
  const position = video?.position_seconds ?? player.currentTime;
  const duration = video?.duration_seconds || player.duration;
  const progress = duration > 0 ? Math.min(100, (position / duration) * 100) : 0;

  async function run(action: () => Promise<Video | null>) {
    setBusy(true);
    setError(null);
    try {
      setState({ ...state, video: await action() });
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setBusy(false);
    }
  }

  const track = () =>
    run(async () => {
      const url = `https://www.youtube.com/watch?v=${player.youtubeId}&t=${Math.floor(player.currentTime)}`;
      try {
        await api.createVideo(url, listId);
      } catch (err) {
        if (!(err instanceof ApiError && err.status === 409)) throw err;
      }
      await browser.tabs.sendMessage(tabId, { type: 'TRACKING_CHANGED' } satisfies ContentMessage);
      return api.findVideo(player.youtubeId);
    });

  const update = (patch: VideoPatch) => video && run(() => api.updateVideo(video.id, patch));

  return (
    <div className="space-y-4">
      <div className="flex gap-3">
        <img
          src={`https://i.ytimg.com/vi/${player.youtubeId}/mqdefault.jpg`}
          alt=""
          className="aspect-video w-24 shrink-0 self-start rounded-md object-cover"
        />
        <p className="line-clamp-3 font-semibold leading-snug">{title}</p>
      </div>

      <div className="space-y-1.5">
        <div className="flex items-baseline justify-between font-mono tabular-nums">
          <span className="text-base font-medium">{formatTime(position)}</span>
          {duration > 0 && <span className="text-xs text-zinc-500">{formatTime(duration)}</span>}
        </div>
        <div className="h-1.5 overflow-hidden rounded-full bg-zinc-200 dark:bg-zinc-800">
          <div className="h-full bg-red-600" style={{ width: `${progress}%` }} />
        </div>
      </div>

      {video ? (
        <>
          <p className="text-xs text-zinc-500">
            Progress saves automatically while you watch.
          </p>
          <div className="grid grid-cols-2 gap-2">
            <select
              value={video.status}
              onChange={(e) => update({ status: e.target.value as VideoStatus })}
              disabled={busy}
              aria-label="Status"
              className={selectClass}
            >
              <option value="pending">Pending</option>
              <option value="watching">Watching</option>
              <option value="done">Done</option>
            </select>
            <ListSelect lists={lists} value={video.list_id} onChange={(list_id) => update({ list_id })} />
          </div>
        </>
      ) : (
        <div className="space-y-2">
          <ListSelect lists={lists} value={listId} onChange={setListId} />
          <button
            type="button"
            onClick={track}
            disabled={busy}
            className="w-full rounded-lg bg-red-600 px-3 py-2 font-semibold text-white hover:bg-red-700 disabled:opacity-50"
          >
            {busy ? 'Tracking…' : 'Track this video'}
          </button>
        </div>
      )}

      {error && <p className="text-xs text-red-600 dark:text-red-400">{error}</p>}
    </div>
  );
}

function ListSelect({
  lists,
  value,
  onChange,
}: {
  lists: List[];
  value: number | null;
  onChange: (listId: number | null) => void;
}) {
  return (
    <select
      value={value ?? ''}
      onChange={(e) => onChange(e.target.value ? Number(e.target.value) : null)}
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
  );
}

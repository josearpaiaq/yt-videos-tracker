import { Bookmark, CloudCheck, ExternalLink, Loader2, LogIn, MonitorPlay } from 'lucide-react';
import { useEffect, useState } from 'react';
import {
  api,
  ApiError,
  type List,
  type User,
  type Video,
  type VideoPatch,
  type VideoStatus,
} from '@/lib/api';
import { DASHBOARD_URL } from '@/lib/config';
import { messagesFor, prefersDark, resolveLanguage, type Messages } from '@/lib/i18n';
import type { ContentMessage, PlayerState } from '@/lib/messages';
import { formatTime } from '@/lib/time';

type State =
  | { kind: 'loading' }
  | { kind: 'signed-out' }
  | { kind: 'error' }
  | { kind: 'no-video' }
  | { kind: 'video'; tabId: number; player: PlayerState; video: Video | null; lists: List[] };

const selectClass =
  'w-full rounded-md border border-zinc-300 bg-white px-2 py-1.5 text-sm outline-none focus:border-red-500 dark:border-zinc-700 dark:bg-zinc-900';

async function load(): Promise<{ user: User | null; state: State }> {
  let user: User;
  try {
    user = await api.me();
  } catch (err) {
    const signedOut = err instanceof ApiError && err.status === 401;
    return { user: null, state: { kind: signedOut ? 'signed-out' : 'error' } };
  }

  const [tab] = await browser.tabs.query({ active: true, currentWindow: true });
  if (tab?.id === undefined) return { user, state: { kind: 'no-video' } };
  let player: PlayerState | null = null;
  try {
    player = await browser.tabs.sendMessage(tab.id, {
      type: 'GET_PLAYER_STATE',
    } satisfies ContentMessage);
  } catch {
    // No content script in this tab (not YouTube, or opened before installing).
  }
  if (!player) return { user, state: { kind: 'no-video' } };

  const [video, lists] = await Promise.all([api.findVideo(player.youtubeId), api.getLists()]);
  return { user, state: { kind: 'video', tabId: tab.id, player, video, lists } };
}

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [state, setState] = useState<State>({ kind: 'loading' });
  const t = messagesFor(resolveLanguage(user));

  useEffect(() => {
    load().then(
      (result) => {
        setUser(result.user);
        setState(result.state);
      },
      () => setState({ kind: 'error' }),
    );
  }, []);

  useEffect(() => {
    document.documentElement.classList.toggle('dark', prefersDark(user));
    document.documentElement.lang = resolveLanguage(user);
  }, [user]);

  return (
    <div className="p-4">
      <header className="mb-4 flex items-center gap-2">
        <img src="/icon/32.png" alt="" className="size-5" />
        <span className="font-bold tracking-tight">Where Was I</span>
        <a
          href={DASHBOARD_URL}
          target="_blank"
          rel="noreferrer"
          className="ml-auto inline-flex items-center gap-1 text-xs text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100"
        >
          {t.dashboard}
          <ExternalLink className="size-3" />
        </a>
      </header>
      <Body state={state} setState={setState} t={t} />
    </div>
  );
}

function Body({ state, setState, t }: { state: State; setState: (s: State) => void; t: Messages }) {
  switch (state.kind) {
    case 'loading':
      return (
        <p className="flex items-center gap-2 text-zinc-500">
          <Loader2 className="size-4 animate-spin" />
          {t.loading}
        </p>
      );
    case 'error':
      return <p className="text-red-600 dark:text-red-400">{t.serverUnreachable}</p>;
    case 'signed-out':
      return (
        <div className="space-y-3">
          <p className="text-zinc-600 dark:text-zinc-400">{t.signInPrompt}</p>
          <a
            href={DASHBOARD_URL}
            target="_blank"
            rel="noreferrer"
            className="flex items-center justify-center gap-2 rounded-lg bg-red-600 px-3 py-2 font-semibold text-white hover:bg-red-700"
          >
            <LogIn className="size-4" />
            {t.signIn}
          </a>
        </div>
      );
    case 'no-video':
      return (
        <div className="flex gap-3 text-zinc-600 dark:text-zinc-400">
          <MonitorPlay className="size-5 shrink-0" />
          <p>{t.noVideo}</p>
        </div>
      );
    case 'video':
      return <VideoPanel state={state} setState={setState} t={t} />;
  }
}

function VideoPanel({
  state,
  setState,
  t,
}: {
  state: Extract<State, { kind: 'video' }>;
  setState: (s: State) => void;
  t: Messages;
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
        <p className="line-clamp-3 leading-snug font-semibold">{title}</p>
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
          <p className="flex items-center gap-1.5 text-xs text-zinc-500">
            <CloudCheck className="size-3.5" />
            {t.autosaveHint}
          </p>
          <div className="grid grid-cols-2 gap-2">
            <select
              value={video.status}
              onChange={(e) => update({ status: e.target.value as VideoStatus })}
              disabled={busy}
              aria-label={t.status}
              className={selectClass}
            >
              <option value="pending">{t.pending}</option>
              <option value="watching">{t.watching}</option>
              <option value="done">{t.done}</option>
            </select>
            <ListSelect
              lists={lists}
              value={video.list_id}
              onChange={(list_id) => update({ list_id })}
              t={t}
            />
          </div>
        </>
      ) : (
        <div className="space-y-2">
          <ListSelect lists={lists} value={listId} onChange={setListId} t={t} />
          <button
            type="button"
            onClick={track}
            disabled={busy}
            className="flex w-full items-center justify-center gap-2 rounded-lg bg-red-600 px-3 py-2 font-semibold text-white hover:bg-red-700 disabled:opacity-50"
          >
            {busy ? <Loader2 className="size-4 animate-spin" /> : <Bookmark className="size-4" />}
            {busy ? t.tracking : t.track}
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
  t,
}: {
  lists: List[];
  value: number | null;
  onChange: (listId: number | null) => void;
  t: Messages;
}) {
  return (
    <select
      value={value ?? ''}
      onChange={(e) => onChange(e.target.value ? Number(e.target.value) : null)}
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
  );
}

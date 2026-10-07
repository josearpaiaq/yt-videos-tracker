import { useState } from 'react';
import { api, ApiError, type Video, type VideoPatch } from '@/lib/api';
import type { Messages } from '@/lib/i18n';
import type { ContentMessage } from '@/lib/messages';
import { Progress } from '../components/Progress';
import { TrackedControls } from '../components/TrackedControls';
import { TrackForm } from '../components/TrackForm';
import type { PopupState, VideoState } from '../load';

/** The current YouTube video: track it, or manage it if it's already tracked. */
export function VideoView({
  state,
  onChange,
  t,
}: {
  state: VideoState;
  onChange: (state: PopupState) => void;
  t: Messages;
}) {
  const { player, video, lists, tabId } = state;
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function run(action: () => Promise<Video | null>) {
    setBusy(true);
    setError(null);
    try {
      onChange({ ...state, video: await action() });
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setBusy(false);
    }
  }

  const track = (listId: number | null) =>
    run(async () => {
      const url = `https://www.youtube.com/watch?v=${player.youtubeId}&t=${Math.floor(player.currentTime)}`;
      try {
        await api.createVideo(url, listId);
      } catch (err) {
        if (!(err instanceof ApiError && err.status === 409)) throw err;
      }
      // Tell the content script so it starts autosaving right away.
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
        <p className="line-clamp-3 leading-snug font-semibold">{video?.title ?? player.title}</p>
      </div>

      <Progress
        position={video?.position_seconds ?? player.currentTime}
        duration={video?.duration_seconds || player.duration}
      />

      {video ? (
        <TrackedControls video={video} lists={lists} busy={busy} onUpdate={update} t={t} />
      ) : (
        <TrackForm lists={lists} busy={busy} onTrack={track} t={t} />
      )}

      {error && <p className="text-xs text-red-600 dark:text-red-400">{error}</p>}
    </div>
  );
}

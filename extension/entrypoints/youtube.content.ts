import type { Video, VideoPatch } from '@/lib/api';
import { sendToBackground, type ContentMessage, type PlayerState } from '@/lib/messages';
import { formatTime } from '@/lib/time';

const SAVE_INTERVAL_MS = 15_000;

export default defineContentScript({
  matches: ['*://www.youtube.com/*'],
  main(ctx) {
    let tracker: Tracker | null = null;

    // YouTube is a SPA: watch pages change without a full reload.
    const sync = (force = false) => {
      const id = currentVideoId();
      if (!force && tracker?.youtubeId === id) return;
      tracker?.stop();
      tracker = id ? new Tracker(id) : null;
    };
    const onNavigateStart = () => tracker?.save();
    const onNavigateFinish = () => sync();
    const onHide = () => tracker?.save();
    const onVisibility = () => document.visibilityState === 'hidden' && tracker?.save();

    const onMessage = (
      message: ContentMessage,
      _sender: unknown,
      sendResponse: (state: PlayerState | null) => void,
    ) => {
      if (message.type === 'GET_PLAYER_STATE') sendResponse(playerState());
      if (message.type === 'TRACKING_CHANGED') sync(true);
    };

    document.addEventListener('yt-navigate-start', onNavigateStart);
    document.addEventListener('yt-navigate-finish', onNavigateFinish);
    window.addEventListener('pagehide', onHide);
    document.addEventListener('visibilitychange', onVisibility);
    browser.runtime.onMessage.addListener(onMessage);
    sync();

    ctx.onInvalidated(() => {
      tracker?.stop();
      document.removeEventListener('yt-navigate-start', onNavigateStart);
      document.removeEventListener('yt-navigate-finish', onNavigateFinish);
      window.removeEventListener('pagehide', onHide);
      document.removeEventListener('visibilitychange', onVisibility);
      browser.runtime.onMessage.removeListener(onMessage);
    });
  },
});

/** Follows one tracked video: resumes it, autosaves progress and marks it done at the end. */
class Tracker {
  private video: Video | null = null;
  private player: HTMLVideoElement | null = null;
  private ready = false;
  private stopped = false;
  private lastSaved = -1;
  private interval: ReturnType<typeof setInterval> | undefined;

  constructor(readonly youtubeId: string) {
    void this.start();
  }

  private async start() {
    try {
      this.video = await sendToBackground({ type: 'FIND_VIDEO', youtubeId: this.youtubeId });
    } catch {
      return; // signed out or server unreachable: stay passive
    }
    if (!this.video || this.stopped) return;

    const player = await waitFor(
      () => (this.isPlayingThisVideo() ? findPlayer() : null),
      () => this.stopped,
    );
    if (!player) return;

    this.player = player;
    this.lastSaved = this.video.position_seconds;
    this.maybeResume();
    this.ready = true;

    player.addEventListener('pause', this.save);
    player.addEventListener('ended', this.markDone);
    this.interval = setInterval(() => !player.paused && this.save(), SAVE_INTERVAL_MS);
  }

  stop() {
    this.stopped = true;
    clearInterval(this.interval);
    this.player?.removeEventListener('pause', this.save);
    this.player?.removeEventListener('ended', this.markDone);
  }

  save = () => {
    if (!this.ready || !this.player || !this.isPlayingThisVideo()) return;
    const seconds = Math.floor(this.player.currentTime);
    if (Math.abs(seconds - this.lastSaved) < 2) return;
    this.lastSaved = seconds;
    void this.update({ position_seconds: seconds });
  };

  private markDone = () => {
    if (!this.ready || !this.player || !this.isPlayingThisVideo()) return;
    this.lastSaved = Math.floor(this.player.duration);
    void this.update({ position_seconds: this.lastSaved, status: 'done' });
  };

  private async update(patch: VideoPatch) {
    if (!this.video) return;
    try {
      this.video = await sendToBackground({ type: 'UPDATE_VIDEO', id: this.video.id, patch });
    } catch (err) {
      console.warn('[Where Was I] could not save progress', err);
    }
  }

  private maybeResume() {
    const video = this.video;
    const player = this.player;
    if (!video || !player || video.status === 'done') return;

    const position = video.position_seconds;
    const nearEnd = video.duration_seconds > 0 && position >= video.duration_seconds - 5;
    // Only jump forward: YouTube may already have resumed further along (its
    // own links add &t= for partially watched videos). Undo covers the rest.
    if (position < 5 || nearEnd || player.currentTime >= position - 3) return;

    const before = player.currentTime;
    player.currentTime = position;
    showToast(`Resumed at ${formatTime(position)}`, {
      label: 'Undo',
      onClick: () => (player.currentTime = before),
    });
  }

  /** True when the page shows this video's own media (not an ad, not the previous video). */
  private isPlayingThisVideo() {
    const player = findPlayer();
    if (!player || currentVideoId() !== this.youtubeId || isAdShowing() || player.readyState < 1) {
      return false;
    }
    const expected = this.video?.duration_seconds ?? 0;
    return expected === 0 || Math.abs(player.duration - expected) <= 3;
  }
}

function currentVideoId(): string | null {
  if (location.pathname !== '/watch') return null;
  return new URLSearchParams(location.search).get('v');
}

function findPlayer(): HTMLVideoElement | null {
  return document.querySelector<HTMLVideoElement>('#movie_player video');
}

function isAdShowing(): boolean {
  return document.querySelector('#movie_player')?.classList.contains('ad-showing') ?? false;
}

function playerState(): PlayerState | null {
  const youtubeId = currentVideoId();
  const player = findPlayer();
  if (!youtubeId || !player) return null;
  return {
    youtubeId,
    title: document.title.replace(/^\(\d+\)\s*/, '').replace(/ - YouTube$/, ''),
    currentTime: isAdShowing() ? 0 : player.currentTime,
    duration: isAdShowing() ? 0 : player.duration,
  };
}

/** Polls until check() returns a value or the wait is cancelled (e.g. by navigating away). */
function waitFor<T>(check: () => T | null, cancelled: () => boolean): Promise<T | null> {
  return new Promise((resolve) => {
    const timer = setInterval(() => {
      const value = check();
      if (value || cancelled()) {
        clearInterval(timer);
        resolve(cancelled() ? null : value);
      }
    }, 500);
  });
}

let toastHost: HTMLElement | null = null;

function showToast(text: string, action: { label: string; onClick: () => void }) {
  toastHost?.remove();
  const host = document.createElement('div');
  toastHost = host;
  const root = host.attachShadow({ mode: 'closed' });
  root.innerHTML = `
    <style>
      .toast { position: fixed; left: 24px; bottom: 24px; z-index: 2147483647;
        display: flex; align-items: center; gap: 16px; padding: 12px 16px;
        background: #18181b; color: #fafafa; border-radius: 10px;
        font: 500 14px/1.2 system-ui, sans-serif; box-shadow: 0 8px 24px rgb(0 0 0 / .35); }
      .dot { width: 8px; height: 8px; border-radius: 50%; background: #dc2626; }
      button { all: unset; cursor: pointer; color: #fca5a5; font-weight: 600; }
      button:hover { text-decoration: underline; }
    </style>
    <div class="toast" role="status"><span class="dot"></span><span></span><button></button></div>`;
  root.querySelector('span:not(.dot)')!.textContent = text;
  const button = root.querySelector('button')!;
  button.textContent = action.label;
  button.addEventListener('click', () => {
    action.onClick();
    host.remove();
  });
  document.body.append(host);
  setTimeout(() => host.remove(), 6000);
}

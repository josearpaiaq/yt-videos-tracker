import type { Video, VideoPatch } from '@/lib/api';
import { messagesFor, prefersDark, resolveLanguage } from '@/lib/i18n';
import { sendToBackground } from '@/lib/messages';
import { formatTime } from '@/lib/time';
import { currentVideoId, findPlayer, isAdShowing, waitFor } from './player';
import { showToast } from './toast';

const SAVE_INTERVAL_MS = 15_000;

/** Follows one tracked video: resumes it, autosaves progress and marks it done at the end. */
export class Tracker {
  // undefined until the lookup finishes, then the tracked record or null.
  private video: Video | null | undefined = undefined;
  private player: HTMLVideoElement | null = null;
  private ready = false;
  private stopped = false;
  private lastSaved = -1;
  private interval: ReturnType<typeof setInterval> | undefined;

  constructor(readonly youtubeId: string) {
    void this.start();
  }

  /** Latest known record (kept fresh by autosave), so the popup can render without the API. */
  get trackedVideo(): Video | null | undefined {
    return this.video;
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
    void this.showResumedToast(position, () => (player.currentTime = before));
  }

  /** Shows the "Resumed at" toast in the user's language and theme. */
  private async showResumedToast(position: number, undo: () => void) {
    const user = await sendToBackground({ type: 'GET_ME' }).catch(() => null);
    if (this.stopped) return;
    const t = messagesFor(resolveLanguage(user));
    showToast(t.resumedAt(formatTime(position)), { label: t.undo, onClick: undo }, prefersDark(user));
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

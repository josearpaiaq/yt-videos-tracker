// Helpers to read YouTube's watch page and player.
import type { PlayerState } from '@/lib/messages';

export function currentVideoId(): string | null {
  if (location.pathname !== '/watch') return null;
  return new URLSearchParams(location.search).get('v');
}

export function findPlayer(): HTMLVideoElement | null {
  return document.querySelector<HTMLVideoElement>('#movie_player video');
}

export function isAdShowing(): boolean {
  return document.querySelector('#movie_player')?.classList.contains('ad-showing') ?? false;
}

export function playerState(): PlayerState | null {
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
export function waitFor<T>(check: () => T | null, cancelled: () => boolean): Promise<T | null> {
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

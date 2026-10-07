import { api, ApiError, type List, type User, type Video } from '@/lib/api';
import { clearCache, readCache, writeCache } from '@/lib/cache';
import type { ContentMessage, PlayerState } from '@/lib/messages';

export type PopupState =
  | { kind: 'loading' }
  | { kind: 'signed-out' }
  | { kind: 'error' }
  | { kind: 'no-video' }
  | { kind: 'video'; tabId: number; player: PlayerState; video: Video | null; lists: List[] };

export type VideoState = Extract<PopupState, { kind: 'video' }>;

export interface Loaded {
  user: User | null;
  state: PopupState;
}

/** Asks the active tab's content script for the player and the tracked video it already knows. */
async function currentPlayer(): Promise<{ tabId: number; player: PlayerState } | null> {
  const [tab] = await browser.tabs.query({ active: true, currentWindow: true });
  if (tab?.id === undefined) return null;
  try {
    const player: PlayerState | null = await browser.tabs.sendMessage(tab.id, {
      type: 'GET_PLAYER_STATE',
    } satisfies ContentMessage);
    return player ? { tabId: tab.id, player } : null;
  } catch {
    return null; // No content script in this tab (not YouTube, or opened before installing).
  }
}

/**
 * Instant first paint from local data only: the cached user and lists plus what the content
 * script knows. Returns null when there isn't enough to render without guessing.
 */
export async function loadCached(): Promise<Loaded | null> {
  const [cache, current] = await Promise.all([readCache(), currentPlayer()]);
  if (!current) return { user: cache?.user ?? null, state: { kind: 'no-video' } };
  const { tabId, player } = current;
  const tracked = player.tracked;
  if (!cache || tracked === undefined) return null;
  return {
    user: cache.user,
    state: { kind: 'video', tabId, player, video: tracked, lists: cache.lists },
  };
}

/** Authoritative state from the API; refreshes the cache for the next time the popup opens. */
export async function loadFresh(): Promise<Loaded> {
  let user: User;
  try {
    user = await api.me();
  } catch (err) {
    if (err instanceof ApiError && err.status === 401) {
      await clearCache();
      return { user: null, state: { kind: 'signed-out' } };
    }
    return { user: null, state: { kind: 'error' } };
  }

  const [current, lists] = await Promise.all([currentPlayer(), api.getLists()]);
  await writeCache({ user, lists });
  if (!current) return { user, state: { kind: 'no-video' } };

  const { tabId, player } = current;
  const video = await api.findVideo(player.youtubeId);
  return { user, state: { kind: 'video', tabId, player, video, lists } };
}

import { api, ApiError, type List, type User, type Video } from '@/lib/api';
import type { ContentMessage, PlayerState } from '@/lib/messages';

export type PopupState =
  | { kind: 'loading' }
  | { kind: 'signed-out' }
  | { kind: 'error' }
  | { kind: 'no-video' }
  | { kind: 'video'; tabId: number; player: PlayerState; video: Video | null; lists: List[] };

export type VideoState = Extract<PopupState, { kind: 'video' }>;

/** Works out what the popup should show: session, current tab's video, and whether it's tracked. */
export async function load(): Promise<{ user: User | null; state: PopupState }> {
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

import type { User, Video, VideoPatch } from './api';

/** Content script → background. Content scripts can't call the API directly (CORS). */
export type BackgroundMessage =
  | { type: 'GET_ME' }
  | { type: 'FIND_VIDEO'; youtubeId: string }
  | { type: 'UPDATE_VIDEO'; id: number; patch: VideoPatch };

/** What each background message resolves to. */
export interface BackgroundResults {
  GET_ME: User;
  FIND_VIDEO: Video | null;
  UPDATE_VIDEO: Video;
}

export type BackgroundResponse = { ok: true; data: unknown } | { ok: false; error: string };

/** Popup → content script. */
export type ContentMessage = { type: 'GET_PLAYER_STATE' } | { type: 'TRACKING_CHANGED' };

export interface PlayerState {
  youtubeId: string;
  title: string;
  currentTime: number;
  duration: number;
}

export async function sendToBackground<M extends BackgroundMessage>(
  message: M,
): Promise<BackgroundResults[M['type']]> {
  const res: BackgroundResponse = await browser.runtime.sendMessage(message);
  if (!res.ok) throw new Error(res.error);
  return res.data as BackgroundResults[M['type']];
}

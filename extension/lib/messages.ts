import type { Video, VideoPatch } from './api';

/** Content script → background. Content scripts can't call the API directly (CORS). */
export type BackgroundMessage =
  | { type: 'FIND_VIDEO'; youtubeId: string }
  | { type: 'UPDATE_VIDEO'; id: number; patch: VideoPatch };

export type BackgroundResponse =
  | { ok: true; data: Video | null }
  | { ok: false; error: string };

/** Popup → content script. */
export type ContentMessage = { type: 'GET_PLAYER_STATE' } | { type: 'TRACKING_CHANGED' };

export interface PlayerState {
  youtubeId: string;
  title: string;
  currentTime: number;
  duration: number;
}

export async function sendToBackground(message: BackgroundMessage): Promise<Video | null> {
  const res: BackgroundResponse = await browser.runtime.sendMessage(message);
  if (!res.ok) throw new Error(res.error);
  return res.data;
}

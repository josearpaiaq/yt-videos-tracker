import type { List, User } from './api';

/** Last known session data, so the popup can render before the API answers. */
export interface PopupCache {
  user: User;
  lists: List[];
}

const KEY = 'popupCache';

export async function readCache(): Promise<PopupCache | null> {
  try {
    const stored = await browser.storage.local.get(KEY);
    return (stored[KEY] as PopupCache | undefined) ?? null;
  } catch {
    return null;
  }
}

export function writeCache(cache: PopupCache) {
  return browser.storage.local.set({ [KEY]: cache });
}

export function clearCache() {
  return browser.storage.local.remove(KEY);
}

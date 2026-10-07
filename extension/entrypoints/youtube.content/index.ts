import type { ContentMessage, PlayerState } from '@/lib/messages';
import { currentVideoId, playerState } from './player';
import { Tracker } from './tracker';

// Wires YouTube's navigation and page lifecycle to a Tracker for the current video.
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

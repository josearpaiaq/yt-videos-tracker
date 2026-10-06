import { api } from '@/lib/api';
import type { BackgroundMessage, BackgroundResponse } from '@/lib/messages';

function handle(message: BackgroundMessage) {
  switch (message.type) {
    case 'FIND_VIDEO':
      return api.findVideo(message.youtubeId);
    case 'UPDATE_VIDEO':
      return api.updateVideo(message.id, message.patch);
  }
}

export default defineBackground(() => {
  browser.runtime.onMessage.addListener((message: BackgroundMessage, _sender, sendResponse) => {
    handle(message).then(
      (data) => sendResponse({ ok: true, data } satisfies BackgroundResponse),
      (err: Error) => sendResponse({ ok: false, error: err.message } satisfies BackgroundResponse),
    );
    return true; // keep the channel open for the async response
  });
});

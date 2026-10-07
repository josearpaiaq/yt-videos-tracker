import { Bookmark, Loader2 } from 'lucide-react';
import { useState } from 'react';
import type { List } from '@/lib/api';
import type { Messages } from '@/lib/i18n';
import { ListSelect } from './ListSelect';

/** For an untracked video: pick a list and start tracking. */
export function TrackForm({
  lists,
  busy,
  onTrack,
  t,
}: {
  lists: List[];
  busy: boolean;
  onTrack: (listId: number | null) => void;
  t: Messages;
}) {
  const [listId, setListId] = useState<number | null>(null);
  return (
    <div className="space-y-2">
      <ListSelect lists={lists} value={listId} onChange={setListId} t={t} />
      <button
        type="button"
        onClick={() => onTrack(listId)}
        disabled={busy}
        className="flex w-full items-center justify-center gap-2 rounded-lg bg-red-600 px-3 py-2 font-semibold text-white hover:bg-red-700 disabled:opacity-50"
      >
        {busy ? <Loader2 className="size-4 animate-spin" /> : <Bookmark className="size-4" />}
        {busy ? t.tracking : t.track}
      </button>
    </div>
  );
}

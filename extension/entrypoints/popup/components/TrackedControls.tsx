import { CloudCheck } from 'lucide-react';
import type { List, Video, VideoPatch, VideoStatus } from '@/lib/api';
import type { Messages } from '@/lib/i18n';
import { ListSelect } from './ListSelect';
import { selectClass } from './styles';

/** For a tracked video: change its status and list. */
export function TrackedControls({
  video,
  lists,
  busy,
  onUpdate,
  t,
}: {
  video: Video;
  lists: List[];
  busy: boolean;
  onUpdate: (patch: VideoPatch) => void;
  t: Messages;
}) {
  return (
    <>
      <p className="flex items-center gap-1.5 text-xs text-zinc-500">
        <CloudCheck className="size-3.5" />
        {t.autosaveHint}
      </p>
      <div className="grid grid-cols-2 gap-2">
        <select
          value={video.status}
          onChange={(e) => onUpdate({ status: e.target.value as VideoStatus })}
          disabled={busy}
          aria-label={t.status}
          className={selectClass}
        >
          <option value="pending">{t.pending}</option>
          <option value="watching">{t.watching}</option>
          <option value="done">{t.done}</option>
        </select>
        <ListSelect
          lists={lists}
          value={video.list_id}
          onChange={(list_id) => onUpdate({ list_id })}
          t={t}
        />
      </div>
    </>
  );
}

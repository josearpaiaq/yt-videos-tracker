import type { List } from '@/lib/api';
import type { Messages } from '@/lib/i18n';
import { selectClass } from './styles';

export function ListSelect({
  lists,
  value,
  onChange,
  t,
}: {
  lists: List[];
  value: number | null;
  onChange: (listId: number | null) => void;
  t: Messages;
}) {
  return (
    <select
      value={value ?? ''}
      onChange={(e) => onChange(e.target.value ? Number(e.target.value) : null)}
      aria-label={t.list}
      className={selectClass}
    >
      <option value="">{t.noList}</option>
      {lists.map((l) => (
        <option key={l.id} value={l.id}>
          {l.name}
        </option>
      ))}
    </select>
  );
}

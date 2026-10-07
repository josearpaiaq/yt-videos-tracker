import type { Messages } from '@/lib/i18n';

export function ErrorView({ t }: { t: Messages }) {
  return <p className="text-red-600 dark:text-red-400">{t.serverUnreachable}</p>;
}

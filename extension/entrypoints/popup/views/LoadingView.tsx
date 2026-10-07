import { Loader2 } from 'lucide-react';
import type { Messages } from '@/lib/i18n';

export function LoadingView({ t }: { t: Messages }) {
  return (
    <p className="flex items-center gap-2 text-zinc-500">
      <Loader2 className="size-4 animate-spin" />
      {t.loading}
    </p>
  );
}

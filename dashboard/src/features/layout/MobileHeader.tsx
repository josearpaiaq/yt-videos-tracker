import { Menu } from 'lucide-react'
import { useI18n } from '@/i18n'
import { Brand } from './Brand'

export function MobileHeader({ onOpenMenu }: { onOpenMenu: () => void }) {
  const { t } = useI18n()
  return (
    <header className="mb-4 flex items-center justify-between lg:hidden">
      <Brand />
      <button
        type="button"
        onClick={onOpenMenu}
        aria-label={t.openMenu}
        className="rounded-lg p-2 hover:bg-zinc-200 dark:hover:bg-zinc-800"
      >
        <Menu className="size-5" />
      </button>
    </header>
  )
}

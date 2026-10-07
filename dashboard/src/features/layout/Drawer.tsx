import { X } from 'lucide-react'
import { useEffect, type ReactNode } from 'react'
import { useI18n } from '@/i18n'
import { Brand } from './Brand'

/** Slide-in panel for the sidebar on small screens. Closes on backdrop click or Escape. */
export function Drawer({ onClose, children }: { onClose: () => void; children: ReactNode }) {
  const { t } = useI18n()

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose()
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [onClose])

  return (
    <div className="fixed inset-0 z-40 lg:hidden">
      <button
        type="button"
        aria-label={t.closeMenu}
        onClick={onClose}
        className="absolute inset-0 bg-black/50 motion-safe:animate-fade-in"
      />
      <div className="absolute inset-y-0 left-0 w-72 max-w-[85vw] overflow-y-auto bg-zinc-50 p-4 shadow-xl motion-safe:animate-fade-in dark:bg-zinc-950">
        <div className="mb-4 flex items-center justify-between px-3">
          <Brand />
          <button
            type="button"
            onClick={onClose}
            aria-label={t.closeMenu}
            className="rounded-lg p-1.5 hover:bg-zinc-200 dark:hover:bg-zinc-800"
          >
            <X className="size-5" />
          </button>
        </div>
        {children}
      </div>
    </div>
  )
}

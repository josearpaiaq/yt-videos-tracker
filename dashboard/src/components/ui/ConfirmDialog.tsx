import { useCallback, useRef, useState, type ReactNode } from 'react'
import { useI18n } from '@/i18n'
import { ConfirmContext, type Confirm, type ConfirmOptions } from './confirm'

/** Provides `useConfirm()`, an awaitable replacement for window.confirm built on <dialog>. */
export function ConfirmProvider({ children }: { children: ReactNode }) {
  const { t } = useI18n()
  const dialogRef = useRef<HTMLDialogElement>(null)
  const resolveRef = useRef<(value: boolean) => void>(() => {})
  const [options, setOptions] = useState<ConfirmOptions | null>(null)

  const confirm = useCallback<Confirm>((opts) => {
    setOptions(opts)
    dialogRef.current?.showModal()
    return new Promise((resolve) => (resolveRef.current = resolve))
  }, [])

  const close = (value: boolean) => {
    resolveRef.current(value)
    resolveRef.current = () => {}
    dialogRef.current?.close()
  }

  return (
    <ConfirmContext.Provider value={confirm}>
      {children}
      <dialog
        ref={dialogRef}
        onClose={() => close(false)}
        onClick={(e) => e.target === dialogRef.current && close(false)}
        className="m-auto w-[calc(100%-2rem)] max-w-sm rounded-xl border border-zinc-200 bg-white p-0 text-zinc-900 shadow-xl backdrop:bg-black/50 open:animate-fade-in dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-100"
      >
        {options && (
          <div className="p-5">
            <h2 className="font-semibold">{options.title}</h2>
            {options.description && (
              <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">{options.description}</p>
            )}
            <div className="mt-5 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => close(false)}
                className="rounded-lg px-3 py-1.5 text-sm font-medium hover:bg-zinc-100 dark:hover:bg-zinc-800"
              >
                {t.cancel}
              </button>
              <button
                type="button"
                autoFocus
                onClick={() => close(true)}
                className="rounded-lg bg-red-600 px-3 py-1.5 text-sm font-semibold text-white hover:bg-red-700"
              >
                {options.confirmLabel}
              </button>
            </div>
          </div>
        )}
      </dialog>
    </ConfirmContext.Provider>
  )
}

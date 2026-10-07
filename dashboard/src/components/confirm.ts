import { createContext, useContext } from 'react'

export interface ConfirmOptions {
  title: string
  description?: string
  confirmLabel: string
}

export type Confirm = (options: ConfirmOptions) => Promise<boolean>

export const ConfirmContext = createContext<Confirm>(() => Promise.resolve(false))

/** Awaitable replacement for window.confirm; requires <ConfirmProvider>. */
export const useConfirm = () => useContext(ConfirmContext)

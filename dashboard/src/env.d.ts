interface ImportMetaEnv {
  readonly VITE_GOOGLE_CLIENT_ID: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}

// Minimal typing for the Google Identity Services script loaded in index.html.
interface Window {
  google?: {
    accounts: {
      id: {
        initialize(config: {
          client_id: string
          callback: (response: { credential: string }) => void
        }): void
        renderButton(element: HTMLElement, options: Record<string, unknown>): void
      }
    }
  }
}

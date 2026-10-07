import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { setUnauthorizedHandler } from '@/lib/api'
import './index.css'
import App from './App.tsx'
import { keys } from '@/lib/queries'

const queryClient = new QueryClient()
setUnauthorizedHandler(() => queryClient.setQueryData(keys.me, null))

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <App />
    </QueryClientProvider>
  </StrictMode>,
)

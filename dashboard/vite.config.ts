import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { fileURLToPath } from 'node:url'
import { defineConfig, loadEnv } from 'vite'

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  // Empty prefix: PORT and API_URL configure the dev server and never reach the client bundle.
  const env = loadEnv(mode, process.cwd(), '')
  const server = {
    port: Number(env.PORT || 5173),
    strictPort: true,
    proxy: { '/api': env.API_URL || 'http://localhost:8080' },
  }

  return {
    plugins: [react(), tailwindcss()],
    resolve: {
      alias: { '@': fileURLToPath(new URL('./src', import.meta.url)) },
    },
    server,
    preview: server,
  }
})

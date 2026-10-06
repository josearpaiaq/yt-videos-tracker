import tailwindcss from '@tailwindcss/vite';
import { defineConfig } from 'wxt';

const apiUrl = process.env.WXT_API_URL ?? 'http://localhost:8080';

// See https://wxt.dev/api/config.html
export default defineConfig({
  modules: ['@wxt-dev/module-react'],
  vite: () => ({ plugins: [tailwindcss()] }),
  manifest: {
    name: 'Where Was I',
    description: 'Remembers the minute you are at in YouTube videos and resumes from there.',
    // Host access to the API lets the popup and background send the session cookies.
    host_permissions: [`${apiUrl}/*`],
  },
});

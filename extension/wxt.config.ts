import tailwindcss from '@tailwindcss/vite';
import { defineConfig } from 'wxt';

// See https://wxt.dev/api/config.html
export default defineConfig({
  modules: ['@wxt-dev/module-react'],
  vite: () => ({ plugins: [tailwindcss()] }),
  // A function so it runs after WXT has loaded the .env files into process.env.
  manifest: () => ({
    name: 'Where Was I',
    description: 'Remembers the minute you are at in YouTube videos and resumes from there.',
    // Host access to the API lets the popup and background send the session cookies.
    // Caches the user and lists so the popup opens instantly.
    permissions: ['storage'],
    host_permissions: [`${process.env.WXT_API_URL ?? 'http://localhost:8080'}/*`],
  }),
});

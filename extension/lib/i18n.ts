import type { User } from './api';

export type Language = 'en' | 'es';

const en = {
  dashboard: 'Dashboard',
  loading: 'Loading…',
  serverUnreachable: 'Could not reach the server.',
  signInPrompt: 'Sign in on the dashboard to start tracking your videos.',
  signIn: 'Sign in',
  noVideo: 'Open a YouTube video to track it. If one is already open, reload its tab.',
  autosaveHint: 'Progress saves automatically while you watch.',
  status: 'Status',
  pending: 'Pending',
  watching: 'Watching',
  done: 'Done',
  list: 'List',
  noList: 'No list',
  track: 'Track this video',
  tracking: 'Tracking…',
  resumedAt: (time: string) => `Resumed at ${time}`,
  undo: 'Undo',
};

export type Messages = typeof en;

const es: Messages = {
  dashboard: 'Dashboard',
  loading: 'Cargando…',
  serverUnreachable: 'No se pudo conectar con el servidor.',
  signInPrompt: 'Inicia sesión en el dashboard para empezar a registrar tus videos.',
  signIn: 'Iniciar sesión',
  noVideo: 'Abre un video de YouTube para seguirlo. Si ya hay uno abierto, recarga su pestaña.',
  autosaveHint: 'El progreso se guarda solo mientras ves el video.',
  status: 'Estado',
  pending: 'Pendiente',
  watching: 'Viendo',
  done: 'Visto',
  list: 'Lista',
  noList: 'Sin lista',
  track: 'Seguir este video',
  tracking: 'Siguiendo…',
  resumedAt: (time) => `Retomado en ${time}`,
  undo: 'Deshacer',
};

/** The user's language, or the browser's when unset or signed out. */
export function resolveLanguage(user: Pick<User, 'language'> | null): Language {
  if (user?.language) return user.language;
  return navigator.language.toLowerCase().startsWith('es') ? 'es' : 'en';
}

export function messagesFor(language: Language): Messages {
  return language === 'es' ? es : en;
}

/** Whether to render dark, following the OS when the theme is "system" or unknown. */
export function prefersDark(user: Pick<User, 'theme'> | null): boolean {
  const theme = user?.theme ?? 'system';
  return theme === 'dark' || (theme === 'system' && matchMedia('(prefers-color-scheme: dark)').matches);
}

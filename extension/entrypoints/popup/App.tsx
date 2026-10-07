import { useEffect, useRef, useState } from 'react';
import type { User } from '@/lib/api';
import { messagesFor, prefersDark, resolveLanguage } from '@/lib/i18n';
import { Header } from './components/Header';
import { loadCached, loadFresh, type PopupState } from './load';
import { ErrorView } from './views/ErrorView';
import { LoadingView } from './views/LoadingView';
import { NoVideoView } from './views/NoVideoView';
import { SignedOutView } from './views/SignedOutView';
import { VideoView } from './views/VideoView';

/**
 * Stale-while-revalidate: paints from the cache and the content script right away,
 * then reconciles with the API, without overwriting anything the user changed meanwhile.
 */
export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [state, setState] = useState<PopupState>({ kind: 'loading' });
  const [syncing, setSyncing] = useState(true);
  const actions = useRef(0);
  const t = messagesFor(resolveLanguage(user));

  useEffect(() => {
    let freshDone = false;
    const actionsAtStart = actions.current;

    loadCached().then((cached) => {
      if (!cached || freshDone || actions.current !== actionsAtStart) return;
      setUser(cached.user);
      setState(cached.state);
    });

    loadFresh()
      .then((fresh) => {
        freshDone = true;
        setUser(fresh.user);
        // A track/update made while loading already returned newer data; keep it.
        if (actions.current !== actionsAtStart) return;
        // If the API is unreachable, keep showing the cached data rather than an error.
        setState((current) =>
          fresh.state.kind === 'error' && current.kind !== 'loading' ? current : fresh.state,
        );
      })
      .catch(() => {
        freshDone = true;
        setState((current) => (current.kind === 'loading' ? { kind: 'error' } : current));
      })
      .finally(() => setSyncing(false));
  }, []);

  useEffect(() => {
    document.documentElement.classList.toggle('dark', prefersDark(user));
    document.documentElement.lang = resolveLanguage(user);
  }, [user]);

  const onUserAction = (next: PopupState) => {
    actions.current++;
    setState(next);
  };

  return (
    <div className="p-4">
      <Header t={t} syncing={syncing && state.kind !== 'loading'} />
      {state.kind === 'loading' && <LoadingView t={t} />}
      {state.kind === 'error' && <ErrorView t={t} />}
      {state.kind === 'signed-out' && <SignedOutView t={t} />}
      {state.kind === 'no-video' && <NoVideoView t={t} />}
      {state.kind === 'video' && <VideoView state={state} onChange={onUserAction} t={t} />}
    </div>
  );
}

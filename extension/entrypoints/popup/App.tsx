import { useEffect, useState } from 'react';
import type { User } from '@/lib/api';
import { messagesFor, prefersDark, resolveLanguage } from '@/lib/i18n';
import { Header } from './components/Header';
import { load, type PopupState } from './load';
import { ErrorView } from './views/ErrorView';
import { LoadingView } from './views/LoadingView';
import { NoVideoView } from './views/NoVideoView';
import { SignedOutView } from './views/SignedOutView';
import { VideoView } from './views/VideoView';

/** Loads the popup state, applies the user's language and theme, and picks the view. */
export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [state, setState] = useState<PopupState>({ kind: 'loading' });
  const t = messagesFor(resolveLanguage(user));

  useEffect(() => {
    load().then(
      (result) => {
        setUser(result.user);
        setState(result.state);
      },
      () => setState({ kind: 'error' }),
    );
  }, []);

  useEffect(() => {
    document.documentElement.classList.toggle('dark', prefersDark(user));
    document.documentElement.lang = resolveLanguage(user);
  }, [user]);

  return (
    <div className="p-4">
      <Header t={t} />
      {state.kind === 'loading' && <LoadingView t={t} />}
      {state.kind === 'error' && <ErrorView t={t} />}
      {state.kind === 'signed-out' && <SignedOutView t={t} />}
      {state.kind === 'no-video' && <NoVideoView t={t} />}
      {state.kind === 'video' && <VideoView state={state} onChange={setState} t={t} />}
    </div>
  );
}

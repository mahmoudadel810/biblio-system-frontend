import { useEffect, useState } from 'react';

interface InstallEvent extends Event { prompt: () => Promise<void>; userChoice: Promise<{ outcome: string }> }

// Offers the browser's install prompt when it is available (Chrome, Edge, Android). Safari has no such event,
// so nothing is shown there; people use Share, Add to Home Screen.
export function useInstall(): { canInstall: boolean; install: () => Promise<void> } {
  const [ev, setEv] = useState<InstallEvent | null>(null);
  useEffect(() => {
    const onPrompt = (e: Event) => { e.preventDefault(); setEv(e as InstallEvent); };
    const onInstalled = () => setEv(null);
    window.addEventListener('beforeinstallprompt', onPrompt);
    window.addEventListener('appinstalled', onInstalled);
    return () => { window.removeEventListener('beforeinstallprompt', onPrompt); window.removeEventListener('appinstalled', onInstalled); };
  }, []);
  return {
    canInstall: !!ev,
    install: async () => { if (!ev) return; await ev.prompt(); await ev.userChoice; setEv(null); },
  };
}

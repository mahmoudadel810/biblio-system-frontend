import { useEffect, useState } from 'react';
import { api } from '../api/client';

const API_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:8080';
export const NOTIF_CHANGED = 'biblio:notifications-changed';

// Live unread count. Opens a server-sent-event stream with a one-time ticket (the access token never
// goes in a URL). If the stream cannot open or drops, it polls every 30 s and tries the stream again.
export function useUnread(enabled: boolean): number {
  const [count, setCount] = useState(0);
  useEffect(() => {
    if (!enabled) return;
    let es: EventSource | null = null;
    let poll: ReturnType<typeof setInterval> | null = null;
    let retry: ReturnType<typeof setTimeout> | null = null;
    let closed = false;
    const refresh = () => api.get<{ unread: number }>('/notifications/unread-count').then((r) => !closed && setCount(r.unread)).catch(() => {});
    const startPoll = () => { if (!poll) { refresh(); poll = setInterval(refresh, 30000); } };
    const stopPoll = () => { if (poll) { clearInterval(poll); poll = null; } };
    const connect = async () => {
      if (closed || typeof EventSource === 'undefined') return startPoll();
      try {
        const { ticket } = await api.post<{ ticket: string }>('/notifications/stream-ticket');
        if (closed) return;
        es = new EventSource(`${API_URL}/notifications/stream?ticket=${encodeURIComponent(ticket)}`);
        es.addEventListener('unread', (ev) => {
          stopPoll();
          try { setCount(Number(JSON.parse((ev as MessageEvent).data).unread) || 0); } catch { /* ignore bad frame */ }
        });
        es.onerror = () => {
          // The ticket is single use, so a dropped stream needs a new one. Poll meanwhile.
          es?.close(); es = null; startPoll();
          if (!closed) retry = setTimeout(connect, 30000);
        };
      } catch { startPoll(); if (!closed) retry = setTimeout(connect, 30000); }
    };
    connect();
    window.addEventListener(NOTIF_CHANGED, refresh);
    return () => { closed = true; es?.close(); stopPoll(); if (retry) clearTimeout(retry); window.removeEventListener(NOTIF_CHANGED, refresh); };
  }, [enabled]);
  return count;
}

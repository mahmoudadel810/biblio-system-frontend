import { useEffect, useState } from 'react';
import { cached, pub } from './api';

export function useFetch<T>(path: string) {
  const [data, setData] = useState<T | null>(() => cached<T>(path) ?? null);
  const [error, setError] = useState('');
  const [status, setStatus] = useState(0);
  const [loading, setLoading] = useState(() => cached<T>(path) === undefined);
  useEffect(() => {
    // Abort the request when the path changes or the page unmounts, so a slow old response cannot overwrite a newer one.
    const ctl = new AbortController();
    setError('');
    setStatus(0);
    const hit = cached<T>(path);
    if (hit !== undefined) {
      setData(hit);
      setLoading(false);
      return;
    }
    setLoading(true);
    pub<T>(path, ctl.signal)
      .then((d) => setData(d))
      .catch((e: Error & { status?: number }) => {
        if (ctl.signal.aborted) return;
        setError(e.message);
        setStatus(e.status ?? 0);
      })
      .finally(() => {
        if (!ctl.signal.aborted) setLoading(false);
      });
    return () => ctl.abort();
  }, [path]);
  return { data, error, status, loading };
}

// Reveal-on-scroll. Content is shown immediately when motion is reduced or
// IntersectionObserver is missing, and a timer makes everything visible even
// if the observer never fires, so nothing stays hidden.
export function useReveal(deps: unknown[] = []) {
  useEffect(() => {
    const els = Array.from(document.querySelectorAll('.reveal:not(.in)'));
    const showAll = () => els.forEach((e) => e.classList.add('in'));
    if (
      !('IntersectionObserver' in window) ||
      window.matchMedia('(prefers-reduced-motion: reduce)').matches
    ) {
      showAll();
      return;
    }
    const io = new IntersectionObserver(
      (entries) =>
        entries.forEach((en) => {
          if (en.isIntersecting) {
            en.target.classList.add('in');
            io.unobserve(en.target);
          }
        }),
      { threshold: 0.12 },
    );
    els.forEach((e) => io.observe(e));
    const safety = window.setTimeout(showAll, 2500);
    return () => {
      window.clearTimeout(safety);
      io.disconnect();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);
}

export function useTitle(title: string) {
  useEffect(() => {
    document.title = title ? `${title} | Biblio` : 'Biblio';
  }, [title]);
}

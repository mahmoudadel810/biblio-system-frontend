import { useEffect, useState } from 'react';
import { pub } from './api';

export function useFetch<T>(path: string) {
  const [data, setData] = useState<T | null>(null);
  const [error, setError] = useState('');
  const [status, setStatus] = useState(0);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    let live = true;
    setLoading(true);
    setError('');
    setStatus(0);
    pub<T>(path)
      .then((d) => live && setData(d))
      .catch((e: Error & { status?: number }) => {
        if (live) {
          setError(e.message);
          setStatus(e.status ?? 0);
        }
      })
      .finally(() => live && setLoading(false));
    return () => {
      live = false;
    };
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

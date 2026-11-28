import { useEffect } from 'react';

// Scroll-linked motion for the home page. It only writes a progress number (--p, 0 to 1) on elements:
//   [data-scene]  a tall section with a sticky child: p runs while the section is pinned.
//   [data-par]    any element: p runs while it crosses the viewport.
// All visuals are CSS transform and opacity driven from --p. One rAF per scroll tick, and only for elements
// near the viewport. Does nothing when the user prefers reduced motion.
export function useScrollMotion(deps: unknown[] = []) {
  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const root = document.documentElement;
    const els = Array.from(document.querySelectorAll<HTMLElement>('[data-scene],[data-par]'));
    const live = new Set<HTMLElement>();
    const io = new IntersectionObserver(
      (entries) => entries.forEach((en) => (en.isIntersecting ? live.add(en.target as HTMLElement) : live.delete(en.target as HTMLElement))),
      { rootMargin: '20% 0px 20% 0px' },
    );
    els.forEach((e) => io.observe(e));
    let raf = 0;
    const clamp = (n: number) => Math.max(0, Math.min(1, n));
    const apply = () => {
      raf = 0;
      const vh = window.innerHeight;
      for (const e of live) {
        const r = e.getBoundingClientRect();
        const p = e.hasAttribute('data-scene') ? clamp(-r.top / Math.max(1, r.height - vh)) : clamp((vh - r.top) / (r.height + vh));
        e.style.setProperty('--p', p.toFixed(4));
      }
      const max = root.scrollHeight - vh;
      root.style.setProperty('--page-p', max > 0 ? clamp(window.scrollY / max).toFixed(4) : '0');
    };
    const queue = () => { if (!raf) raf = requestAnimationFrame(apply); };
    window.addEventListener('scroll', queue, { passive: true });
    window.addEventListener('resize', queue);
    // Run once now and once after layout settles (images, fonts).
    queue();
    const t = window.setTimeout(queue, 400);
    return () => {
      window.removeEventListener('scroll', queue);
      window.removeEventListener('resize', queue);
      window.clearTimeout(t);
      cancelAnimationFrame(raf);
      io.disconnect();
      root.style.removeProperty('--page-p');
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);
}

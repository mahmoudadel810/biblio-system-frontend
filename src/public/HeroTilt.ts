import { useEffect } from 'react';

// Drives --tilt-x/--tilt-y on .hero-book from scroll and pointer. One rAF per
// frame, passive listeners, skipped when the user prefers reduced motion.
export function useHeroTilt() {
  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const el = document.querySelector<HTMLElement>('.hero-book');
    if (!el) return;
    let raf = 0;
    let px = 0;
    const apply = () => {
      const y = Math.min(window.scrollY, 600) / 600;
      el.style.setProperty('--tilt-x', `${px * 14}deg`);
      el.style.setProperty('--tilt-y', `${y * 18}deg`);
      raf = 0;
    };
    const schedule = () => {
      if (!raf) raf = requestAnimationFrame(apply);
    };
    const onMove = (e: PointerEvent) => {
      px = (e.clientX / window.innerWidth - 0.5) * 2;
      schedule();
    };
    window.addEventListener('scroll', schedule, { passive: true });
    window.addEventListener('pointermove', onMove, { passive: true });
    schedule();
    return () => {
      window.removeEventListener('scroll', schedule);
      window.removeEventListener('pointermove', onMove);
      cancelAnimationFrame(raf);
    };
  });
}

import { useEffect, useRef } from 'react';

// A small book-shaped character whose eyes follow the pointer, and look down as the page scrolls.
// Decorative only: no camera or microphone is ever used. Pupils move with transform alone and
// stay still when the user prefers reduced motion.
export default function Mascot() {
  const ref = useRef<SVGSVGElement>(null);
  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const svg = ref.current;
    if (!svg) return;
    let raf = 0;
    let lx = 0;
    let ly = 0;
    const apply = () => {
      raf = 0;
      svg.style.setProperty('--mx', `${lx * 7}px`);
      svg.style.setProperty('--my', `${ly * 7}px`);
    };
    const queue = () => { if (!raf) raf = requestAnimationFrame(apply); };
    const onMove = (e: PointerEvent) => {
      const r = svg.getBoundingClientRect();
      const dx = e.clientX - (r.left + r.width / 2);
      const dy = e.clientY - (r.top + r.height / 2);
      const d = Math.hypot(dx, dy) || 1;
      const k = Math.min(1, d / 160);
      lx = (dx / d) * k;
      ly = (dy / d) * k;
      queue();
    };
    const onScroll = () => {
      // With no pointer (touch), scrolling makes the eyes drift down the page.
      lx = 0;
      ly = Math.min(window.scrollY, 400) / 400;
      queue();
    };
    window.addEventListener('pointermove', onMove, { passive: true });
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => {
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('scroll', onScroll);
      cancelAnimationFrame(raf);
    };
  }, []);
  return (
    <svg ref={ref} className="mascot" viewBox="0 0 120 110" aria-hidden="true" focusable="false">
      <path d="M8 24 Q34 14 60 26 Q86 14 112 24 V92 Q86 82 60 94 Q34 82 8 92 Z" fill="var(--ink)" />
      <path d="M60 26 V94" stroke="var(--paper)" strokeWidth="3" />
      <circle cx="38" cy="52" r="16" fill="var(--paper)" />
      <circle cx="82" cy="52" r="16" fill="var(--paper)" />
      <circle className="pupil" cx="38" cy="52" r="7" fill="var(--ink)" />
      <circle className="pupil" cx="82" cy="52" r="7" fill="var(--ink)" />
      <path d="M52 72 L60 82 L68 72 Z" fill="var(--paper)" />
    </svg>
  );
}

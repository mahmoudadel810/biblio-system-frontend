import { useEffect, useRef } from 'react';

// Book mark whose eye follows the pointer. Movement uses transform only and is
// skipped when the user prefers reduced motion.
export default function Logo({ lang = 'en', size = 36 }: { lang?: 'en' | 'ar'; size?: number }) {
  const pupil = useRef<SVGCircleElement>(null);

  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    let raf = 0;
    const onMove = (e: PointerEvent) => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        const el = pupil.current;
        if (!el) return;
        const box = el.ownerSVGElement!.getBoundingClientRect();
        const dx = e.clientX - (box.left + box.width / 2);
        const dy = e.clientY - (box.top + box.height / 4);
        const len = Math.hypot(dx, dy) || 1;
        const k = Math.min(1, len / 200);
        el.style.transform = `translate(${(dx / len) * 5 * k}px, ${(dy / len) * 2.5 * k}px)`;
      });
    };
    window.addEventListener('pointermove', onMove, { passive: true });
    return () => {
      window.removeEventListener('pointermove', onMove);
      cancelAnimationFrame(raf);
    };
  }, []);

  return (
    <span className="logo" style={{ display: 'inline-flex', alignItems: 'center', gap: 'var(--s-2)' }}>
      <svg width={size} height={size} viewBox="0 0 64 64" role="img" aria-label="Biblio">
        <path d="M32 55C25 49.5 13 49 5 53V27c8-4 20-3.500 27 2.500z" fill="var(--ink)" />
        <path d="M32 55c7-5.500 19-6 27-2V27c-8-4-20-3.500-27 2.500z" fill="var(--ink)" />
        <path d="M32 29.500V55" stroke="var(--paper)" strokeWidth="2.500" strokeLinecap="round" />
        <ellipse cx="32" cy="15" rx="13" ry="9" fill="var(--paper)" stroke="var(--accent)" strokeWidth="3.500" />
        <circle
          ref={pupil}
          cx="32"
          cy="15"
          r="4.500"
          fill="var(--ink)"
          style={{ transition: 'transform 120ms var(--ease)' }}
        />
      </svg>
      <span style={{ fontWeight: 800, fontSize: size * 0.6, letterSpacing: lang === 'ar' ? 0 : '-0.02em' }}>
        {lang === 'ar' ? 'بيبليو' : 'Biblio'}
      </span>
    </span>
  );
}

import { useEffect, useState } from 'react';
import { useI18n } from '../i18n';
import { api } from '../api/client';

interface Item { slug: string; notify: boolean }

// Save a book to the wishlist. Saved books notify the member when a copy is on the shelf, unless they switch that off.
export default function WishlistButton({ slug, availableNow }: { slug: string; availableNow: boolean }) {
  const { t } = useI18n();
  const [item, setItem] = useState<Item | null | undefined>(undefined);
  const [err, setErr] = useState('');
  useEffect(() => {
    api.get<Item[]>('/me/wishlist').then((l) => setItem(l.find((x) => x.slug === slug) ?? null)).catch(() => setItem(null));
  }, [slug]);
  if (item === undefined) return null;
  const toggle = async () => {
    setErr('');
    try {
      if (item) { await api.del(`/me/wishlist/${encodeURIComponent(slug)}`); setItem(null); }
      else { await api.put(`/me/wishlist/${encodeURIComponent(slug)}`, { notify: true }); setItem({ slug, notify: true }); }
    } catch { setErr(t('wish.failed')); }
  };
  return (
    <div className="wish">
      <button type="button" className="pill ghost" aria-pressed={!!item} onClick={toggle}>
        {item ? t('wish.saved') : t(availableNow ? 'wish.save' : 'wish.notify')}
      </button>
      {item && <p className="muted small">{t('wish.will')}</p>}
      {err && <p className="error small" role="alert">{err}</p>}
    </div>
  );
}

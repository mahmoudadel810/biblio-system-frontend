import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../api/client';
import { useI18n } from '../i18n';

interface Item { slug: string; title: string; title_ar: string | null; notify: boolean; available: number }

export default function MyWishlist() {
  const { t, lang } = useI18n();
  const [items, setItems] = useState<Item[]>([]);
  const load = useCallback(() => api.get<Item[]>('/me/wishlist').then(setItems).catch(() => {}), []);
  useEffect(() => { load(); }, [load]);
  const name = (i: Item) => (lang === 'ar' && i.title_ar ? i.title_ar : i.title);
  const flip = async (i: Item) => { await api.put(`/me/wishlist/${encodeURIComponent(i.slug)}`, { notify: !i.notify }).catch(() => {}); load(); };
  const remove = async (i: Item) => { await api.del(`/me/wishlist/${encodeURIComponent(i.slug)}`).catch(() => {}); load(); };
  return (
    <>
      <h2>{t('wish.title')}</h2>
      {items.length === 0 ? <p className="muted">{t('wish.none')}</p> : (
        <ul className="mylist">
          {items.map((i) => (
            <li key={i.slug}>
              <div>
                <Link to={`/books/${encodeURIComponent(i.slug)}`}>{name(i)}</Link>
                <div className="muted small">{i.available > 0 ? <span className="badge">{t('wish.onshelf')}</span> : t('wish.out')}</div>
              </div>
              <div className="row">
                <button type="button" className="pill ghost" aria-pressed={i.notify} onClick={() => flip(i)}>{t(i.notify ? 'wish.notifyon' : 'wish.notifyoff')}</button>
                <button type="button" className="pill ghost" onClick={() => remove(i)}>{t('wish.remove')}</button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </>
  );
}

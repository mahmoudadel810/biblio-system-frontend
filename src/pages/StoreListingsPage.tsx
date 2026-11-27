import { useCallback, useEffect, useState, type FormEvent } from 'react';
import { Link, useParams } from 'react-router-dom';
import { api, ApiError } from '../api/client';
import { useI18n } from '../i18n';
import { fmtMoney } from '../public/format';
import { pub } from '../public/api';
import type { BookCard, Page } from '../public/api';

interface Listing { id: string; book_id: string; book_title: string; price_halalas: number | null; buy_url: string; in_stock: boolean }

// A bookstore's own listings: a buy link and an optional price in SAR. No payments here.
export default function StoreListingsPage() {
  const { orgId = '' } = useParams();
  const { lang, t } = useI18n();
  const [rows, setRows] = useState<Listing[]>([]);
  const [error, setError] = useState('');
  const [q, setQ] = useState('');
  const [found, setFound] = useState<BookCard[]>([]);
  const [pick, setPick] = useState<BookCard | null>(null);
  const [price, setPrice] = useState('');
  const [url, setUrl] = useState('');
  const load = useCallback(() => {
    api.get<Listing[]>(`/organizations/${orgId}/listings`).then(setRows).catch((e: ApiError) => setError(e.message));
  }, [orgId]);
  useEffect(load, [load]);

  const search = async () => {
    if (q.trim().length < 2) return;
    const r = await pub<Page<BookCard>>(`/books?q=${encodeURIComponent(q.trim())}&per_page=6`).catch(() => null);
    setFound(r?.items ?? []);
  };
  // SAR amount typed as 45 or 45.50 becomes halalas without floating point.
  const toHalalas = (v: string): number | null | 'bad' => {
    const s = v.trim();
    if (!s) return null;
    const m = /^(\d{1,7})(?:\.(\d{1,2}))?$/.exec(s);
    return m ? Number(m[1]) * 100 + Number((m[2] ?? '').padEnd(2, '0') || 0) : 'bad';
  };
  const add = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    const h = toHalalas(price);
    if (!pick) return setError(t('store.pickbook'));
    if (h === 'bad') return setError(t('store.badprice'));
    try {
      await api.post(`/organizations/${orgId}/listings`, { book_id: pick.id, price_halalas: h, buy_url: url.trim() });
      setPick(null); setFound([]); setQ(''); setPrice(''); setUrl('');
      load();
    } catch (err) { setError(err instanceof ApiError ? err.message : 'failed'); }
  };
  const toggle = async (l: Listing) => {
    try { await api.patch(`/organizations/${orgId}/listings/${l.id}`, { in_stock: !l.in_stock }); load(); }
    catch (err) { setError((err as ApiError).message); }
  };
  const remove = async (l: Listing) => {
    try { await api.del(`/organizations/${orgId}/listings/${l.id}`); load(); }
    catch (err) { setError((err as ApiError).message); }
  };

  return (
    <section className="band narrow">
      <p className="small"><Link to="/library/start">{lang === 'ar' ? '→' : '←'} {t('store.back')}</Link></p>
      <h1>{t('store.title')}</h1>
      <p className="muted">{t('store.lead')}</p>
      {error && <p className="error" role="alert">{error}</p>}
      <form className="form" onSubmit={add} noValidate>
        <label>{t('store.search')}
          <input value={q} onChange={(e) => setQ(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); search(); } }} />
        </label>
        <button type="button" className="pill ghost" onClick={search}>{t('store.find')}</button>
        {found.length > 0 && !pick && (
          <ul className="mylist">
            {found.map((b) => <li key={b.id}><bdi>{b.title}</bdi><button type="button" className="pill ghost" onClick={() => setPick(b)}>{t('store.choose')}</button></li>)}
          </ul>
        )}
        {pick && <p><strong><bdi>{pick.title}</bdi></strong></p>}
        <label>{t('store.price')}<input inputMode="decimal" value={price} onChange={(e) => setPrice(e.target.value)} /></label>
        <label>{t('store.url')}<input inputMode="url" maxLength={300} value={url} onChange={(e) => setUrl(e.target.value)} /></label>
        <button className="pill" type="submit" disabled={!pick || !url.trim()}>{t('store.add')}</button>
      </form>
      <h2 style={{ marginBlockStart: 'var(--s-8, 2rem)' }}>{t('store.mine')}</h2>
      {rows.length === 0 ? <p className="muted">{t('store.none')}</p> : (
        <ul className="mylist">
          {rows.map((l) => (
            <li key={l.id}>
              <div>
                <bdi>{l.book_title}</bdi>
                <div className="muted small">{l.price_halalas != null && <bdi>{fmtMoney(l.price_halalas / 100, lang)} · </bdi>}{l.in_stock ? t('buy.instock') : t('buy.out')}</div>
              </div>
              <div className="row">
                <button type="button" className="pill ghost" onClick={() => toggle(l)}>{l.in_stock ? t('store.markout') : t('store.markin')}</button>
                <button type="button" className="pill ghost" onClick={() => remove(l)}>{t('store.remove')}</button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

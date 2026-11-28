import { useCallback, useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useI18n } from '../i18n';
import { useAuth } from '../auth/AuthContext';
import { api, ApiError, API_URL } from '../api/client';
import { pub } from './api';
import { useTitle } from './hooks';
import type { Club } from './ClubsPage';

interface Detail { club: Club; member_names: string[] }
interface Mine { id: string; is_owner: boolean }

export default function ClubPage() {
  const { id } = useParams();
  const { t, lang } = useI18n();
  const { user } = useAuth();
  const nav = useNavigate();
  const [d, setD] = useState<Detail | null>(null);
  const [mine, setMine] = useState<Mine[]>([]);
  const [missing, setMissing] = useState(false);
  const [book, setBook] = useState('');
  const [found, setFound] = useState<{ slug: string; title: string }[]>([]);
  useEffect(() => {
    if (book.trim().length < 2) return setFound([]);
    const h = setTimeout(() => { pub<{ items: { slug: string; title: string }[] }>(`/books?q=${encodeURIComponent(book.trim())}&per_page=8`).then((r) => setFound(r.items)).catch(() => setFound([])); }, 250);
    return () => clearTimeout(h);
  }, [book]);
  const [err, setErr] = useState('');
  const isStaff = user?.role === 'admin' || user?.role === 'librarian';
  useTitle(d?.club.name ?? '');
  const load = useCallback(async () => {
    try {
      const base = await fetch(`${API_URL}/public/clubs/${encodeURIComponent(id ?? '')}`);
      if (!base.ok) return setMissing(true);
      setD(await base.json());
    } catch { setMissing(true); }
    if (user) api.get<Mine[]>('/me/clubs').then(setMine).catch(() => setMine([]));
  }, [id, user]);
  useEffect(() => { load(); }, [load]);
  useEffect(() => { if (d) setBook(lang === 'ar' && d.club.book_title_ar ? d.club.book_title_ar : d.club.book_title ?? ''); }, [d, lang]);
  if (missing) return <p className="band error" role="alert">{t('club.notfound')}</p>;
  if (!d) return <p className="band muted" role="status">{t('loading')}</p>;
  const m = mine.find((x) => x.id === d.club.id);
  const act = async (fn: () => Promise<unknown>) => { setErr(''); try { await fn(); await load(); } catch (x) { setErr(x instanceof ApiError ? x.message : t('club.failed')); } };
  const c = d.club;
  return (
    <section className="band">
      <h1><bdi>{c.name}</bdi></h1>
      {c.description && <p>{c.description}</p>}
      {c.book_slug && c.book_title && <p>{t('club.reading')} <Link to={`/books/${encodeURIComponent(c.book_slug)}`}><bdi>{lang === 'ar' && c.book_title_ar ? c.book_title_ar : c.book_title}</bdi></Link></p>}
      <p className="muted small">{t('club.by')} <bdi>{c.owner}</bdi></p>
      <h2><bdi>{c.members}</bdi> {t('club.members')}</h2>
      <p>{d.member_names.map((n, i) => <span key={i}>{i > 0 && ', '}<bdi>{n}</bdi></span>)}</p>
      <div className="row">
        {!user && <Link className="pill" to={`/login?next=/clubs/${c.id}`}>{t('club.signin')}</Link>}
        {user && !m && <button type="button" className="pill" onClick={() => act(() => api.post(`/clubs/${c.id}/join`))}>{t('club.join')}</button>}
        {user && m && !m.is_owner && <button type="button" className="pill ghost" onClick={() => act(() => api.del(`/clubs/${c.id}/join`))}>{t('club.leave')}</button>}
        {m?.is_owner && <button type="button" className="pill ghost" onClick={() => act(async () => { await api.del(`/clubs/${c.id}`); nav('/clubs'); })}>{t('club.delete')}</button>}
        {isStaff && <button type="button" className="pill ghost" onClick={() => act(async () => { await api.patch(`/clubs/${c.id}/hidden`, { hidden: true }); nav('/clubs'); })}>{t('club.hide')}</button>}
      </div>
      {m?.is_owner && (
        <form className="rev-form" onSubmit={(e) => { e.preventDefault(); 
          const hit = (found.find((f) => f.title.toLowerCase() === book.trim().toLowerCase()) ?? (d.club.book_slug && (d.club.book_title === book.trim() || d.club.book_title_ar === book.trim()) ? { slug: d.club.book_slug, title: book } : undefined));
          if (book.trim() && !hit) return setErr(t('club.pickbook'));
          act(() => api.patch(`/clubs/${c.id}`, { book: hit ? hit.slug : '' })); }}>
          <label>{t('club.setbook')}
            <input list="club-books" value={book} onChange={(e) => setBook(e.target.value)} />
            <datalist id="club-books">{found.map((f) => <option key={f.slug} value={f.title} />)}</datalist>
          </label>
          <p className="muted small">{t('club.setbook.help')}</p>
          <button type="submit" className="pill ghost">{t('club.save')}</button>
        </form>
      )}
      {err && <p className="error small" role="alert">{err}</p>}
    </section>
  );
}

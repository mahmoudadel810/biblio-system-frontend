import { useEffect, useState, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useI18n } from '../i18n';
import { useAuth } from '../auth/AuthContext';
import { api, ApiError } from '../api/client';
import { useTitle } from './hooks';
import { pub } from './api';

export interface Club { id: string; name: string; description: string; owner: string; book_slug: string | null; book_title: string | null; book_title_ar: string | null; members: number }

export default function ClubsPage() {
  const { t, lang } = useI18n();
  const { user } = useAuth();
  const nav = useNavigate();
  useTitle(t('club.title'));
  const [clubs, setClubs] = useState<Club[] | null>(null);
  const [name, setName] = useState('');
  const [desc, setDesc] = useState('');
  const [err, setErr] = useState('');
  useEffect(() => { pub<Club[]>('/clubs').then(setClubs).catch(() => setClubs([])); }, []);
  const create = async (e: FormEvent) => {
    e.preventDefault();
    setErr('');
    try {
      const r = await api.post<{ id: string }>('/clubs', { name, description: desc });
      nav(`/clubs/${r.id}`);
    } catch (x) { setErr(x instanceof ApiError ? x.message : t('club.failed')); }
  };
  return (
    <section className="band">
      <h1>{t('club.title')}</h1>
      <p className="muted">{t('club.lead')}</p>
      {clubs && clubs.length === 0 && <p className="muted">{t('club.none')}</p>}
      <ul className="dir-grid">
        {clubs?.map((c) => (
          <li key={c.id} className="dir-card">
            <h2><Link to={`/clubs/${c.id}`}><bdi>{c.name}</bdi></Link></h2>
            {c.description && <p>{c.description}</p>}
            {c.book_title && <p className="muted">{t('club.reading')} <bdi>{lang === 'ar' && c.book_title_ar ? c.book_title_ar : c.book_title}</bdi></p>}
            <p className="muted small"><bdi>{c.members}</bdi> {t('club.members')} · {t('club.by')} <bdi>{c.owner}</bdi></p>
          </li>
        ))}
      </ul>
      {user ? (
        <form className="rev-form" onSubmit={create}>
          <h2>{t('club.new')}</h2>
          <label>{t('club.name')}<input value={name} maxLength={80} onChange={(e) => setName(e.target.value)} /></label>
          <label>{t('club.desc')}<textarea value={desc} maxLength={500} rows={3} onChange={(e) => setDesc(e.target.value)} /></label>
          {err && <p className="error small" role="alert">{err}</p>}
          <button type="submit" className="pill">{t('club.create')}</button>
        </form>
      ) : <p className="muted small"><Link to="/login?next=/clubs">{t('club.signin')}</Link></p>}
    </section>
  );
}

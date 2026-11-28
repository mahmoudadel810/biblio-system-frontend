import { useEffect, useState, type FormEvent } from 'react';
import { Link } from 'react-router-dom';
import { api, ApiError } from '../api/client';
import FinePolicy from '../pages/FinePolicy';
import { useAuth } from '../auth/AuthContext';
import { useI18n } from '../i18n';
import { useTitle } from './hooks';

const isHttp = (v: string) => !v || /^https?:\/\/[^\s]+$/i.test(v);
const isEmail = (v: string) => !v || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);

export default function LibraryStartPage() {
  const { t } = useI18n();
  const { user } = useAuth();
  const [f, setF] = useState({ kind: 'library', name: '', city: '', country: '', contact_email: '', website: '', registration_no: '', document_url: '', description: '' });
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);
  const [mine, setMine] = useState<{ id: string; name: string; kind: string; status: string; status_note: string | null }[]>([]);
  useEffect(() => { if (user) api.get<typeof mine>('/me/organizations').then(setMine).catch(() => {}); }, [user, done]);
  useTitle(t('lib.title'));
  const set = (k: keyof typeof f) => (e: { target: { value: string } }) => setF({ ...f, [k]: e.target.value });

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    if (!isHttp(f.website) || !isHttp(f.document_url)) return setError(t('lib.badurl'));
    if (!isEmail(f.contact_email)) return setError(t('lib.bademail'));
    setBusy(true);
    try {
      const body = Object.fromEntries(Object.entries(f).map(([k, v]) => [k, typeof v === 'string' && v.trim() === '' ? null : v.trim()]));
      await api.post('/organizations', body);
      setDone(true);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'request failed');
    } finally {
      setBusy(false);
    }
  };

  return (
    <section className="band narrow">
      <h1>{t('lib.title')}</h1>
      <p>{t('lib.lead')}</p>
      {!user && (
        <div className="row">
          <p className="muted">{t('lib.needaccount')}</p>
          <Link className="pill" to="/register?next=/library/start">{t('register')}</Link>
          <Link className="pill ghost" to="/login?next=/library/start">{t('nav.signin')}</Link>
        </div>
      )}
      {user && mine.length > 0 && (
        <div className="mine-orgs">
          <h2>{t('lib.mine')}</h2>
          <ul className="mylist">
            {mine.map((o) => (
              <li key={o.id}>
                <div><bdi>{o.name}</bdi>{o.status_note && <div className="muted small"><bdi>{o.status_note}</bdi></div>}</div>
                <span className={`status-badge ${o.status}`}>{t('lib.status.' + o.status)}</span>
                {o.kind === 'bookstore' && o.status !== 'pending' && o.status !== 'rejected' && <Link className="pill ghost" to={`/store/${o.id}/listings`}>{t('store.manage')}</Link>}
              </li>
            ))}
          </ul>
        </div>
      )}
      {user && <FinePolicy />}
      {user && done && (
        <div role="status">
          <h2>{t('lib.done')}</h2>
          <p>{t('lib.pending')}</p>
        </div>
      )}
      {user && !done && (
        <form className="form" onSubmit={onSubmit} noValidate>
          <label>{t('lib.kind')}
            <select value={f.kind} onChange={set('kind')}>
              <option value="library">{t('lib.library')}</option>
              <option value="bookstore">{t('lib.bookstore')}</option>
            </select>
          </label>
          <label>{t('lib.name')}<input required maxLength={120} value={f.name} onChange={set('name')} /></label>
          <label>{t('lib.city')}<input maxLength={80} value={f.city} onChange={set('city')} /></label>
          <label>{t('lib.country')}<input maxLength={80} value={f.country} onChange={set('country')} /></label>
          <label>{t('lib.email')}<input type="email" maxLength={120} value={f.contact_email} onChange={set('contact_email')} /></label>
          <label>{t('lib.website')}<input inputMode="url" maxLength={200} value={f.website} onChange={set('website')} /></label>
          <label>{t('lib.regno')}<input maxLength={60} value={f.registration_no} onChange={set('registration_no')} /></label>
          <label>{t('lib.docurl')}<input inputMode="url" maxLength={300} value={f.document_url} onChange={set('document_url')} /></label>
          <label>{t('lib.desc')}<textarea rows={4} maxLength={1000} value={f.description} onChange={set('description')} /></label>
          {error && <p className="error" role="alert">{error}</p>}
          <button className="pill" type="submit" disabled={busy || f.name.trim().length < 2}>{busy ? t('lib.sending') : t('lib.submit')}</button>
        </form>
      )}
    </section>
  );
}

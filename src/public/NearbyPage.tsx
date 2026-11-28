import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useI18n } from '../i18n';
import { useTitle } from './hooks';
import { pub } from './api';

interface Near {
  id: string; name: string; organization: string | null; organization_slug: string | null; address: string; phone: string | null;
  latitude: number; longitude: number; distance_km: number | null; available: number; total: number;
}

// Libraries near me. The position is read only when the member taps the button, is sent once to sort
// the list, and is never stored. Each branch links to the member's own maps app, so no map service is used here.
export default function NearbyPage() {
  const { t, lang } = useI18n();
  useTitle(t('near.title'));
  const [params] = useSearchParams();
  const slug = params.get('book') ?? '';
  const [pos, setPos] = useState<{ lat: number; lng: number } | null>(null);
  const [rows, setRows] = useState<Near[] | null>(null);
  const [err, setErr] = useState('');
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    const q = new URLSearchParams();
    if (pos) { q.set('lat', String(pos.lat)); q.set('lng', String(pos.lng)); }
    if (slug) q.set('slug', slug);
    const qs = q.toString();
    pub<Near[]>(`/branches/nearby${qs ? `?${qs}` : ''}`).then(setRows).catch(() => setErr(t('near.failed')));
  }, [pos, slug, t]);

  const locate = () => {
    setErr('');
    if (!navigator.geolocation) return setErr(t('near.unsupported'));
    setBusy(true);
    navigator.geolocation.getCurrentPosition(
      (p) => { setBusy(false); setPos({ lat: p.coords.latitude, lng: p.coords.longitude }); },
      () => { setBusy(false); setErr(t('near.denied')); },
      { timeout: 10000, maximumAge: 60000 },
    );
  };
  const nf = new Intl.NumberFormat(lang === 'ar' ? 'ar-SA-u-nu-latn' : 'en', { maximumFractionDigits: 1 });
  const maps = (r: Near) => `https://www.google.com/maps/search/?api=1&query=${r.latitude},${r.longitude}`;

  return (
    <section className="band">
      <h1>{t('near.title')}</h1>
      <p className="muted">{t('near.lead')}</p>
      <div className="row">
        <button type="button" className="pill" onClick={locate} disabled={busy}>{t(pos ? 'near.refresh' : 'near.use')}</button>
      </div>
      <p className="muted small">{t('near.privacy')}</p>
      {err && <p className="error" role="alert">{err}</p>}
      {rows && rows.length === 0 && <p className="muted">{t('near.empty')}</p>}
      <ul className="dir-grid">
        {rows?.map((r) => (
          <li key={r.id} className="dir-card">
            <h2><bdi>{r.name}</bdi></h2>
            {r.organization && <p className="muted"><bdi>{r.organization}</bdi></p>}
            <p><bdi>{r.address}</bdi></p>
            {r.distance_km !== null && <p><strong><bdi>{nf.format(r.distance_km)} {t('near.km')}</bdi></strong> {t('near.away')}</p>}
            <p className={r.available > 0 ? '' : 'muted'}>
              <bdi>{r.available} / {r.total}</bdi> {t(slug ? 'near.copies.book' : 'near.copies')}
            </p>
            <p><a href={maps(r)} rel="noopener noreferrer" target="_blank">{t('near.open')}</a></p>
          </li>
        ))}
      </ul>
    </section>
  );
}

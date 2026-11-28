import { Link, useParams } from 'react-router-dom';
import { useI18n } from '../i18n';
import { useFetch, useTitle } from './hooks';
import { Cover } from './Cards';

interface Page {
  kind: string; name: string; slug: string; description: string | null; city: string | null; country: string | null; titles: number;
  branches: { name: string; address: string; latitude: number | null; longitude: number | null; copies: number; available: number }[];
  books: { slug: string; title: string; title_ar: string | null; cover_url: string | null }[];
}

// Public page for one verified library or bookstore. No contact details are shown here.
export default function OrgPage() {
  const { slug } = useParams();
  const { t, lang } = useI18n();
  const { data, loading, error } = useFetch<Page>(`/organizations/${encodeURIComponent(slug ?? '')}`);
  useTitle(data?.name ?? '');
  if (loading) return <p className="band muted" role="status">{t('loading')}</p>;
  if (error || !data) return <p className="band error" role="alert">{t('org.notfound')}</p>;
  const lib = data.kind === 'library';
  return (
    <section className="band">
      <p className="muted small"><Link to={lib ? '/libraries' : '/bookstores'}>{t(lib ? 'dir.libraries' : 'dir.bookstores')}</Link></p>
      <h1><bdi>{data.name}</bdi></h1>
      {(data.city || data.country) && <p className="muted"><bdi>{[data.city, data.country].filter(Boolean).join(', ')}</bdi></p>}
      {data.description && <p>{data.description}</p>}
      {lib && (
        <>
          <p><strong><bdi>{data.titles}</bdi></strong> {t('org.titles')}</p>
          <h2>{t('org.branches')}</h2>
          {data.branches.length === 0 ? <p className="muted">{t('org.nobranches')}</p> : (
            <ul className="dir-grid">
              {data.branches.map((b) => (
                <li key={b.name} className="dir-card">
                  <h3><bdi>{b.name}</bdi></h3>
                  <p><bdi>{b.address}</bdi></p>
                  <p className={b.available > 0 ? '' : 'muted'}><bdi>{b.available} / {b.copies}</bdi> {t('near.copies')}</p>
                  {b.latitude != null && b.longitude != null && (
                    <p><a href={`https://www.google.com/maps/search/?api=1&query=${b.latitude},${b.longitude}`} rel="noopener noreferrer" target="_blank">{t('near.open')}</a></p>
                  )}
                </li>
              ))}
            </ul>
          )}
          {data.books.length > 0 && (
            <>
              <h2>{t('org.books')}</h2>
              <ul className="org-books">
                {data.books.map((b) => (
                  <li key={b.slug}>
                    <Link to={`/books/${encodeURIComponent(b.slug)}`}>
                      <Cover book={{ title: b.title, cover_url: b.cover_url, authors: [] }} decorative />
                      <span><bdi>{lang === 'ar' && b.title_ar ? b.title_ar : b.title}</bdi></span>
                    </Link>
                  </li>
                ))}
              </ul>
            </>
          )}
        </>
      )}
    </section>
  );
}

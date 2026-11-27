import { useI18n } from '../i18n';
import { useFetch, useTitle } from './hooks';

interface Org { id: string; kind: string; name: string; slug: string; description: string | null; city: string | null; country: string | null }

// Verified libraries or bookstores. No contact details are public here.
export default function DirectoryPage({ kind }: { kind: 'library' | 'bookstore' }) {
  const { t } = useI18n();
  const { data, loading, error } = useFetch<Org[]>('/organizations?per_page=100');
  const title = t(kind === 'library' ? 'dir.libraries' : 'dir.bookstores');
  useTitle(title);
  const items = (data ?? []).filter((o) => o.kind === kind);
  return (
    <section className="band">
      <h1>{title}</h1>
      <p className="muted">{t('dir.lead')}</p>
      {loading && <p className="muted" role="status">{t('loading')}</p>}
      {error && <p className="error" role="alert">{error}</p>}
      {!loading && !error && items.length === 0 && <p className="muted">{t('dir.empty')}</p>}
      <ul className="dir-grid">
        {items.map((o) => (
          <li key={o.id} className="dir-card">
            <h2><bdi>{o.name}</bdi></h2>
            {(o.city || o.country) && <p className="muted"><bdi>{[o.city, o.country].filter(Boolean).join(', ')}</bdi></p>}
            {o.description && <p>{o.description}</p>}
          </li>
        ))}
      </ul>
    </section>
  );
}

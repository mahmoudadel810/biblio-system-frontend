import { Link, useParams } from 'react-router-dom';
import { useI18n } from '../i18n';
import { useFetch, useTitle } from './hooks';

interface Shared { name: string; owner: string; books: { slug: string; title: string; title_ar: string | null; cover_url: string | null }[] }

// A reading list its owner chose to share. Shows the owner's first name and last initial only.
export default function ListPage() {
  const { id } = useParams();
  const { t, lang } = useI18n();
  const { data, loading, error } = useFetch<Shared>(`/lists/${encodeURIComponent(id ?? '')}`);
  useTitle(data?.name ?? '');
  if (loading) return <p className="band muted" role="status">{t('loading')}</p>;
  if (error || !data) return <p className="band error" role="alert">{t('lists.notfound')}</p>;
  return (
    <section className="band">
      <h1>{data.name}</h1>
      <p className="muted">{t('lists.by')} <bdi>{data.owner}</bdi></p>
      {data.books.length === 0 ? <p className="muted">{t('lists.empty')}</p> : (
        <ul className="mylist">
          {data.books.map((b) => (
            <li key={b.slug}>
              <Link to={`/books/${encodeURIComponent(b.slug)}`}>{lang === 'ar' && b.title_ar ? b.title_ar : b.title}</Link>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

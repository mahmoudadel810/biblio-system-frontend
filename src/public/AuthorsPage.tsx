import { useParams } from 'react-router-dom';
import { useI18n } from '../i18n';
import { useFetch, useReveal, useTitle } from './hooks';
import { AuthorTile, BookTile } from './Cards';
import type { AuthorCard, AuthorDetail, Page } from './api';

export function AuthorsPage() {
  const { lang, t } = useI18n();
  const { data } = useFetch<Page<AuthorCard>>('/authors?per_page=48');
  useTitle(t('authors.title'));
  useReveal([data, lang]);
  return (
    <section className="band">
      <h1>{t('authors.title')}</h1>
      <div className="grid">{data?.items.map((a) => <AuthorTile key={a.slug} a={a} />)}</div>
    </section>
  );
}

export function AuthorPage() {
  const { slug } = useParams();
  const { lang, t } = useI18n();
  const ar = lang === 'ar';
  const { data: a, loading, error, status } = useFetch<AuthorDetail>(`/authors/${encodeURIComponent(slug ?? '')}`);
  useTitle(a ? (ar && a.name_ar ? a.name_ar : a.name) : '');
  useReveal([a, lang]);
  if (loading) return <p className="band muted" role="status">{t('loading')}</p>;
  if (error || !a) {
    const missing = status === 404 || status === 400;
    return <p className="band error" role="alert">{missing ? t('author.notfound') : error}</p>;
  }
  const story = ar && a.life_story_ar ? a.life_story_ar : a.life_story;
  return (
    <section className="band">
      <h1 className="poster">{ar && a.name_ar ? a.name_ar : a.name}</h1>
      <p className="muted"><bdi>{[a.birth_year, a.death_year].filter(Boolean).join(' - ')}</bdi> {a.nationality ?? ''}</p>
      {story && <p>{story}</p>}
      {a.source_url && <p className="small muted"><a href={a.source_url} rel="noopener noreferrer">{t('authors.source')}</a></p>}
      {a.quotes.map((q) => (
        <blockquote key={q.id}>
          {ar && q.text_ar ? q.text_ar : q.text}
          {q.source_url && <footer className="small muted"><a href={q.source_url} rel="noopener noreferrer">Wikiquote (CC BY-SA)</a></footer>}
        </blockquote>
      ))}
      <h2>{t('book.related')}</h2>
      <div className="grid">{a.books.map((b) => <BookTile key={b.id} book={b} />)}</div>
    </section>
  );
}

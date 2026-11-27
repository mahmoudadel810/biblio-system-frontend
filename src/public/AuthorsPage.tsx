import { useParams } from 'react-router-dom';
import { useI18n } from '../i18n';
import { useFetch, useReveal } from './hooks';
import { AuthorTile, BookTile } from './Cards';
import type { AuthorCard, AuthorDetail, Page } from './api';

export function AuthorsPage() {
  const { lang } = useI18n();
  const { data } = useFetch<Page<AuthorCard>>('/authors?per_page=48');
  useReveal();
  return (
    <section className="band">
      <h1>{lang === 'ar' ? 'المؤلفون' : 'Authors'}</h1>
      <div className="grid">{data?.items.map((a) => <AuthorTile key={a.slug} a={a} />)}</div>
    </section>
  );
}

export function AuthorPage() {
  const { slug } = useParams();
  const { lang } = useI18n();
  const ar = lang === 'ar';
  const { data: a, loading, error } = useFetch<AuthorDetail>(`/authors/${slug}`);
  useReveal();
  if (loading) return <p className="band muted" role="status">Loading</p>;
  if (error || !a) return <p className="band error" role="alert">{error || 'Not found'}</p>;
  const story = ar && a.life_story_ar ? a.life_story_ar : a.life_story;
  return (
    <section className="band">
      <h1 className="poster">{ar && a.name_ar ? a.name_ar : a.name}</h1>
      <p className="muted">{[a.birth_year, a.death_year].filter(Boolean).join(' - ')} {a.nationality ?? ''}</p>
      {story && <p>{story}</p>}
      {a.source_url && <p className="small muted"><a href={a.source_url} rel="noopener noreferrer">Source: Wikipedia (CC BY-SA)</a></p>}
      {a.quotes.map((q) => <blockquote key={q.id}>{q.text}</blockquote>)}
      <h2>{ar ? 'الكتب' : 'Books'}</h2>
      <div className="grid">{a.books.map((b) => <BookTile key={b.id} book={b} />)}</div>
    </section>
  );
}

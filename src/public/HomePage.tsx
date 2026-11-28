import { Link } from 'react-router-dom';
import { useI18n } from '../i18n';
import { useFetch, useReveal, useTitle } from './hooks';
import { useHeroTilt } from './HeroTilt';
import Mascot from './Mascot';
import { AuthorTile, BookTile, HeroBook } from './Cards';
import type { AuthorCard, BookCard, Category, Page, Quote } from './api';

export default function HomePage() {
  const { lang, t } = useI18n();
  const ar = lang === 'ar';
  const books = useFetch<Page<BookCard>>('/books?featured=true&per_page=8');
  const cats = useFetch<Category[]>('/categories');
  const popular = useFetch<{ books: BookCard[]; authors: AuthorCard[] }>('/popular');
  const quote = useFetch<Quote[]>('/quotes?random=true&limit=1');
  useTitle('');
  useReveal([books.data, cats.data, popular.data, quote.data, lang]);
  useHeroTilt();
  const q = quote.data?.[0];
  // Hero is pinned to Don Quixote (owner's choice); the cover is the Open Library edition already used in the catalog.
  const hero: Pick<BookCard, 'title' | 'cover_url' | 'authors'> | null = books.data
    ? { title: 'Don Quixote', cover_url: 'https://covers.openlibrary.org/b/id/13846974-L.jpg', authors: [{ slug: null, name: 'Miguel de Cervantes', name_ar: 'ميغيل دي ثربانتس' }] }
    : null;
  return (
    <>
      <section className="hero">
        <div className="hero-copy">
          <h1>{t('home.title')}</h1>
          <p>{t('home.lead')}</p>
          <div className="row">
            <Link className="pill" to="/books">{t('home.browse')}</Link>
            <Link className="pill ghost" to="/register">{t('nav.join')}</Link>
          </div>
          <Mascot />
        </div>
        {hero && <HeroBook book={hero} />}
      </section>
      <section className="band">
        <h2>{t('home.shelf')}</h2>
        {books.loading && <p className="muted" role="status">{t('loading')}</p>}
        {books.error && <p className="error" role="alert">{books.error}</p>}
        <div className="grid">{books.data?.items.map((b) => <BookTile key={b.id} book={b} />)}</div>
      </section>
      <section className="band flat-ink">
        <h2>{t('home.categories')}</h2>
        <div className="pills">
          {cats.data?.filter((c) => c.book_count > 0).map((c) => (
            <Link key={c.slug} className="pill ghost light" to={`/books?category=${encodeURIComponent(c.slug)}`}>
              {ar && c.name_ar ? c.name_ar : c.name} <small>{c.book_count}</small>
            </Link>
          ))}
        </div>
      </section>
      {q && (
        <section className="band quote reveal">
          <blockquote>{ar && q.text_ar ? q.text_ar : q.text}</blockquote>
          <p className="muted">{ar && q.author_name_ar ? q.author_name_ar : q.author_name}</p>
          {q.source_url && <p className="small muted"><a href={q.source_url} rel="noopener noreferrer">Wikiquote (CC BY-SA)</a></p>}
        </section>
      )}
      <section className="band">
        <h2>{t('home.authors')}</h2>
        <div className="grid">{popular.data?.authors.slice(0, 6).map((a) => <AuthorTile key={a.slug} a={a} />)}</div>
      </section>
    </>
  );
}

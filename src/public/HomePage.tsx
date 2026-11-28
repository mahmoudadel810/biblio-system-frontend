import { Link } from 'react-router-dom';
import { useI18n } from '../i18n';
import { useFetch, useReveal, useTitle } from './hooks';
import { useHeroTilt } from './HeroTilt';
import { useScrollMotion } from './useScrollMotion';
import './home-motion.css';
import Mascot from './Mascot';
import { AuthorTile, Cover, HeroBook } from './Cards';
import type { AuthorCard, BookCard, Category, Page, Quote } from './api';

const COLORS = ['c-green', 'c-paper', 'c-accent', 'c-ink'];

function ShelfTile({ book }: { book: BookCard }) {
  const { lang } = useI18n();
  const title = lang === 'ar' && book.title_ar ? book.title_ar : book.title;
  const a = book.authors[0];
  const author = a ? (lang === 'ar' && a.name_ar ? a.name_ar : a.name) : '';
  return (
    <Link to={`/books/${encodeURIComponent(book.slug)}`} className="tile shelf-tile">
      <Cover book={{ ...book, title }} decorative />
      <strong>{title}</strong>
      <span>{author}</span>
    </Link>
  );
}

export default function HomePage() {
  const { lang, t } = useI18n();
  const ar = lang === 'ar';
  const books = useFetch<Page<BookCard>>('/books?per_page=30');
  const cats = useFetch<Category[]>('/categories');
  const popular = useFetch<{ books: BookCard[]; authors: AuthorCard[] }>('/popular');
  const quote = useFetch<Quote[]>('/quotes?random=true&limit=1');
  useTitle('');
  useReveal([books.data, cats.data, popular.data, quote.data, lang]);
  useHeroTilt();
  useScrollMotion([books.data, cats.data, popular.data, quote.data, lang]);
  const q = quote.data?.[0];
  const items = (books.data?.items ?? []).filter((b) => b.cover_url);
  const bySlug = (s: string) => items.find((b) => b.slug === s);
  // Hero is pinned to Don Quixote (the owner's choice); the two covers behind it are other catalog books.
  const hero: Pick<BookCard, 'title' | 'cover_url' | 'authors'> | null = books.data
    ? { title: 'Don Quixote', cover_url: 'https://covers.openlibrary.org/b/id/13846974-L.jpg', authors: [{ slug: null, name: 'Miguel de Cervantes', name_ar: 'ميغيل دي ثربانتس' }] }
    : null;
  const floatL = bySlug('the-prophet');
  const floatR = bySlug('dracula');
  const half = Math.ceil(items.length / 2);
  const rowA = items.slice(0, half);
  const rowB = items.slice(half);
  const qText = q ? (ar && q.text_ar ? q.text_ar : q.text) : '';
  const words = qText.split(/\s+/).filter(Boolean);
  const spinBook = bySlug('don-quixote');
  return (
    <>
      <div className="page-progress" role="presentation" />
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
        <div className="hero-art" data-par>
          {floatR?.cover_url && <img className="float float-r" src={floatR.cover_url} alt="" aria-hidden="true" loading="lazy" width={200} height={300} />}
          {floatL?.cover_url && <img className="float float-l" src={floatL.cover_url} alt="" aria-hidden="true" loading="lazy" width={200} height={300} />}
          {hero && <HeroBook book={hero} />}
        </div>
      </section>

      <section className="words" aria-hidden="true" data-par>
        <span className="w w1">{t('home.w1')}</span>
        <span className="w w2">{t('home.w2')}</span>
        <span className="w w3">{t('home.w3')}</span>
      </section>

      <section className="scene shelf-scene" data-scene aria-labelledby="shelf-h">
        <div className="pin">
          <h2 id="shelf-h">{t('home.shelf')}</h2>
          {books.loading && <p role="status">{t('loading')}</p>}
          {books.error && <p className="error" role="alert">{books.error}</p>}
          <div className="rowx rx1">{rowA.map((b) => <ShelfTile key={b.id} book={b} />)}</div>
          <div className="rowx rx2">{rowB.map((b) => <ShelfTile key={b.id} book={b} />)}</div>
        </div>
      </section>

      <section className="scene spin-scene" data-scene aria-label={`${t('home.step.find')}, ${t('home.step.borrow')}, ${t('home.step.read')}`}>
        <div className="pin">
          <div className="steps">
            {(['find', 'borrow', 'read'] as const).map((k, i) => (
              <div key={k} className={`step s${i + 1}`}>
                <b aria-hidden="true">0{i + 1}</b>
                <h2>{t(`home.step.${k}`)}</h2>
                <p>{t(`home.step.${k}.text`)}</p>
              </div>
            ))}
          </div>
          <div className="spin-wrap" aria-hidden="true">
            <div className="spin">
              <img className="face front" src={spinBook?.cover_url ?? hero?.cover_url ?? ''} alt="" width={200} height={300} />
              <div className="face back"><strong>Biblio</strong></div>
            </div>
          </div>
        </div>
      </section>

      <div className="panels">
        <section className="panel p-cats">
          <h2>{t('home.categories')}</h2>
          <div className="cat-grid">
            {cats.data?.filter((c) => c.book_count > 0).map((c, i) => (
              <Link key={c.slug} className={`cat ${COLORS[i % COLORS.length]}`} to={`/books?category=${encodeURIComponent(c.slug)}`}>
                <span>{ar && c.name_ar ? c.name_ar : c.name}</span>
                <small>{c.book_count}</small>
              </Link>
            ))}
          </div>
        </section>
        {q && (
          <section className="panel p-quote" data-par aria-label={t('home.quote.by')}>
            <blockquote>
              {words.map((w, i) => <span key={i} className="qw" style={{ ['--i' as string]: (i / words.length).toFixed(3) }}>{w}{' '}</span>)}
            </blockquote>
            <p className="who">{ar && q.author_name_ar ? q.author_name_ar : q.author_name}</p>
            {q.source_url && <p className="small"><a href={q.source_url} rel="noopener noreferrer">Wikiquote (CC BY-SA)</a></p>}
          </section>
        )}
        <section className="panel p-authors">
          <h2>{t('home.authors')}</h2>
          <div className="grid">{popular.data?.authors.slice(0, 6).map((a) => <AuthorTile key={a.slug} a={a} />)}</div>
        </section>
      </div>

      <section className="cta-band reveal">
        <h2>{t('home.cta')}</h2>
        <p>{t('home.cta.lead')}</p>
        <div className="row">
          <Link className="pill" to="/libraries">{t('home.cta')}</Link>
          <Link className="pill ghost" to="/register">{t('nav.join')}</Link>
        </div>
      </section>
    </>
  );
}

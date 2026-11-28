import { useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { useI18n } from '../i18n';
import { useFetch, useReveal, useTitle } from './hooks';
import { useHeroTilt } from './HeroTilt';
import { useScrollMotion } from './useScrollMotion';
import './home-motion.css';
import Mascot from './Mascot';
import { AuthorTile, Cover, HeroBook } from './Cards';
import type { AuthorCard, BookCard, Category, Page, Quote } from './api';

// The turning book swaps to a new random catalog cover each time a face is hidden (edge-on), never repeating one
// that is showing or was just shown. Swaps happen out of sight and are preloaded, so nothing flickers.
function useSpinCovers(pool: string[], first: string) {
  const front = useRef<HTMLImageElement>(null);
  const back = useRef<HTMLImageElement>(null);
  const scene = useRef<HTMLElement>(null);
  const key = pool.join('|');
  useEffect(() => {
    const f = front.current, b = back.current, sc = scene.current;
    if (!f || !b || !sc || pool.length < 3 || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const recent: string[] = [first];
    const pick = () => {
      const avoid = new Set(recent.slice(-3));
      const opts = pool.filter((u) => !avoid.has(u));
      const u = opts[Math.floor(Math.random() * opts.length)] ?? pool[0];
      recent.push(u);
      const im = new Image(); im.src = u;
      return u;
    };
    let nextF = pick(); // for the front face once it turns away
    let nextB = '';
    b.src = pick();
    const rot = () => {
      const p = parseFloat(sc.style.getPropertyValue('--p') || '0');
      return Math.max(0, Math.min(720, (p - 0.16) * 1080));
    };
    // Zones by angle: 0-90 front, 90-270 back, 270-450 front, 450-630 back, 630-720 front.
    const zone = (a: number) => (a < 90 ? 0 : a < 270 ? 1 : a < 450 ? 2 : a < 630 ? 3 : 4);
    let z = zone(rot());
    nextB = pick();
    let raf = 0;
    const tick = () => {
      raf = 0;
      const nz = zone(rot());
      if (nz === z) return;
      // The face that just turned away gets its next cover.
      const hidden = nz % 2 === 1 ? f : b;
      if (nz % 2 === 1) { hidden.src = nextF; nextF = pick(); } else { hidden.src = nextB; nextB = pick(); }
      z = nz;
    };
    const on = () => { if (!raf) raf = requestAnimationFrame(tick); };
    window.addEventListener('scroll', on, { passive: true });
    return () => { window.removeEventListener('scroll', on); cancelAnimationFrame(raf); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);
  return { front, back, scene };
}

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
  const spinFirst = bySlug('don-quixote')?.cover_url ?? hero?.cover_url ?? '';
  const spin = useSpinCovers(items.map((b) => b.cover_url as string), spinFirst);
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

      <section ref={spin.scene} className="scene spin-scene" data-scene aria-label={`${t('home.step.find')}, ${t('home.step.borrow')}, ${t('home.step.read')}`}>
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
              <img ref={spin.front} className="face front" src={spinFirst} alt="" width={200} height={300} />
              <img ref={spin.back} className="face back" src={spinFirst} alt="" width={200} height={300} />
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

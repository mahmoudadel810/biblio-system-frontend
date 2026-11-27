import { useSearchParams } from 'react-router-dom';
import { useI18n } from '../i18n';
import { useFetch, useReveal, useTitle } from './hooks';
import { BookTile } from './Cards';
import type { BookCard, Category, Page } from './api';

const PER_PAGE = 24;

export default function BooksPage() {
  const { lang, t } = useI18n();
  const [params, setParams] = useSearchParams();
  const page = Math.max(1, Number(params.get('page')) || 1);
  const api = new URLSearchParams();
  for (const k of ['q', 'category']) {
    const v = params.get(k);
    if (v) api.set(k, v);
  }
  api.set('per_page', String(PER_PAGE));
  api.set('page', String(page));
  const books = useFetch<Page<BookCard>>(`/books?${api.toString()}`);
  const cats = useFetch<Category[]>('/categories');
  useTitle(t('books.title'));
  useReveal([books.data, lang]);
  const current = params.get('category');
  const total = books.data?.total ?? 0;
  const pages = Math.max(1, Math.ceil(total / PER_PAGE));

  // Filters reset the page so an empty page is never shown by accident.
  const setFilter = (cat: string | null) => {
    const next = new URLSearchParams(params);
    next.delete('page');
    if (cat) next.set('category', cat);
    else next.delete('category');
    setParams(next);
  };
  const goto = (p: number) => {
    const next = new URLSearchParams(params);
    if (p <= 1) next.delete('page');
    else next.set('page', String(p));
    setParams(next);
    window.scrollTo({ top: 0 });
  };
  return (
    <section className="band">
      <h1>{t('books.title')}</h1>
      {params.get('q') && <p className="muted">“{params.get('q')}”</p>}
      <div className="pills" role="group" aria-label={t('nav.categories')}>
        <button type="button" className={`pill ghost${!current ? ' on' : ''}`} aria-pressed={!current} onClick={() => setFilter(null)}>
          {t('books.all')}
        </button>
        {cats.data?.filter((c) => c.book_count > 0).map((c) => (
          <button key={c.slug} type="button" className={`pill ghost${current === c.slug ? ' on' : ''}`} aria-pressed={current === c.slug} onClick={() => setFilter(c.slug)}>
            {lang === 'ar' && c.name_ar ? c.name_ar : c.name}
          </button>
        ))}
      </div>
      {books.loading && <p className="muted" role="status">{t('loading')}</p>}
      {books.error && <p className="error" role="alert">{books.error}</p>}
      {books.data && books.data.items.length === 0 && <p className="muted">{t('books.empty')}</p>}
      <div className="grid">{books.data?.items.map((b) => <BookTile key={b.id} book={b} />)}</div>
      {pages > 1 && (
        <nav className="pager" aria-label={t('books.page')}>
          <button type="button" className="pill ghost" disabled={page <= 1} onClick={() => goto(page - 1)}>{t('books.prev')}</button>
          <bdi>{t('books.page')} {page} / {pages}</bdi>
          <button type="button" className="pill ghost" disabled={page >= pages} onClick={() => goto(page + 1)}>{t('books.next')}</button>
        </nav>
      )}
    </section>
  );
}

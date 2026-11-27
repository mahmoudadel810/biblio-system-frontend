import { useSearchParams } from 'react-router-dom';
import { useI18n } from '../i18n';
import { useFetch, useReveal } from './hooks';
import { BookTile } from './Cards';
import type { BookCard, Category, Page } from './api';

export default function BooksPage() {
  const { lang } = useI18n();
  const [params, setParams] = useSearchParams();
  const qs = params.toString();
  const books = useFetch<Page<BookCard>>(`/books?${qs}${qs ? '&' : ''}per_page=24`);
  const cats = useFetch<Category[]>('/categories');
  useReveal();
  const current = params.get('category');
  return (
    <section className="band">
      <h1>{lang === 'ar' ? 'الكتب' : 'Books'}</h1>
      <div className="pills" role="group" aria-label="Categories">
        <button type="button" className={`pill ghost${!current ? ' on' : ''}`} onClick={() => { params.delete('category'); setParams(params); }}>
          {lang === 'ar' ? 'الكل' : 'All'}
        </button>
        {cats.data?.filter((c) => c.book_count > 0).map((c) => (
          <button key={c.slug} type="button" className={`pill ghost${current === c.slug ? ' on' : ''}`} onClick={() => { params.set('category', c.slug); setParams(params); }}>
            {lang === 'ar' && c.name_ar ? c.name_ar : c.name}
          </button>
        ))}
      </div>
      {books.loading && <p className="muted" role="status">Loading</p>}
      {books.error && <p className="error" role="alert">{books.error}</p>}
      {books.data && books.data.items.length === 0 && <p className="muted">{lang === 'ar' ? 'لا توجد نتائج' : 'No books found'}</p>}
      <div className="grid">{books.data?.items.map((b) => <BookTile key={b.id} book={b} />)}</div>
    </section>
  );
}

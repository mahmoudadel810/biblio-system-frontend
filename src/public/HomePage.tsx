import { Link } from 'react-router-dom';
import { useI18n } from '../i18n';
import { useFetch, useReveal } from './hooks';
import { AuthorTile, BookTile } from './Cards';
import type { AuthorCard, BookCard, Category, Page, Quote } from './api';

export default function HomePage() {
  const { lang } = useI18n();
  const ar = lang === 'ar';
  const books = useFetch<Page<BookCard>>('/books?featured=true&per_page=8');
  const cats = useFetch<Category[]>('/categories');
  const authors = useFetch<{ books: BookCard[]; authors: AuthorCard[] }>('/popular');
  const quote = useFetch<Quote[]>('/quotes?random=true&limit=1');
  useReveal();
  const q = quote.data?.[0];
  return (
    <>
      <section className="hero">
        <h1>{ar ? 'اقرأ ما يستحق أن يُقرأ' : 'Read what is worth reading'}</h1>
        <p>{ar ? 'تصفّح الكتب والمؤلفين والاقتباسات بدون حساب. أنشئ حسابًا فقط عندما تريد الاستعارة أو القراءة.' : 'Browse books, authors and quotes without an account. Sign up only when you want to borrow or read.'}</p>
        <div className="row">
          <Link className="pill" to="/books">{ar ? 'تصفّح الكتب' : 'Browse books'}</Link>
          <Link className="pill ghost" to="/register">{ar ? 'انضم كقارئ' : 'Join as reader'}</Link>
        </div>
      </section>
      <section className="band">
        <h2>{ar ? 'على الرف الآن' : 'On the shelf'}</h2>
        {books.loading && <p className="muted" role="status">Loading</p>}
        {books.error && <p className="error" role="alert">{books.error}</p>}
        <div className="grid">{books.data?.items.map((b) => <BookTile key={b.id} book={b} />)}</div>
      </section>
      <section className="band flat-ink">
        <h2>{ar ? 'تصنيفات' : 'Browse by category'}</h2>
        <div className="pills">
          {cats.data?.filter((c) => c.book_count > 0).map((c) => (
            <Link key={c.slug} className="pill ghost light" to={`/books?category=${c.slug}`}>
              {ar && c.name_ar ? c.name_ar : c.name} <small>{c.book_count}</small>
            </Link>
          ))}
        </div>
      </section>
      {q && (
        <section className="band quote reveal">
          <blockquote>{ar && q.text_ar ? q.text_ar : q.text}</blockquote>
          <p className="muted">{ar && q.author_name_ar ? q.author_name_ar : q.author_name}</p>
        </section>
      )}
      <section className="band">
        <h2>{ar ? 'مؤلفون' : 'Authors'}</h2>
        <div className="grid">{authors.data?.authors.slice(0, 6).map((a) => <AuthorTile key={a.slug} a={a} />)}</div>
      </section>
    </>
  );
}

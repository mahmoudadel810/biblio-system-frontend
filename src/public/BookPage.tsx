import { Link, useLocation, useNavigate, useParams } from 'react-router-dom';
import { useI18n } from '../i18n';
import { useAuth } from '../auth/AuthContext';
import { useFetch, useReveal } from './hooks';
import { BookTile, Cover } from './Cards';
import type { BookDetail } from './api';

export default function BookPage() {
  const { slug } = useParams();
  const { lang } = useI18n();
  const ar = lang === 'ar';
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const { data: b, loading, error } = useFetch<BookDetail>(`/books/${slug}`);
  useReveal();
  if (loading) return <p className="band muted" role="status">Loading</p>;
  if (error || !b) return <p className="band error" role="alert">{error || 'Not found'}</p>;

  // Gate only the action: send logged-out visitors to register, then back here.
  const act = (intent: string) => {
    if (!user) navigate(`/register?next=${encodeURIComponent(location.pathname)}&intent=${intent}`);
    else navigate(`/catalog`);
  };
  const title = ar && b.title_ar ? b.title_ar : b.title;
  const desc = ar && b.description_ar ? b.description_ar : b.description;
  return (
    <article className="band book">
      <Cover book={b} />
      <div>
        <h1>{title}</h1>
        <p className="muted">
          {b.authors.map((a, i) => (
            <span key={a.name}>{i > 0 && ', '}{a.slug ? <Link to={`/authors/${a.slug}`}>{ar && a.name_ar ? a.name_ar : a.name}</Link> : a.name}</span>
          ))}
          {b.published_year ? ` · ${b.published_year}` : ''}
        </p>
        {desc && <p>{desc}</p>}
        {b.why_this_book && <><h2>{ar ? 'لماذا هذا الكتاب' : 'Why this book'}</h2><p>{ar && b.why_this_book.why_ar ? b.why_this_book.why_ar : b.why_this_book.why}</p></>}
        <div className="row">
          <button type="button" className="pill" onClick={() => act('borrow')}>{ar ? 'استعر الكتاب' : 'Borrow'}</button>
          {b.is_public_domain && <button type="button" className="pill ghost" onClick={() => act('read')}>{ar ? 'اقرأ أونلاين' : 'Read online'}</button>}
        </div>
        {!user && <p className="muted small">{ar ? 'سنطلب منك إنشاء حساب أولًا ثم نعيدك لهذه الصفحة.' : 'You will create an account first, then come back to this page.'}</p>}
        {b.availability.length > 0 && (
          <table className="avail">
            <caption>{ar ? 'التوفر' : 'Availability'}</caption>
            <tbody>{b.availability.map((a) => <tr key={a.branch}><th scope="row">{a.branch}</th><td>{a.available} / {a.total}</td></tr>)}</tbody>
          </table>
        )}
        {b.quotes.length > 0 && <><h2>{ar ? 'اقتباسات' : 'Quotes'}</h2>{b.quotes.slice(0, 3).map((q) => <blockquote key={q.id}>{ar && q.text_ar ? q.text_ar : q.text}</blockquote>)}</>}
      </div>
      {b.related.length > 0 && <section className="related"><h2>{ar ? 'كتب مشابهة' : 'Related'}</h2><div className="grid">{b.related.map((r) => <BookTile key={r.id} book={r} />)}</div></section>}
    </article>
  );
}

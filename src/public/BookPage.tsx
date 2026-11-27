import { Link, useLocation, useNavigate, useParams } from 'react-router-dom';
import { useI18n } from '../i18n';
import { useAuth } from '../auth/AuthContext';
import { useFetch, useReveal, useTitle } from './hooks';
import { useState } from 'react';
import { BookTile, Cover } from './Cards';
import BorrowDialog from './BorrowDialog';
import WhereToBuy from './WhereToBuy';
import { api, ApiError } from '../api/client';
import type { BookDetail } from './api';

export default function BookPage() {
  const { slug } = useParams();
  const { lang, t } = useI18n();
  const ar = lang === 'ar';
  const { user } = useAuth();
  const navigate = useNavigate();
  const [dlg, setDlg] = useState(false);
  const location = useLocation();
  const digital = useFetch<{ available: boolean; loan_days: number }>(`/books/${encodeURIComponent(slug ?? '')}/digital`);
  const [readErr, setReadErr] = useState('');
  const { data: b, loading, error, status } = useFetch<BookDetail>(`/books/${encodeURIComponent(slug ?? '')}`);
  useTitle(b ? (ar && b.title_ar ? b.title_ar : b.title) : '');
  useReveal([b, lang]);
  if (loading) return <p className="band muted" role="status">{t('loading')}</p>;
  if (error || !b) {
    const missing = status === 404 || status === 400;
    return <p className="band error" role="alert">{missing ? t('book.notfound') : error}</p>;
  }

  // Gate only the action: logged-out visitors register first and come back here.
  // Signed-in members are sent to the existing catalog reserve flow until the
  // rental screens ship.
  const borrow = () => {
    if (!user) navigate(`/register?next=${encodeURIComponent(location.pathname)}&intent=borrow`);
    else setDlg(true);
  };
  const read = async () => {
    if (!user) return navigate(`/register?next=${encodeURIComponent(`/read/${b.slug}`)}&intent=read`);
    setReadErr('');
    try { await api.post('/digital-loans', { book_id: b.id }); navigate(`/read/${encodeURIComponent(b.slug)}`); }
    catch (e) { setReadErr(e instanceof ApiError ? e.message : t('read.failed')); }
  };
  const hasDigital = digital.data?.available === true;
  const title = ar && b.title_ar ? b.title_ar : b.title;
  const desc = ar && b.description_ar ? b.description_ar : b.description;
  return (
    <article className="band book">
      {dlg && <BorrowDialog bookId={b.id} title={title} onClose={() => setDlg(false)} />}
      <Cover book={{ ...b, title }} eager />
      <div>
        {b.tag && <span className="tag">{b.tag}</span>}
        <h1>{title}</h1>
        {(ar && b.subtitle_ar ? b.subtitle_ar : b.subtitle) && <p className="muted">{ar && b.subtitle_ar ? b.subtitle_ar : b.subtitle}</p>}
        <p className="muted">
          {b.authors.map((a, i) => (
            <span key={a.name}>
              {i > 0 && ', '}
              {a.slug ? <Link to={`/authors/${encodeURIComponent(a.slug)}`}>{ar && a.name_ar ? a.name_ar : a.name}</Link> : a.name}
            </span>
          ))}
          {b.published_year ? <> <bdi>· {b.published_year}</bdi></> : null}
        </p>
        {desc && <p>{desc}</p>}
        {b.why_this_book && (
          <>
            <h2>{t('book.why')}</h2>
            <p>{ar && b.why_this_book.why_ar ? b.why_this_book.why_ar : b.why_this_book.why}</p>
          </>
        )}
        <div className="row">
          <button type="button" className="pill" onClick={borrow}>{t('book.borrow')}</button>
          {hasDigital && <button type="button" className="pill ghost" onClick={read}>{t('book.read')}</button>}
        </div>
        {hasDigital && <p className="muted small">{t('read.loandays').replace('{n}', String(digital.data?.loan_days ?? ''))}</p>}
        {readErr && <p className="error small" role="alert">{readErr}</p>}
        {!hasDigital && !digital.loading && <p className="muted small">{t('read.nodigital')}</p>}
        {!user && <p className="muted small">{t('book.gate')}</p>}
        {b.availability.length > 0 && (
          <table className="avail">
            <caption>{t('book.availability')}</caption>
            <tbody>
              {b.availability.map((a) => (
                <tr key={a.branch}><th scope="row">{a.branch}</th><td><bdi>{a.available} / {a.total}</bdi></td></tr>
              ))}
            </tbody>
          </table>
        )}
        <WhereToBuy slug={b.slug} />
        {b.quotes.length > 0 && (
          <>
            <h2>{t('book.quotes')}</h2>
            {b.quotes.slice(0, 3).map((q) => (
              <blockquote key={q.id}>
                {ar && q.text_ar ? q.text_ar : q.text}
                {q.source_url && <footer className="small muted"><a href={q.source_url} rel="noopener noreferrer">Wikiquote (CC BY-SA)</a></footer>}
              </blockquote>
            ))}
          </>
        )}
        <p className="small muted">{b.license ?? t('footer.credit')}</p>
      </div>
      {b.related.length > 0 && (
        <section className="related">
          <h2>{t('book.related')}</h2>
          <div className="grid">{b.related.map((r) => <BookTile key={r.id} book={r} />)}</div>
        </section>
      )}
    </article>
  );
}

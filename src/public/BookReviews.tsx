import { useCallback, useEffect, useState, type FormEvent } from 'react';
import { Link } from 'react-router-dom';
import { useI18n } from '../i18n';
import { useAuth } from '../auth/AuthContext';
import { api, ApiError } from '../api/client';
import { fmtDate } from './format';

interface Review { id: string; rating: number; body: string; author: string; created_at: string }
interface Summary { count: number; average: number | null; reviews: Review[] }
interface Mine { review: { rating: number; body: string } | null; can_review: boolean }

export function Stars({ value, label }: { value: number; label: string }) {
  return (
    <span className="stars" role="img" aria-label={label}>
      {[1, 2, 3, 4, 5].map((n) => (
        <span key={n} className={n <= Math.round(value) ? 'star on' : 'star'} aria-hidden="true">★</span>
      ))}
    </span>
  );
}

// Ratings are real: only members who borrowed or read the book can rate it. With no reviews, no average is shown.
export default function BookReviews({ slug }: { slug: string }) {
  const { t, lang } = useI18n();
  const { user } = useAuth();
  const [sum, setSum] = useState<Summary | null>(null);
  const [mine, setMine] = useState<Mine | null>(null);
  const [rating, setRating] = useState(0);
  const [body, setBody] = useState('');
  const [msg, setMsg] = useState('');
  const [err, setErr] = useState('');
  const isStaff = user?.role === 'admin' || user?.role === 'librarian';

  const load = useCallback(async () => {
    try {
      setSum(await api.get<Summary>(`/public/books/${encodeURIComponent(slug)}/reviews`));
    } catch {
      setSum({ count: 0, average: null, reviews: [] });
    }
    if (user) {
      try {
        const m = await api.get<Mine>(`/me/books/${encodeURIComponent(slug)}/review`);
        setMine(m);
        setRating(m.review?.rating ?? 0);
        setBody(m.review?.body ?? '');
      } catch {
        setMine(null);
      }
    }
  }, [slug, user]);
  useEffect(() => {
    load();
  }, [load]);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setErr('');
    setMsg('');
    if (!rating) return setErr(t('rev.pick'));
    try {
      await api.put(`/me/books/${encodeURIComponent(slug)}/review`, { rating, body });
      setMsg(t('rev.saved'));
      load();
    } catch (x) {
      setErr(x instanceof ApiError ? x.message : t('rev.failed'));
    }
  };
  const remove = async () => {
    await api.del(`/me/books/${encodeURIComponent(slug)}/review`).catch(() => {});
    setRating(0);
    setBody('');
    load();
  };
  const hide = async (id: string) => {
    await api.patch(`/reviews/${id}/hidden`, { hidden: true }).catch(() => {});
    load();
  };

  return (
    <section className="reviews" aria-labelledby="rev-h">
      <h2 id="rev-h">{t('rev.title')}</h2>
      {sum && sum.count > 0 && sum.average !== null ? (
        <p className="rev-sum">
          <Stars value={sum.average} label={`${sum.average} / 5`} /> <bdi>{sum.average}</bdi>{' '}
          <span className="muted">({sum.count} {t('rev.count')})</span>
        </p>
      ) : (
        <p className="muted">{t('rev.none')}</p>
      )}
      {sum?.reviews.map((r) => (
        <article className="review" key={r.id}>
          <div>
            <Stars value={r.rating} label={`${r.rating} / 5`} /> <strong><bdi>{r.author}</bdi></strong>{' '}
            <span className="muted small"><bdi>{fmtDate(r.created_at, lang)}</bdi></span>
          </div>
          {r.body && <p>{r.body}</p>}
          {isStaff && <button type="button" className="pill ghost" onClick={() => hide(r.id)}>{t('rev.hide')}</button>}
        </article>
      ))}
      {!user ? (
        <p className="muted small"><Link to={`/login?next=/books/${encodeURIComponent(slug)}`}>{t('rev.signin')}</Link></p>
      ) : mine?.can_review ? (
        <form className="rev-form" onSubmit={submit}>
          <h3>{mine.review ? t('rev.edit') : t('rev.write')}</h3>
          <div role="group" aria-label={t('rev.rating')} className="rev-pick">
            {[1, 2, 3, 4, 5].map((n) => (
              <button key={n} type="button" className={n <= rating ? 'star-btn on' : 'star-btn'} aria-pressed={rating === n} aria-label={`${n} / 5`} onClick={() => setRating(n)}>★</button>
            ))}
          </div>
          <label>{t('rev.body')}
            <textarea value={body} maxLength={2000} rows={3} onChange={(e) => setBody(e.target.value)} />
          </label>
          {err && <p className="error small" role="alert">{err}</p>}
          {msg && <p className="small" role="status">{msg}</p>}
          <div className="row">
            <button type="submit" className="pill">{t('rev.save')}</button>
            {mine.review && <button type="button" className="pill ghost" onClick={remove}>{t('rev.delete')}</button>}
          </div>
        </form>
      ) : mine ? (
        <p className="muted small">{t('rev.needloan')}</p>
      ) : null}
    </section>
  );
}

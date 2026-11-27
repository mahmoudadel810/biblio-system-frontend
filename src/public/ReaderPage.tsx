import { useCallback, useEffect, useRef, useState } from 'react';
import { Link, Navigate, useLocation, useParams } from 'react-router-dom';
import { api, ApiError } from '../api/client';
import { useAuth } from '../auth/AuthContext';
import { useI18n } from '../i18n';
import { fmtDate } from './format';
import { pub } from './api';
import { useTitle } from './hooks';
import type { BookDetail } from './api';

interface Page { idx: number; total: number; text: string; watermark: string; next_token: string | null; prev_token: string | null; expires_at: string }
interface Loan { id: string; expires_at: string }

// Protected reader. Content arrives one page at a time over short-lived tokens, lives only in
// React state (no content URLs in the DOM), and cannot be selected, copied, dragged or printed
// from the page. These are deterrents: a screenshot or a photo of the screen cannot be stopped.
export default function ReaderPage() {
  const { slug = '' } = useParams();
  const { user, loading: authLoading } = useAuth();
  const { lang, t } = useI18n();
  const location = useLocation();
  const [book, setBook] = useState<BookDetail | null>(null);
  const [loan, setLoan] = useState<Loan | null>(null);
  const [page, setPage] = useState<Page | null>(null);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [hidden, setHidden] = useState(false);
  const loanId = useRef('');
  const lastEvent = useRef(0);
  useTitle(book ? book.title : t('read.title'));

  const report = useCallback((kind: string) => {
    const now = Date.now();
    if (!loanId.current || now - lastEvent.current < 1500) return;
    lastEvent.current = now;
    api.post(`/digital-loans/${loanId.current}/event`, { kind }).catch(() => {});
  }, []);

  const fail = useCallback((e: unknown) => {
    const s = (e as ApiError).status;
    setPage(null);
    setError(s === 410 ? t('read.expired') : s === 403 ? t('read.revoked') : s === 429 ? t('read.slow') : s === 404 ? t('read.nodigital') : t('read.failed'));
  }, [t]);

  useEffect(() => {
    if (!user) return;
    let live = true;
    (async () => {
      try {
        const b = await pub<BookDetail>(`/books/${encodeURIComponent(slug)}`);
        if (!live) return;
        setBook(b);
        const l = await api.post<Loan & { id: string }>('/digital-loans', { book_id: b.id });
        if (!live) return;
        setLoan(l);
        loanId.current = l.id;
        const p = await api.post<Page>(`/digital-loans/${l.id}/open`);
        if (live) setPage(p);
      } catch (e) {
        if (live) fail(e);
      }
    })();
    return () => { live = false; loanId.current = ''; };
  }, [slug, user, fail]);

  // Deterrents. Each attempt is logged (rate limited) and blocked in the page.
  useEffect(() => {
    const block = (kind: string) => (e: Event) => { e.preventDefault(); report(kind); };
    const onKey = (e: KeyboardEvent) => {
      const k = e.key.toLowerCase();
      if (k === 'printscreen') { navigator.clipboard?.writeText('').catch(() => {}); report('screenshot_key'); setHidden(true); setTimeout(() => setHidden(false), 1500); }
      else if ((e.ctrlKey || e.metaKey) && ['c', 'x', 'a', 's', 'p', 'u'].includes(k)) { e.preventDefault(); report(k === 'p' ? 'print_attempt' : 'copy_attempt'); }
      else if (e.key === 'F12' || ((e.ctrlKey || e.metaKey) && e.shiftKey && ['i', 'j', 'c'].includes(k))) { e.preventDefault(); report('devtools'); }
    };
    const onVis = () => { if (document.hidden) { setHidden(true); report('blur'); } else setHidden(false); };
    const onBlur = () => { setHidden(true); report('blur'); };
    const onFocus = () => setHidden(false);
    const size = () => {
      const open = window.outerWidth - window.innerWidth > 200 || window.outerHeight - window.innerHeight > 260;
      if (open) { setHidden(true); report('devtools'); }
    };
    const c = block('copy_attempt');
    const p = block('print_attempt');
    document.addEventListener('copy', c);
    document.addEventListener('cut', c);
    document.addEventListener('contextmenu', c);
    document.addEventListener('dragstart', c);
    window.addEventListener('beforeprint', p);
    window.addEventListener('keydown', onKey);
    window.addEventListener('keyup', onKey);
    document.addEventListener('visibilitychange', onVis);
    window.addEventListener('blur', onBlur);
    window.addEventListener('focus', onFocus);
    window.addEventListener('resize', size);
    const iv = window.setInterval(size, 3000);
    return () => {
      document.removeEventListener('copy', c);
      document.removeEventListener('cut', c);
      document.removeEventListener('contextmenu', c);
      document.removeEventListener('dragstart', c);
      window.removeEventListener('beforeprint', p);
      window.removeEventListener('keydown', onKey);
      window.removeEventListener('keyup', onKey);
      document.removeEventListener('visibilitychange', onVis);
      window.removeEventListener('blur', onBlur);
      window.removeEventListener('focus', onFocus);
      window.removeEventListener('resize', size);
      window.clearInterval(iv);
    };
  }, [report]);

  if (authLoading) return <p className="band muted" role="status">{t('loading')}</p>;
  if (!user) return <Navigate to={`/login?next=${encodeURIComponent(location.pathname)}`} replace />;

  const go = async (token: string | null) => {
    if (!token || !loan || busy) return;
    setBusy(true);
    try { setPage(await api.post<Page>(`/digital-loans/${loan.id}/chunk`, { token })); window.scrollTo(0, 0); }
    catch (e) { fail(e); }
    finally { setBusy(false); }
  };
  const giveBack = async () => {
    if (!loan) return;
    await api.post(`/digital-loans/${loan.id}/return`).catch(() => {});
    setPage(null);
    setError(t('read.returned'));
  };

  return (
    <section className="band reader-wrap">
      <p className="small"><Link to={`/books/${encodeURIComponent(slug)}`}>{lang === 'ar' ? '→' : '←'} {book ? (lang === 'ar' && book.title_ar ? book.title_ar : book.title) : t('read.back')}</Link></p>
      {error && (
        <div role="alert">
          <p className="error">{error}</p>
          <Link className="pill ghost" to={`/books/${encodeURIComponent(slug)}`}>{t('read.back')}</Link>
        </div>
      )}
      {!error && !page && <p className="muted" role="status">{t('loading')}</p>}
      {page && loan && (
        <>
          <p className="muted small">{t('read.until')} <bdi>{fmtDate(loan.expires_at, lang)}</bdi> · {t('read.page')} <bdi dir="ltr">{page.idx + 1} / {page.total}</bdi></p>
          <div className={`reader${hidden ? ' reader-hidden' : ''}`} aria-live="polite" onCopy={(e) => e.preventDefault()}>
            <div className="reader-mark" aria-hidden="true">
              {Array.from({ length: 12 }, (_, i) => <span key={i}>{page.watermark}</span>)}
            </div>
            <div className="reader-text" dir="auto">{page.text}</div>
            {hidden && <p className="reader-paused" role="status">{t('read.paused')}</p>}
          </div>
          <div className="row reader-nav">
            <button type="button" className="pill ghost" disabled={!page.prev_token || busy} onClick={() => go(page.prev_token)}>{t('read.prev')}</button>
            <button type="button" className="pill" disabled={!page.next_token || busy} onClick={() => go(page.next_token)}>{t('read.next')}</button>
            <button type="button" className="pill ghost" onClick={giveBack}>{t('read.return')}</button>
          </div>
          <p className="muted small">{t('read.note')}</p>
        </>
      )}
    </section>
  );
}

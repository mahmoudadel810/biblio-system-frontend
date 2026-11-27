import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api, ApiError } from '../api/client';
import { useI18n } from '../i18n';
import { fmtDate, fmtMoney } from '../public/format';
import { reason } from '../public/BorrowDialog';

interface MyLoan { id: string; book_slug: string | null; title: string; title_ar: string | null; due_at: string; returned_at: string | null; renewals_left: number; overdue: boolean }
interface MyHold { id: string; book_slug: string | null; title: string; title_ar: string | null; status: string; expires_at: string; queue_position: number }
interface DLoan { id: string; book_slug: string | null; book_title: string; book_title_ar?: string | null; days_left: number }
interface Fine { id: string; amount: number; reason: string; status: string }

// The member's own loans, holds and fines, with the reason shown when an action is blocked.
export default function MyLibrary() {
  const { t, lang } = useI18n();
  const [loans, setLoans] = useState<MyLoan[]>([]);
  const [holds, setHolds] = useState<MyHold[]>([]);
  const [dl, setDl] = useState<DLoan[]>([]);
  const [fines, setFines] = useState<Fine[]>([]);
  const [notes, setNotes] = useState<Record<string, string>>({});

  const load = useCallback(() => {
    api.get<MyLoan[]>('/me/loans').then(setLoans).catch(() => {});
    api.get<MyHold[]>('/me/holds').then(setHolds).catch(() => {});
    api.get<DLoan[]>('/me/digital-loans').then(setDl).catch(() => {});
    api.get<Fine[]>('/fines?status=unpaid').then(setFines).catch(() => {});
  }, []);
  useEffect(load, [load]);

  const renew = async (id: string) => {
    try { await api.post(`/loans/${id}/renew`); setNotes((n) => ({ ...n, [id]: '' })); load(); }
    catch (e) { setNotes((n) => ({ ...n, [id]: renewReason((e as ApiError).message, t) })); }
  };
  const cancel = async (id: string) => { await api.post(`/reservations/${id}/cancel`).catch(() => {}); load(); };
  const name = (x: { title: string; title_ar: string | null }) => (lang === 'ar' && x.title_ar ? x.title_ar : x.title);
  const open = loans.filter((l) => !l.returned_at);
  const total = fines.reduce((s, f) => s + f.amount, 0);

  return (
    <section className="mylib">
      <h2>{t('my.loans')}</h2>
      {open.length === 0 ? <p className="muted">{t('my.noloans')}</p> : (
        <ul className="mylist">
          {open.map((l) => (
            <li key={l.id}>
              <div>
                {l.book_slug ? <Link to={`/books/${l.book_slug}`}>{name(l)}</Link> : name(l)}
                <div className="muted small">{t('borrow.due')} <bdi>{fmtDate(l.due_at, lang)}</bdi> {l.overdue && <span className="badge warn">{t('my.overdue')}</span>}</div>
                {notes[l.id] && <div className="error small" role="alert">{notes[l.id]}</div>}
              </div>
              <button type="button" className="pill ghost" onClick={() => renew(l.id)}>{t('my.renew')} <bdi>({l.renewals_left})</bdi></button>
            </li>
          ))}
        </ul>
      )}
      <h2>{t('my.digital')}</h2>
      {dl.length === 0 ? <p className="muted">{t('my.nodigital')}</p> : (
        <ul className="mylist">
          {dl.map((d) => (
            <li key={d.id}>
              <div>
                {d.book_slug ? <Link to={`/books/${d.book_slug}`}><bdi>{lang === 'ar' && d.book_title_ar ? d.book_title_ar : d.book_title}</bdi></Link> : <bdi>{lang === 'ar' && d.book_title_ar ? d.book_title_ar : d.book_title}</bdi>}
                <div className="muted small">{t('my.daysleft').replace('{n}', String(d.days_left))}</div>
              </div>
              {d.book_slug && <Link className="pill ghost" to={`/read/${d.book_slug}`}>{t('my.read')}</Link>}
            </li>
          ))}
        </ul>
      )}
      <h2>{t('my.holds')}</h2>
      {holds.length === 0 ? <p className="muted">{t('my.noholds')}</p> : (
        <ul className="mylist">
          {holds.map((h) => (
            <li key={h.id}>
              <div>
                {h.book_slug ? <Link to={`/books/${h.book_slug}`}>{name(h)}</Link> : name(h)}
                <div className="muted small">
                  {h.status === 'ready'
                    ? <>{t('my.ready')} <bdi>{fmtDate(h.expires_at, lang)}</bdi></>
                    : <>{t('borrow.position')} <bdi>{h.queue_position}</bdi></>}
                </div>
              </div>
              <button type="button" className="pill ghost" onClick={() => cancel(h.id)}>{t('my.cancel')}</button>
            </li>
          ))}
        </ul>
      )}
      <h2>{t('my.fines')}</h2>
      {fines.length === 0 ? <p className="muted">{t('my.nofines')}</p> : (
        <>
          <p><strong><bdi>{fmtMoney(total, lang)}</bdi></strong> {t('my.finesNote')}</p>
          <ul className="mylist">{fines.map((f) => <li key={f.id}><span>{f.reason}</span><bdi>{fmtMoney(f.amount, lang)}</bdi></li>)}</ul>
        </>
      )}
    </section>
  );
}

function renewReason(msg: string, t: (k: string) => string): string {
  const m = msg.toLowerCase();
  if (m.includes('waiting')) return t('my.err.waiting');
  if (m.includes('maximum')) return t('my.err.max');
  if (m.includes('overdue')) return t('my.err.overdue');
  return reason(msg, t);
}

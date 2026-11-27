import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { api, ApiError } from '../api/client';
import { useI18n } from '../i18n';
import { dateIn, fmtDate, ymd } from './format';

interface Rules { loan_days: number; max_loan_days: number; max_open_loans: number; hold_pickup_days: number }
interface Loan { due_at: string }
interface Hold { queue_position: number }

// Server messages are English; map the ones a member can hit to translated text.
export function reason(msg: string, t: (k: string) => string): string {
  const m = msg.toLowerCase();
  if (m.includes('overdue')) return t('borrow.err.overdue');
  if (m.includes('at most')) return t('borrow.err.limit');
  if (m.includes('hold queue') || m.includes('reserved')) return t('borrow.err.queue');
  if (m.includes('return date') || m.includes('days')) return t('borrow.err.date');
  return msg;
}

export default function BorrowDialog({ bookId, title, onClose }: { bookId: string; title: string; onClose: () => void }) {
  const { t, lang } = useI18n();
  const [rules, setRules] = useState<Rules | null>(null);
  const [date, setDate] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [needHold, setNeedHold] = useState(false);
  const [done, setDone] = useState<{ kind: 'loan' | 'hold'; text: string } | null>(null);
  const box = useRef<HTMLDivElement>(null);

  useEffect(() => {
    api.get<Rules>('/me/loan-rules').then((r) => { setRules(r); setDate(ymd(dateIn(r.loan_days))); }).catch((e) => setError(e.message));
    box.current?.focus();
    const key = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', key);
    return () => window.removeEventListener('keydown', key);
  }, [onClose]);

  const min = ymd(dateIn(1));
  const max = rules ? ymd(dateIn(rules.max_loan_days)) : '';
  const invalid = !!rules && (date < min || date > max);

  const submit = async () => {
    setBusy(true); setError('');
    try {
      const loan = await api.post<Loan>('/me/loans', { book_id: bookId, return_by: date });
      setDone({ kind: 'loan', text: fmtDate(loan.due_at, lang) });
    } catch (e) {
      const err = e as ApiError;
      if (err.status === 409 && /no copy|hold/i.test(err.message)) setNeedHold(true);
      else setError(reason(err.message, t));
    } finally { setBusy(false); }
  };
  const hold = async () => {
    setBusy(true); setError('');
    try {
      const h = await api.post<Hold>('/me/holds', { book_id: bookId });
      setDone({ kind: 'hold', text: String(h.queue_position) });
    } catch (e) { setError(reason((e as ApiError).message, t)); }
    finally { setBusy(false); }
  };

  return (
    <div className="dlg-back" onClick={onClose}>
      <div className="dlg" role="dialog" aria-modal="true" aria-labelledby="dlg-title" tabIndex={-1} ref={box} onClick={(e) => e.stopPropagation()}>
        <h2 id="dlg-title">{done ? t(done.kind === 'loan' ? 'borrow.done' : 'borrow.holdDone') : t(needHold ? 'borrow.nocopy' : 'borrow.title')}</h2>
        <p className="muted"><bdi>{title}</bdi></p>
        {done ? (
          <>
            <p>{done.kind === 'loan' ? <>{t('borrow.due')} <bdi>{done.text}</bdi></> : <>{t('borrow.position')} <bdi>{done.text}</bdi>. {t('borrow.pickup').replace('{n}', String(rules?.hold_pickup_days ?? 3))}</>}</p>
            <div className="row"><Link className="pill" to="/app" onClick={onClose}>{t('borrow.mine')}</Link><button type="button" className="pill ghost" onClick={onClose}>{t('close')}</button></div>
          </>
        ) : needHold ? (
          <>
            <p>{t('borrow.nocopy.body')}</p>
            <div className="row"><button type="button" className="pill" disabled={busy} onClick={hold}>{t('borrow.joinQueue')}</button><button type="button" className="pill ghost" onClick={onClose}>{t('close')}</button></div>
          </>
        ) : (
          <>
            <label className="field">{t('borrow.returnBy')}
              <input type="date" value={date} min={min} max={max} onChange={(e) => setDate(e.target.value)} disabled={!rules} />
            </label>
            {rules && <p className="muted small">{t('borrow.rule').replace('{max}', String(rules.max_loan_days))}</p>}
            {invalid && <p className="error small" role="alert">{t('borrow.err.date')}</p>}
            <div className="row"><button type="button" className="pill" disabled={busy || !rules || invalid} onClick={submit}>{t('borrow.confirm')}</button><button type="button" className="pill ghost" onClick={onClose}>{t('close')}</button></div>
          </>
        )}
        {error && <p className="error small" role="alert">{error}</p>}
      </div>
    </div>
  );
}

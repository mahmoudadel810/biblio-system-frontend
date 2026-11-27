import { useCallback, useEffect, useState, type FormEvent } from 'react';
import { useI18n } from '../i18n';
import { fmtDate, fmtMoney, fineReason } from '../public/format';
import { useCalendar } from '../public/useCalendar';
import { api, ApiError } from '../api/client';
import type { Fine, Loan, Member } from '../api/types';
import Picker, { type PickItem } from '../components/Picker';

// Staff desk: borrow by copy barcode, return and renew loans, and collect
// fine payments through the fines endpoint.
export default function LoansPage() {
  const { t, lang } = useI18n();
  useCalendar();
  const [loans, setLoans] = useState<Loan[]>([]);
  const [fines, setFines] = useState<Fine[]>([]);
  const [copy, setCopy] = useState<PickItem | null>(null);
  const [who, setWho] = useState<PickItem | null>(null);
  const [filterWho, setFilterWho] = useState<PickItem | null>(null);
  const memberFilter = filterWho?.id ?? '';
  const findMembers = useCallback(
    (q: string) =>
      api.get<Member[]>(`/members?q=${encodeURIComponent(q)}`).then((r) =>
        r.map((m) => ({ id: m.id, title: m.full_name, sub: m.email })),
      ),
    [],
  );
  const findCopies = useCallback(
    (q: string) =>
      api
        .get<{ id: string; barcode: string; status: string; book_title: string; branch_name: string }[]>(
          `/copies/lookup?q=${encodeURIComponent(q)}`,
        )
        .then((r) =>
          r.map((c) => ({ id: c.id, title: c.book_title, sub: `${c.barcode} · ${c.branch_name}` })),
        ),
    [],
  );
  const [error, setError] = useState('');
  const [more, setMore] = useState(false);
  const PAGE = 100;
  const [message, setMessage] = useState('');

  const load = useCallback(() => {
    const path = memberFilter
      ? `/loans?member_id=${encodeURIComponent(memberFilter)}`
      : '/loans';
    api
      .get<Loan[]>(path)
      .then((rows) => { setLoans(rows); setMore(rows.length === PAGE); })
      .catch((e) => setError(e.message));
    api
      .get<Fine[]>('/fines?status=unpaid')
      .then(setFines)
      .catch(() => {});
  }, [memberFilter]);

  useEffect(load, [load]);

  const loadMore = () => {
    const p = new URLSearchParams();
    if (memberFilter) p.set('member_id', memberFilter);
    p.set('offset', String(loans.length));
    api
      .get<Loan[]>(`/loans?${p.toString()}`)
      .then((rows) => { setLoans((prev) => [...prev, ...rows]); setMore(rows.length === PAGE); })
      .catch((e) => setError(e.message));
  };

  const borrow = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    setMessage('');
    try {
      await api.post('/loans', {
        copy_id: copy?.id,
        member_id: who?.id,
      });
      setCopy(null);
      setWho(null);
      setMessage(t('loans.created'));
      load();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'borrow failed');
    }
  };

  const act = async (path: string, ok: string) => {
    setError('');
    setMessage('');
    try {
      await api.post(path);
      setMessage(ok);
      load();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'action failed');
    }
  };

  return (
    <>
      <div className="panel">
        <h2>{t('loans.borrowTitle')}</h2>
        <form className="inline-form" onSubmit={borrow}>
          <Picker placeholder={t('loans.pickCopy')} search={findCopies} value={copy} onChange={setCopy} required />
          <Picker placeholder={t('loans.pickMember')} search={findMembers} value={who} onChange={setWho} required />
          <button type="submit" disabled={!copy || !who}>{t('loans.borrow')}</button>
        </form>
        {message && <p>{message}</p>}
        {error && <p className="error-text">{error}</p>}
      </div>

      <div className="panel">
        <h2>{t('staff.nav.loans')}</h2>
        <form className="inline-form" onSubmit={(e) => e.preventDefault()}>
          <Picker placeholder={t('loans.filterMember')} search={findMembers} value={filterWho} onChange={setFilterWho} />
        </form>
        <table>
          <thead>
            <tr>
              <th>{t('col.copy')}</th>
              <th>{t('col.member')}</th>
              <th>{t('col.borrowed')}</th>
              <th>{t('col.due')}</th>
              <th>{t('col.renewals')}</th>
              <th><span className="sr-only">{t('col.actions')}</span></th>
            </tr>
          </thead>
          <tbody>
            {loans.map((loan) => (
              <tr key={loan.id}>
                <td>
                  {loan.book_title ?? t('common.unknown')}
                  {loan.copy_barcode && <div className="muted">{loan.copy_barcode}</div>}
                </td>
                <td>
                  {loan.member_name ?? t('common.unknown')}
                  {loan.member_email && <div className="muted">{loan.member_email}</div>}
                </td>
                <td>{fmtDate(loan.borrowed_at, lang)}</td>
                <td>
                  {fmtDate(loan.due_at, lang)}{' '}
                  {!loan.returned_at && new Date(loan.due_at) < new Date() && (
                    <span className="badge warn">{t('loans.overdue')}</span>
                  )}
                </td>
                <td>{loan.renewed_count}</td>
                <td>
                  {loan.returned_at ? (
                    <span className="badge">{t('loans.returned')}</span>
                  ) : (
                    <>
                      <button
                        type="button"
                        className="secondary"
                        onClick={() =>
                          act(`/loans/${loan.id}/return`, t('loans.doneReturn'))
                        }
                      >
                        {t('loans.return')}
                      </button>{' '}
                      <button
                        type="button"
                        className="secondary"
                        onClick={() =>
                          act(`/loans/${loan.id}/renew`, t('loans.doneRenew'))
                        }
                      >
                        {t('loans.renew')}
                      </button>
                    </>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {more && <button type="button" className="pill ghost" onClick={loadMore}>{t('more')}</button>}
      </div>

      <div className="panel">
        <h2>{t('fines.title')}</h2>
        {fines.length === 0 ? (
          <p className="muted">{t('fines.none')}</p>
        ) : (
          <table>
            <thead>
              <tr>
                <th>{t('col.member')}</th>
                <th>{t('col.amount')}</th>
                <th>{t('col.reason')}</th>
                <th><span className="sr-only">{t('col.actions')}</span></th>
              </tr>
            </thead>
            <tbody>
              {fines.map((fine) => (
                <tr key={fine.id}>
                  <td>
                    {fine.member_name ?? t('common.unknown')}
                    {fine.member_email && <div className="muted">{fine.member_email}</div>}
                  </td>
                  <td>{fmtMoney(fine.amount, lang)}</td>
                  <td>{fineReason(fine.reason, t)}</td>
                  <td>
                    <button
                      type="button"
                      className="secondary"
                      onClick={() =>
                        act(`/fines/${fine.id}/pay`, t('fines.done'))
                      }
                    >
                      {t('fines.pay')}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </>
  );
}

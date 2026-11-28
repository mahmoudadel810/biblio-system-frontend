import { useEffect, useState } from 'react';
import { useI18n } from '../i18n';
import { fmtDate, fmtMoney } from '../public/format';
import { useCalendar } from '../public/useCalendar';
import { api } from '../api/client';
import { downloadCsv } from '../csv';
import type {
  CirculationDay,
  FinesSummary,
  OverdueLoan,
  Overview,
  PopularBook,
} from '../api/types';

export default function ReportsPage() {
  const { lang, t } = useI18n();
  useCalendar();
  const [overview, setOverview] = useState<Overview | null>(null);
  const [popular, setPopular] = useState<PopularBook[]>([]);
  const [overdue, setOverdue] = useState<OverdueLoan[]>([]);
  const [fines, setFines] = useState<FinesSummary | null>(null);
  const [activity, setActivity] = useState<CirculationDay[]>([]);
  const [error, setError] = useState('');

  useEffect(() => {
    api.get<Overview>('/stats/overview').then(setOverview).catch((e) => setError(e.message));
    api.get<PopularBook[]>('/reports/popular-books').then(setPopular).catch(() => {});
    api.get<OverdueLoan[]>('/reports/overdue').then(setOverdue).catch(() => {});
    api.get<FinesSummary>('/reports/fines-summary').then(setFines).catch(() => {});
    api
      .get<CirculationDay[]>('/reports/circulation?days=14')
      .then(setActivity)
      .catch(() => {});
  }, []);

  useEffect(() => {
    const on = () => document.body.classList.add('printing-report');
    const off = () => document.body.classList.remove('printing-report');
    on();
    return off;
  }, []);

  const stamp = new Date().toISOString().slice(0, 10);
  const exp = (name: string, head: string[], rows: unknown[][]) => () =>
    downloadCsv(`biblio-${name}-${stamp}.csv`, head.map((k) => t(k)), rows);
  const Actions = ({ onCsv }: { onCsv: () => void }) => (
    <div className="no-print rep-actions">
      <button type="button" className="pill ghost" onClick={onCsv}>{t('rep.csv')}</button>
    </div>
  );

  if (error) return <p className="error-text">{error}</p>;

  return (
    <>
      <div className="no-print rep-actions">
        <button type="button" className="pill" onClick={() => window.print()}>{t('rep.print')}</button>
      </div>
      <h1 className="print-only">{t('staff.nav.reports')} · {stamp}</h1>
      {overview && (
        <div className="stat-grid">
          <div className="stat-card">
            <div className="value">{overview.books}</div>
            <div className="label">{t('rep.books')}</div>
          </div>
          <div className="stat-card">
            <div className="value">{overview.copies}</div>
            <div className="label">{t('rep.copies')}</div>
          </div>
          <div className="stat-card">
            <div className="value">{overview.members}</div>
            <div className="label">{t('rep.members')}</div>
          </div>
          <div className="stat-card">
            <div className="value">{overview.active_loans}</div>
            <div className="label">{t('rep.active')}</div>
          </div>
          <div className="stat-card">
            <div className="value">{overview.overdue_loans}</div>
            <div className="label">{t('rep.overdue')}</div>
          </div>
          <div className="stat-card">
            <div className="value">{overview.active_reservations}</div>
            <div className="label">{t('rep.res')}</div>
          </div>
          <div className="stat-card">
            <div className="value">{fmtMoney(overview.unpaid_fines_total, lang)}</div>
            <div className="label">{t('rep.unpaid')}</div>
          </div>
        </div>
      )}

      <div className="panel">
        <h2>{t('rep.popular')}</h2>
        <Actions onCsv={exp('popular', ['rep.title','rep.isbn','rep.loans','rep.activeRes'], popular.map((b) => [b.title, b.isbn, b.loan_count, b.active_reservations]))} />
        <table>
          <thead>
            <tr>
              <th>{t('rep.title')}</th>
              <th>{t('rep.isbn')}</th>
              <th>{t('rep.loans')}</th>
              <th>{t('rep.activeRes')}</th>
            </tr>
          </thead>
          <tbody>
            {popular.map((b) => (
              <tr key={b.book_id}>
                <td>{b.title}</td>
                <td>{b.isbn}</td>
                <td>{b.loan_count}</td>
                <td>{b.active_reservations}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="panel">
        <h2>{t('rep.overdueTitle')}</h2>
        <Actions onCsv={exp('overdue', ['rep.member','rep.book','rep.barcode','rep.due','rep.late'], overdue.map((o) => [o.member_name, o.book_title, o.barcode, o.due_at.slice(0, 10), o.days_overdue]))} />
        {overdue.length === 0 ? (
          <p className="muted">{t('rep.nothing')}</p>
        ) : (
          <table>
            <thead>
              <tr>
                <th>{t('rep.member')}</th>
                <th>{t('rep.book')}</th>
                <th>{t('rep.barcode')}</th>
                <th>{t('rep.due')}</th>
                <th>{t('rep.late')}</th>
              </tr>
            </thead>
            <tbody>
              {overdue.map((o) => (
                <tr key={o.loan_id}>
                  <td>
                    {o.member_name} <span className="muted">({o.member_email})</span>
                  </td>
                  <td>{o.book_title}</td>
                  <td>{o.barcode}</td>
                  <td>{fmtDate(o.due_at, lang)}</td>
                  <td>
                    <span className="badge warn">{o.days_overdue}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {fines && (
        <div className="panel">
          <h2>{t('rep.fines')}</h2>
        <Actions onCsv={exp('fines', ['rep.fines','rep.count','rep.total'], [[t('rep.fUnpaid'), fines.unpaid_count, fines.unpaid_total], [t('rep.fPaid'), fines.paid_count, fines.paid_total], [t('rep.fWaived'), fines.waived_count, fines.waived_total]])} />
          <table>
            <thead>
              <tr>
                <th><span className="sr-only">{t('col.actions')}</span></th>
                <th>{t('rep.count')}</th>
                <th>{t('rep.total')}</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>{t('rep.fUnpaid')}</td>
                <td>{fines.unpaid_count}</td>
                <td>{fmtMoney(fines.unpaid_total, lang)}</td>
              </tr>
              <tr>
                <td>{t('rep.fPaid')}</td>
                <td>{fines.paid_count}</td>
                <td>{fmtMoney(fines.paid_total, lang)}</td>
              </tr>
              <tr>
                <td>{t('rep.fWaived')}</td>
                <td>{fines.waived_count}</td>
                <td>{fmtMoney(fines.waived_total, lang)}</td>
              </tr>
            </tbody>
          </table>
        </div>
      )}

      <div className="panel">
        <h2>{t('rep.circ')}</h2>
        <Actions onCsv={exp('circulation', ['rep.day','rep.loans','rep.returns','rep.renewals'], activity.map((d) => [d.day, d.loans, d.returns, d.renewals]))} />
        <table>
          <thead>
            <tr>
              <th>{t('rep.day')}</th>
              <th>{t('rep.loans')}</th>
              <th>{t('rep.returns')}</th>
              <th>{t('rep.renewals')}</th>
            </tr>
          </thead>
          <tbody>
            {activity.map((d) => (
              <tr key={d.day}>
                <td>{d.day}</td>
                <td>{d.loans}</td>
                <td>{d.returns}</td>
                <td>{d.renewals}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}

import { useEffect, useState } from 'react';
import { api } from '../api/client';
import { useI18n } from '../i18n';
import { fmtMoney } from '../public/format';

interface Top { name: string; name_ar: string | null; slug: string | null; count: number }
interface Data {
  months: number; copies: number; on_loan: number; open_loans: number; overdue: number; active_borrowers_30d: number;
  avg_loan_days_90d: number | null; by_month: { month: string; borrowed: number; returned: number }[];
  top_books_90d: Top[]; top_categories_90d: Top[]; fines_unpaid: number; fines_collected_90d: number;
  unmet_demand: Top[]; new_members: { month: string; count: number }[] | null;
}

// Owner analytics. Every number comes from real loans, fines and members; with no activity the page shows zeros, not samples.
export default function AnalyticsPage() {
  const { t, lang } = useI18n();
  const [d, setD] = useState<Data | null>(null);
  const [months, setMonths] = useState(12);
  const [error, setError] = useState('');
  useEffect(() => {
    api.get<Data>(`/analytics?months=${months}`).then(setD).catch((e) => setError(e.message));
  }, [months]);
  const nf = new Intl.NumberFormat(lang === 'ar' ? 'ar-SA-u-nu-latn' : 'en', { maximumFractionDigits: 1 });
  if (error) return <p className="page-message error-text" role="alert">{error}</p>;
  if (!d) return <p className="page-message">{t('loading')}</p>;
  const util = d.copies > 0 ? Math.round((d.on_loan / d.copies) * 100) : 0;
  const overdueRate = d.open_loans > 0 ? Math.round((d.overdue / d.open_loans) * 100) : 0;
  const max = Math.max(1, ...d.by_month.flatMap((m) => [m.borrowed, m.returned]));
  const label = (x: Top) => (lang === 'ar' && x.name_ar ? x.name_ar : x.name);
  const list = (rows: Top[]) => rows.length === 0 ? <p className="muted">{t('an.nodata')}</p> : (
    <ol className="an-list">{rows.map((r) => <li key={r.slug ?? r.name}><bdi>{label(r)}</bdi> <strong><bdi>{nf.format(r.count)}</bdi></strong></li>)}</ol>
  );
  const kpi = (k: string, v: string, hint?: string) => (
    <div className="an-kpi"><div className="an-v"><bdi>{v}</bdi></div><div className="muted small">{t(k)}</div>{hint && <div className="muted small">{hint}</div>}</div>
  );
  return (
    <div className="panel">
      <h2>{t('an.title')}</h2>
      <label>{t('an.range')}{' '}
        <select value={months} onChange={(e) => setMonths(Number(e.target.value))}>
          {[3, 6, 12, 24].map((m) => <option key={m} value={m}>{m} {t('an.months')}</option>)}
        </select>
      </label>
      <div className="an-kpis">
        {kpi('an.copies', nf.format(d.copies))}
        {kpi('an.util', `${util}%`, `${nf.format(d.on_loan)} / ${nf.format(d.copies)}`)}
        {kpi('an.borrowers', nf.format(d.active_borrowers_30d))}
        {kpi('an.avgdays', d.avg_loan_days_90d === null ? '-' : nf.format(d.avg_loan_days_90d))}
        {kpi('an.overdue', `${nf.format(d.overdue)}`, d.open_loans > 0 ? `${overdueRate}% ${t('an.ofopen')}` : undefined)}
        {kpi('an.unpaid', fmtMoney(d.fines_unpaid, lang))}
        {kpi('an.collected', fmtMoney(d.fines_collected_90d, lang))}
      </div>
      <h3>{t('an.permonth')}</h3>
      <div className="an-legend small"><span className="an-key borrowed" aria-hidden="true" /> {t('an.borrowed')} <span className="an-key returned" aria-hidden="true" /> {t('an.returned')}</div>
      <div className="an-bars" role="img" aria-label={t('an.permonth')}>
        {d.by_month.map((m) => (
          <div className="an-col" key={m.month}>
            <div className="an-pair">
              <div className="an-bar borrowed" style={{ blockSize: `${(m.borrowed / max) * 100}%` }} title={`${m.borrowed}`} />
              <div className="an-bar returned" style={{ blockSize: `${(m.returned / max) * 100}%` }} title={`${m.returned}`} />
            </div>
            <div className="an-m small" dir="ltr">{m.month.slice(2)}</div>
          </div>
        ))}
      </div>
      <table className="an-table">
        <caption className="sr-only">{t('an.permonth')}</caption>
        <thead><tr><th scope="col">{t('an.month')}</th><th scope="col">{t('an.borrowed')}</th><th scope="col">{t('an.returned')}</th></tr></thead>
        <tbody>{d.by_month.map((m) => <tr key={m.month}><th scope="row" dir="ltr">{m.month}</th><td>{m.borrowed}</td><td>{m.returned}</td></tr>)}</tbody>
      </table>
      <h3>{t('an.topbooks')}</h3>{list(d.top_books_90d)}
      <h3>{t('an.topcats')}</h3>{list(d.top_categories_90d)}
      <h3>{t('an.demand')}</h3>
      <p className="muted small">{t('an.demand.help')}</p>
      {list(d.unmet_demand)}
      {d.new_members && (<><h3>{t('an.newmembers')}</h3>
        <p><bdi>{nf.format(d.new_members.reduce((s, m) => s + m.count, 0))}</bdi> {t('an.newmembers.sum')}</p></>)}
    </div>
  );
}

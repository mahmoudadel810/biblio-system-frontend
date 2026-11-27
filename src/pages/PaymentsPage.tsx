import { useCallback, useEffect, useState, type FormEvent } from 'react';
import { useI18n } from '../i18n';
import { fmtDateTime, fmtMoney, fineReason } from '../public/format';
import { useCalendar } from '../public/useCalendar';
import { api, ApiError } from '../api/client';
import type { Fine, Payment, PaymentSummary } from '../api/types';

export default function PaymentsPage() {
  const { lang, t } = useI18n();
  useCalendar();
  const [payments, setPayments] = useState<Payment[]>([]);
  const [summary, setSummary] = useState<PaymentSummary | null>(null);
  const [unpaid, setUnpaid] = useState<Fine[]>([]);
  const [form, setForm] = useState({ fineId: '', method: 'cash' });
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  const load = useCallback(() => {
    api
      .get<Payment[]>('/payments')
      .then(setPayments)
      .catch((e) => setError(e.message));
    api
      .get<PaymentSummary>('/payments/summary')
      .then(setSummary)
      .catch(() => {});
    api
      .get<Fine[]>('/fines?status=unpaid')
      .then(setUnpaid)
      .catch(() => {});
  }, []);

  useEffect(load, [load]);

  const collect = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    setMessage('');
    try {
      await api.post('/payments', {
        fine_id: form.fineId,
        method: form.method,
      });
      setForm({ fineId: '', method: 'cash' });
      setMessage(t('pay.saved'));
      load();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : t('pay.failed'));
    }
  };

  return (
    <>
      {summary && (
        <div className="stat-grid">
          <div className="stat-card">
            <div className="value">{fmtMoney(summary.collected, lang)}</div>
            <div className="label">{t('pay.collected').replace('{n}', String(summary.days))}</div>
          </div>
          <div className="stat-card">
            <div className="value">{summary.payments}</div>
            <div className="label">{t('pay.count')}</div>
          </div>
          {summary.by_method.map((m) => (
            <div className="stat-card" key={m.method}>
              <div className="value">{fmtMoney(m.total, lang)}</div>
              <div className="label">
                {t(`common.${m.method}`)} ({m.payments})
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="panel">
        <h2>{t('pay.collect')}</h2>
        <form className="inline-form" onSubmit={collect}>
          <select
            aria-label={t('pay.unpaid')}
            value={form.fineId}
            onChange={(e) => setForm({ ...form, fineId: e.target.value })}
            required
          >
            <option value="">{t('pay.unpaid')}</option>
            {unpaid.map((f) => (
              <option key={f.id} value={f.id}>
                {fmtMoney(f.amount, lang)} - {fineReason(f.reason, t)}
              </option>
            ))}
          </select>
          <select
            aria-label={t('pay.method')}
            value={form.method}
            onChange={(e) => setForm({ ...form, method: e.target.value })}
          >
            <option value="cash">{t('common.cash')}</option>
            <option value="card">{t('common.card')}</option>
            <option value="transfer">{t('common.transfer')}</option>
          </select>
          <button type="submit">{t('pay.record')}</button>
        </form>
        {message && <p>{message}</p>}
        {error && <p className="error-text">{error}</p>}
      </div>

      <div className="panel">
        <h2>{t('pay.ledger')}</h2>
        <table>
          <thead>
            <tr>
              <th>{t('pay.when')}</th>
              <th>{t('pay.member')}</th>
              <th>{t('pay.amount')}</th>
              <th>{t('pay.method')}</th>
            </tr>
          </thead>
          <tbody>
            {payments.map((p) => (
              <tr key={p.id}>
                <td>{fmtDateTime(p.created_at, lang)}</td>
                <td>{p.member_name ?? t('common.unknown')}</td>
                <td>{fmtMoney(p.amount, lang)}</td>
                <td>{t(`common.${p.method}`)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}

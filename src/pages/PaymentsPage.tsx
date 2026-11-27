import { useCallback, useEffect, useState, type FormEvent } from 'react';
import { api, ApiError } from '../api/client';
import type { Fine, Payment, PaymentSummary } from '../api/types';

export default function PaymentsPage() {
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
      setMessage('Payment recorded.');
      load();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'payment failed');
    }
  };

  return (
    <>
      {summary && (
        <div className="stat-grid">
          <div className="stat-card">
            <div className="value">{summary.collected.toFixed(2)}</div>
            <div className="label">Collected (last {summary.days} days)</div>
          </div>
          <div className="stat-card">
            <div className="value">{summary.payments}</div>
            <div className="label">Payments</div>
          </div>
          {summary.by_method.map((m) => (
            <div className="stat-card" key={m.method}>
              <div className="value">{m.total.toFixed(2)}</div>
              <div className="label">
                {m.method} ({m.payments})
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="panel">
        <h2>Collect a fine payment</h2>
        <form className="inline-form" onSubmit={collect}>
          <select
            value={form.fineId}
            onChange={(e) => setForm({ ...form, fineId: e.target.value })}
            required
          >
            <option value="">Unpaid fine</option>
            {unpaid.map((f) => (
              <option key={f.id} value={f.id}>
                {f.amount.toFixed(2)} - {f.reason}
              </option>
            ))}
          </select>
          <select
            value={form.method}
            onChange={(e) => setForm({ ...form, method: e.target.value })}
          >
            <option value="cash">cash</option>
            <option value="card">card</option>
            <option value="transfer">transfer</option>
          </select>
          <button type="submit">Record payment</button>
        </form>
        {message && <p>{message}</p>}
        {error && <p className="error-text">{error}</p>}
      </div>

      <div className="panel">
        <h2>Payment ledger</h2>
        <table>
          <thead>
            <tr>
              <th>When</th>
              <th>Member</th>
              <th>Amount</th>
              <th>Method</th>
            </tr>
          </thead>
          <tbody>
            {payments.map((p) => (
              <tr key={p.id}>
                <td>{new Date(p.created_at).toLocaleString()}</td>
                <td className="muted">{p.member_id}</td>
                <td>{p.amount.toFixed(2)}</td>
                <td>{p.method}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}

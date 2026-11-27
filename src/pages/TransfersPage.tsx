import { useCallback, useEffect, useState, type FormEvent } from 'react';
import { useI18n } from '../i18n';
import { fmtDate } from '../public/format';
import { useCalendar } from '../public/useCalendar';
import { api, ApiError } from '../api/client';
import type { Branch, Transfer } from '../api/types';

export default function TransfersPage() {
  const { lang } = useI18n();
  useCalendar();
  const [transfers, setTransfers] = useState<Transfer[]>([]);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [form, setForm] = useState({ copyId: '', toBranchId: '' });
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  const branchName = (id: string) =>
    branches.find((b) => b.id === id)?.name ?? id;

  const load = useCallback(() => {
    api
      .get<Transfer[]>('/transfers')
      .then(setTransfers)
      .catch((e) => setError(e.message));
    api
      .get<Branch[]>('/branches')
      .then(setBranches)
      .catch(() => {});
  }, []);

  useEffect(load, [load]);

  const request = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    setMessage('');
    try {
      await api.post('/transfers', {
        copy_id: form.copyId,
        to_branch_id: form.toBranchId,
      });
      setForm({ copyId: '', toBranchId: '' });
      setMessage('Transfer requested.');
      load();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'request failed');
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
        <h2>Request a transfer</h2>
        <form className="inline-form" onSubmit={request}>
          <input
            placeholder="Copy ID"
            value={form.copyId}
            onChange={(e) => setForm({ ...form, copyId: e.target.value })}
            required
          />
          <select
            value={form.toBranchId}
            onChange={(e) => setForm({ ...form, toBranchId: e.target.value })}
            required
          >
            <option value="">Destination branch</option>
            {branches
              .filter((b) => b.is_active)
              .map((b) => (
                <option key={b.id} value={b.id}>
                  {b.name}
                </option>
              ))}
          </select>
          <button type="submit">Request</button>
        </form>
        {message && <p>{message}</p>}
        {error && <p className="error-text">{error}</p>}
      </div>

      <div className="panel">
        <h2>Transfers</h2>
        <table>
          <thead>
            <tr>
              <th>Copy</th>
              <th>From</th>
              <th>To</th>
              <th>Status</th>
              <th>Requested</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {transfers.map((t) => (
              <tr key={t.id}>
                <td className="muted">{t.copy_id}</td>
                <td>{branchName(t.from_branch_id)}</td>
                <td>{branchName(t.to_branch_id)}</td>
                <td>
                  <span
                    className={`badge ${t.status === 'in_transit' ? 'warn' : ''}`}
                  >
                    {t.status}
                  </span>
                </td>
                <td>{fmtDate(t.created_at, lang)}</td>
                <td>
                  {t.status === 'in_transit' && (
                    <>
                      <button
                        type="button"
                        className="secondary"
                        onClick={() =>
                          act(`/transfers/${t.id}/receive`, 'Received.')
                        }
                      >
                        Receive
                      </button>{' '}
                      <button
                        type="button"
                        className="danger"
                        onClick={() =>
                          act(`/transfers/${t.id}/cancel`, 'Cancelled.')
                        }
                      >
                        Cancel
                      </button>
                    </>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}

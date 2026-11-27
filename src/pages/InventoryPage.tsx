import { useCallback, useEffect, useState, type FormEvent } from 'react';
import { api, ApiError } from '../api/client';
import type { Adjustment, Branch, StockLevel } from '../api/types';

export default function InventoryPage() {
  const [stock, setStock] = useState<StockLevel[]>([]);
  const [adjustments, setAdjustments] = useState<Adjustment[]>([]);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [branchFilter, setBranchFilter] = useState('');
  const [form, setForm] = useState({ copyId: '', toStatus: 'lost', reason: '' });
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  const load = useCallback(() => {
    const stockPath = branchFilter
      ? `/inventory/stock?branch_id=${encodeURIComponent(branchFilter)}`
      : '/inventory/stock';
    api
      .get<StockLevel[]>(stockPath)
      .then(setStock)
      .catch((e) => setError(e.message));
    api
      .get<Adjustment[]>('/inventory/adjustments')
      .then(setAdjustments)
      .catch(() => {});
  }, [branchFilter]);

  useEffect(() => {
    load();
    api
      .get<Branch[]>('/branches')
      .then(setBranches)
      .catch(() => {});
  }, [load]);

  const branchName = (id: string) =>
    branches.find((b) => b.id === id)?.name ?? id;

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    setMessage('');
    try {
      await api.post('/inventory/adjustments', {
        copy_id: form.copyId,
        to_status: form.toStatus,
        reason: form.reason,
      });
      setForm({ copyId: '', toStatus: 'lost', reason: '' });
      setMessage('Adjustment recorded.');
      load();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'adjustment failed');
    }
  };

  return (
    <>
      <div className="panel">
        <h2>Stock levels</h2>
        <form className="inline-form" onSubmit={(e) => e.preventDefault()}>
          <select
            value={branchFilter}
            onChange={(e) => setBranchFilter(e.target.value)}
          >
            <option value="">All branches</option>
            {branches.map((b) => (
              <option key={b.id} value={b.id}>
                {b.name}
              </option>
            ))}
          </select>
        </form>
        <table>
          <thead>
            <tr>
              <th>Branch</th>
              <th>Status</th>
              <th>Copies</th>
            </tr>
          </thead>
          <tbody>
            {stock.map((row) => (
              <tr key={`${row.branch_id}-${row.status}`}>
                <td>{branchName(row.branch_id)}</td>
                <td>{row.status}</td>
                <td>{row.copies}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="panel">
        <h2>Record an adjustment</h2>
        <form className="inline-form" onSubmit={submit}>
          <input
            placeholder="Copy ID"
            value={form.copyId}
            onChange={(e) => setForm({ ...form, copyId: e.target.value })}
            required
          />
          <select
            value={form.toStatus}
            onChange={(e) => setForm({ ...form, toStatus: e.target.value })}
          >
            <option value="available">available</option>
            <option value="lost">lost</option>
            <option value="maintenance">maintenance</option>
          </select>
          <input
            placeholder="Reason"
            value={form.reason}
            onChange={(e) => setForm({ ...form, reason: e.target.value })}
            required
          />
          <button type="submit">Record</button>
        </form>
        {message && <p>{message}</p>}
        {error && <p className="error-text">{error}</p>}
      </div>

      <div className="panel">
        <h2>Adjustment history</h2>
        <table>
          <thead>
            <tr>
              <th>When</th>
              <th>Copy</th>
              <th>From</th>
              <th>To</th>
              <th>Reason</th>
            </tr>
          </thead>
          <tbody>
            {adjustments.map((a) => (
              <tr key={a.id}>
                <td>{new Date(a.created_at).toLocaleString()}</td>
                <td className="muted">{a.copy_id}</td>
                <td>{a.from_status}</td>
                <td>{a.to_status}</td>
                <td>{a.reason}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}

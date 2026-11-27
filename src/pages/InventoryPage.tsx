import { useCallback, useEffect, useState, type FormEvent } from 'react';
import { useI18n } from '../i18n';
import { usePager } from '../components/usePager';
import { fmtDateTime } from '../public/format';
import { useCalendar } from '../public/useCalendar';
import { api, ApiError } from '../api/client';
import type { Adjustment, Branch, StockLevel } from '../api/types';
import Picker, { type PickItem } from '../components/Picker';
import { findCopies } from '../components/lookups';


export default function InventoryPage() {
  const { lang, t } = useI18n();
  const st = (v: string) => { const r = t(`copy.s.${v}`); return r === `copy.s.${v}` ? v : r; };
  useCalendar();
  const [stock, setStock] = useState<StockLevel[]>([]);
  const pager = usePager<Adjustment>('/inventory/adjustments', 100);
  const adjustments = pager.rows;
  const [branches, setBranches] = useState<Branch[]>([]);
  const [branchFilter, setBranchFilter] = useState('');
  const [form, setForm] = useState({ copyId: '', toStatus: 'lost', reason: '' });
  const [copyPick, setCopyPick] = useState<PickItem | null>(null);
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
    pager.reload();
  }, [branchFilter]);

  useEffect(() => {
    load();
    api
      .get<Branch[]>('/branches')
      .then(setBranches)
      .catch(() => {});
  }, [load]);

  const branchName = (id: string) =>
    branches.find((b) => b.id === id)?.name ?? t('common.unknown');

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
      setCopyPick(null);
      setMessage(t('inv.saved'));
      load();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : t('inv.failed'));
    }
  };

  return (
    <>
      <div className="panel">
        <h2>{t('inv.stock')}</h2>
        <form className="inline-form" onSubmit={(e) => e.preventDefault()}>
          <select
            aria-label={t('inv.allBranches')}
            value={branchFilter}
            onChange={(e) => setBranchFilter(e.target.value)}
          >
            <option value="">{t('inv.allBranches')}</option>
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
              <th>{t('inv.branch')}</th>
              <th>{t('common.status')}</th>
              <th>{t('inv.copies')}</th>
            </tr>
          </thead>
          <tbody>
            {stock.map((row) => (
              <tr key={`${row.branch_id}-${row.status}`}>
                <td>{branchName(row.branch_id)}</td>
                <td>{st(row.status)}</td>
                <td>{row.copies}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="panel">
        <h2>{t('inv.record')}</h2>
        <form className="inline-form" onSubmit={submit}>
          <Picker
            placeholder={t('loans.pickCopy')}
            search={findCopies}
            value={copyPick}
            onChange={(it) => { setCopyPick(it); setForm({ ...form, copyId: it?.id ?? '' }); }}
            required
          />
          <select
            aria-label={t('inv.to')}
            value={form.toStatus}
            onChange={(e) => setForm({ ...form, toStatus: e.target.value })}
          >
            <option value="available">{st('available')}</option>
            <option value="lost">{st('lost')}</option>
            <option value="maintenance">{st('maintenance')}</option>
          </select>
          <input
            placeholder={t('inv.reason')}
            value={form.reason}
            onChange={(e) => setForm({ ...form, reason: e.target.value })}
            required
          />
          <button type="submit">{t('inv.recordBtn')}</button>
        </form>
        {message && <p>{message}</p>}
        {error && <p className="error-text">{error}</p>}
      </div>

      <div className="panel">
        <h2>{t('inv.history')}</h2>
        <table>
          <thead>
            <tr>
              <th>{t('pay.when')}</th>
              <th>{t('inv.copy')}</th>
              <th>{t('inv.from')}</th>
              <th>{t('inv.to')}</th>
              <th>{t('inv.reason')}</th>
            </tr>
          </thead>
          <tbody>
            {adjustments.map((a) => (
              <tr key={a.id}>
                <td>{fmtDateTime(a.created_at, lang)}</td>
                <td>{a.copy_label ?? t('common.unknown')}</td>
                <td>{st(a.from_status)}</td>
                <td>{st(a.to_status)}</td>
                <td>{a.reason}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {pager.more && <button type="button" className="pill ghost" onClick={pager.loadMore}>{t('more')}</button>}
      </div>
    </>
  );
}

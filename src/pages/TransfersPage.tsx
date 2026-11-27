import { useCallback, useEffect, useState, type FormEvent } from 'react';
import { useI18n } from '../i18n';
import { fmtDate } from '../public/format';
import { useCalendar } from '../public/useCalendar';
import { api, ApiError } from '../api/client';
import type { Branch, Transfer } from '../api/types';
import Picker, { type PickItem } from '../components/Picker';
import { findCopies } from '../components/lookups';


export default function TransfersPage() {
  const { lang, t } = useI18n();
  useCalendar();
  const [transfers, setTransfers] = useState<Transfer[]>([]);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [form, setForm] = useState({ copyId: '', toBranchId: '' });
  const [copyPick, setCopyPick] = useState<PickItem | null>(null);
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
      setCopyPick(null);
      setMessage(t('tr.requested'));
      load();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : t('tr.reqFail'));
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
      setError(err instanceof ApiError ? err.message : t('tr.actFail'));
    }
  };

  return (
    <>
      <div className="panel">
        <h2>{t('tr.req')}</h2>
        <form className="inline-form" onSubmit={request}>
          <Picker
            placeholder={t('loans.pickCopy')}
            search={findCopies}
            value={copyPick}
            onChange={(it) => { setCopyPick(it); setForm({ ...form, copyId: it?.id ?? '' }); }}
            required
          />
          <select
            aria-label={t('tr.dest')}
            value={form.toBranchId}
            onChange={(e) => setForm({ ...form, toBranchId: e.target.value })}
            required
          >
            <option value="">{t('tr.dest')}</option>
            {branches
              .filter((b) => b.is_active)
              .map((b) => (
                <option key={b.id} value={b.id}>
                  {b.name}
                </option>
              ))}
          </select>
          <button type="submit">{t('tr.requestBtn')}</button>
        </form>
        {message && <p>{message}</p>}
        {error && <p className="error-text">{error}</p>}
      </div>

      <div className="panel">
        <h2>{t('tr.title')}</h2>
        <table>
          <thead>
            <tr>
              <th>{t('tr.copy')}</th>
              <th>{t('tr.from')}</th>
              <th>{t('tr.to')}</th>
              <th>{t('common.status')}</th>
              <th>{t('tr.reqAt')}</th>
              <th><span className="sr-only">{t('col.actions')}</span></th>
            </tr>
          </thead>
          <tbody>
            {transfers.map((x) => (
              <tr key={x.id}>
                <td>{x.copy_label ?? t('common.unknown')}</td>
                <td>{branchName(x.from_branch_id)}</td>
                <td>{branchName(x.to_branch_id)}</td>
                <td>
                  <span
                    className={`badge ${x.status === 'in_transit' ? 'warn' : ''}`}
                  >
                    {t(`tr.s.${x.status}`)}
                  </span>
                </td>
                <td>{fmtDate(x.created_at, lang)}</td>
                <td>
                  {x.status === 'in_transit' && (
                    <>
                      <button
                        type="button"
                        className="secondary"
                        onClick={() =>
                          act(`/transfers/${x.id}/receive`, t('tr.received'))
                        }
                      >
                        {t('tr.receive')}
                      </button>{' '}
                      <button
                        type="button"
                        className="danger"
                        onClick={() =>
                          act(`/transfers/${x.id}/cancel`, t('tr.cancelled'))
                        }
                      >
                        {t('tr.cancel')}
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

import { useCallback, useEffect, useState, type FormEvent } from 'react';
import { api, ApiError } from '../api/client';
import type { Branch, Member, Role } from '../api/types';
import { useAuth } from '../auth/AuthContext';
import { useI18n } from '../i18n';
import { usePager } from '../components/usePager';

export default function MembersPage() {
  const { user } = useAuth();
  const { t } = useI18n();
  const isAdmin = user?.role === 'admin';
  const pager = usePager<Member>('/members', 200);
  const members = pager.rows;
  const [branches, setBranches] = useState<Branch[]>([]);
  const [branchForm, setBranchForm] = useState({ name: '', address: '' });
  const [error, setError] = useState('');

  const load = useCallback(() => {
    pager.reload();
    api
      .get<Branch[]>('/branches')
      .then(setBranches)
      .catch(() => {});
  }, []);

  useEffect(load, [load]);

  const update = async (id: string, patch: { role?: Role; is_active?: boolean }) => {
    setError('');
    try {
      await api.patch(`/members/${id}`, patch);
      load();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : t('mem.updFail'));
    }
  };

  const addBranch = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    try {
      await api.post('/branches', branchForm);
      setBranchForm({ name: '', address: '' });
      load();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : t('mem.branchFail'));
    }
  };

  return (
    <>
      <div className="panel">
        <h2>{t('mem.title')}</h2>
        {error && <p className="error-text">{error}</p>}
        <table>
          <thead>
            <tr>
              <th>{t('common.name')}</th>
              <th>{t('common.email')}</th>
              <th>{t('common.role')}</th>
              <th>{t('common.status')}</th>
              {isAdmin && <th><span className="sr-only">{t('col.actions')}</span></th>}
            </tr>
          </thead>
          <tbody>
            {members.map((m) => (
              <tr key={m.id}>
                <td>{m.full_name}</td>
                <td>{m.email}</td>
                <td>
                  {isAdmin ? (
                    <select
                      aria-label={`${t('common.role')} ${m.full_name}`}
                      value={m.role}
                      onChange={(e) =>
                        update(m.id, { role: e.target.value as Role })
                      }
                    >
                      <option value="member">{t('role.member')}</option>
                      <option value="assistant">{t('role.assistant')}</option>
                      <option value="librarian">{t('role.librarian')}</option>
                      <option value="admin">{t('role.admin')}</option>
                    </select>
                  ) : (
                    t(`role.${m.role}`)
                  )}
                </td>
                <td>
                  {m.is_active ? (
                    <span className="badge ok">{t('common.active')}</span>
                  ) : (
                    <span className="badge warn">{t('common.inactive')}</span>
                  )}
                </td>
                {isAdmin && (
                  <td>
                    <button
                      type="button"
                      className={m.is_active ? 'danger' : 'secondary'}
                      onClick={() => update(m.id, { is_active: !m.is_active })}
                    >
                      {m.is_active ? t('mem.deactivate') : t('mem.activate')}
                    </button>
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
        {pager.more && <button type="button" className="pill ghost" onClick={pager.loadMore}>{t('more')}</button>}
      </div>

      <div className="panel">
        <h2>{t('mem.branches')}</h2>
        <table>
          <thead>
            <tr>
              <th>{t('common.name')}</th>
              <th>{t('common.address')}</th>
              <th>{t('common.status')}</th>
            </tr>
          </thead>
          <tbody>
            {branches.map((b) => (
              <tr key={b.id}>
                <td>{b.name}</td>
                <td>{b.address}</td>
                <td>{b.is_active ? t('common.active') : t('common.inactive')}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {isAdmin && (
          <form className="inline-form" onSubmit={addBranch}>
            <input
              placeholder={t('mem.branchName')}
              value={branchForm.name}
              onChange={(e) =>
                setBranchForm({ ...branchForm, name: e.target.value })
              }
              required
            />
            <input
              placeholder={t('common.address')}
              value={branchForm.address}
              onChange={(e) =>
                setBranchForm({ ...branchForm, address: e.target.value })
              }
              required
            />
            <button type="submit">{t('mem.addBranch')}</button>
          </form>
        )}
      </div>
    </>
  );
}

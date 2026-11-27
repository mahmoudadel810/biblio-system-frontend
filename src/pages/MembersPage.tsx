import { useCallback, useEffect, useState, type FormEvent } from 'react';
import { api, ApiError } from '../api/client';
import type { Branch, Member, Role } from '../api/types';
import { useAuth } from '../auth/AuthContext';

export default function MembersPage() {
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin';
  const [members, setMembers] = useState<Member[]>([]);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [branchForm, setBranchForm] = useState({ name: '', address: '' });
  const [error, setError] = useState('');

  const load = useCallback(() => {
    api
      .get<Member[]>('/members')
      .then(setMembers)
      .catch((e) => setError(e.message));
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
      setError(err instanceof ApiError ? err.message : 'update failed');
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
      setError(err instanceof ApiError ? err.message : 'could not add branch');
    }
  };

  return (
    <>
      <div className="panel">
        <h2>Members</h2>
        {error && <p className="error-text">{error}</p>}
        <table>
          <thead>
            <tr>
              <th>Name</th>
              <th>Email</th>
              <th>Role</th>
              <th>Status</th>
              {isAdmin && <th></th>}
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
                      value={m.role}
                      onChange={(e) =>
                        update(m.id, { role: e.target.value as Role })
                      }
                    >
                      <option value="member">member</option>
                      <option value="librarian">librarian</option>
                      <option value="admin">admin</option>
                    </select>
                  ) : (
                    m.role
                  )}
                </td>
                <td>
                  {m.is_active ? (
                    <span className="badge ok">active</span>
                  ) : (
                    <span className="badge warn">inactive</span>
                  )}
                </td>
                {isAdmin && (
                  <td>
                    <button
                      type="button"
                      className={m.is_active ? 'danger' : 'secondary'}
                      onClick={() => update(m.id, { is_active: !m.is_active })}
                    >
                      {m.is_active ? 'Deactivate' : 'Activate'}
                    </button>
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="panel">
        <h2>Branches</h2>
        <table>
          <thead>
            <tr>
              <th>Name</th>
              <th>Address</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {branches.map((b) => (
              <tr key={b.id}>
                <td>{b.name}</td>
                <td>{b.address}</td>
                <td>{b.is_active ? 'active' : 'inactive'}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {isAdmin && (
          <form className="inline-form" onSubmit={addBranch}>
            <input
              placeholder="Branch name"
              value={branchForm.name}
              onChange={(e) =>
                setBranchForm({ ...branchForm, name: e.target.value })
              }
              required
            />
            <input
              placeholder="Address"
              value={branchForm.address}
              onChange={(e) =>
                setBranchForm({ ...branchForm, address: e.target.value })
              }
              required
            />
            <button type="submit">Add branch</button>
          </form>
        )}
      </div>
    </>
  );
}

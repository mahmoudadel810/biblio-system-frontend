import { useCallback, useEffect, useState, type FormEvent } from 'react';
import { api, ApiError } from '../api/client';
import type { Fine, Loan } from '../api/types';

// Staff desk: borrow by copy barcode, return and renew loans, and collect
// fine payments through the fines endpoint.
export default function LoansPage() {
  const [loans, setLoans] = useState<Loan[]>([]);
  const [fines, setFines] = useState<Fine[]>([]);
  const [memberFilter, setMemberFilter] = useState('');
  const [borrowForm, setBorrowForm] = useState({ copyId: '', memberId: '' });
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  const load = useCallback(() => {
    const path = memberFilter
      ? `/loans?member_id=${encodeURIComponent(memberFilter)}`
      : '/loans';
    api
      .get<Loan[]>(path)
      .then(setLoans)
      .catch((e) => setError(e.message));
    api
      .get<Fine[]>('/fines?status=unpaid')
      .then(setFines)
      .catch(() => {});
  }, [memberFilter]);

  useEffect(load, [load]);

  const borrow = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    setMessage('');
    try {
      await api.post('/loans', {
        copy_id: borrowForm.copyId,
        member_id: borrowForm.memberId,
      });
      setBorrowForm({ copyId: '', memberId: '' });
      setMessage('Loan created.');
      load();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'borrow failed');
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
        <h2>Borrow a copy</h2>
        <form className="inline-form" onSubmit={borrow}>
          <input
            placeholder="Copy ID"
            value={borrowForm.copyId}
            onChange={(e) =>
              setBorrowForm({ ...borrowForm, copyId: e.target.value })
            }
            required
          />
          <input
            placeholder="Member ID"
            value={borrowForm.memberId}
            onChange={(e) =>
              setBorrowForm({ ...borrowForm, memberId: e.target.value })
            }
            required
          />
          <button type="submit">Borrow</button>
        </form>
        {message && <p>{message}</p>}
        {error && <p className="error-text">{error}</p>}
      </div>

      <div className="panel">
        <h2>Loans</h2>
        <form className="inline-form" onSubmit={(e) => e.preventDefault()}>
          <input
            placeholder="Filter by member ID"
            value={memberFilter}
            onChange={(e) => setMemberFilter(e.target.value)}
          />
        </form>
        <table>
          <thead>
            <tr>
              <th>Copy</th>
              <th>Member</th>
              <th>Borrowed</th>
              <th>Due</th>
              <th>Renewals</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {loans.map((loan) => (
              <tr key={loan.id}>
                <td className="muted">{loan.copy_id}</td>
                <td className="muted">{loan.member_id}</td>
                <td>{new Date(loan.borrowed_at).toLocaleDateString()}</td>
                <td>
                  {new Date(loan.due_at).toLocaleDateString()}{' '}
                  {!loan.returned_at && new Date(loan.due_at) < new Date() && (
                    <span className="badge warn">overdue</span>
                  )}
                </td>
                <td>{loan.renewed_count}</td>
                <td>
                  {loan.returned_at ? (
                    <span className="badge">returned</span>
                  ) : (
                    <>
                      <button
                        type="button"
                        className="secondary"
                        onClick={() =>
                          act(`/loans/${loan.id}/return`, 'Returned.')
                        }
                      >
                        Return
                      </button>{' '}
                      <button
                        type="button"
                        className="secondary"
                        onClick={() =>
                          act(`/loans/${loan.id}/renew`, 'Renewed.')
                        }
                      >
                        Renew
                      </button>
                    </>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="panel">
        <h2>Unpaid fines</h2>
        {fines.length === 0 ? (
          <p className="muted">No unpaid fines.</p>
        ) : (
          <table>
            <thead>
              <tr>
                <th>Member</th>
                <th>Amount</th>
                <th>Reason</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {fines.map((fine) => (
                <tr key={fine.id}>
                  <td className="muted">{fine.member_id}</td>
                  <td>{fine.amount.toFixed(2)}</td>
                  <td>{fine.reason}</td>
                  <td>
                    <button
                      type="button"
                      className="secondary"
                      onClick={() =>
                        act(`/fines/${fine.id}/pay`, 'Fine marked paid.')
                      }
                    >
                      Mark paid
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </>
  );
}

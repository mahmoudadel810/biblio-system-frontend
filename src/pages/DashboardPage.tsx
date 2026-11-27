import { useEffect, useState } from 'react';
import { api } from '../api/client';
import type { Dashboard } from '../api/types';

export default function DashboardPage() {
  const [data, setData] = useState<Dashboard | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    api
      .get<Dashboard>('/dashboard/me')
      .then(setData)
      .catch((e) => setError(e.message));
  }, []);

  if (error) return <p className="error-text">{error}</p>;
  if (!data) return <p className="page-message">Loading…</p>;

  return (
    <>
      <div className="stat-grid">
        <div className="stat-card">
          <div className="value">{data.open_loans.length}</div>
          <div className="label">Open loans</div>
        </div>
        <div className="stat-card">
          <div className="value">{data.active_reservations.length}</div>
          <div className="label">Reservations</div>
        </div>
        <div className="stat-card">
          <div className="value">{data.unpaid_fines_total.toFixed(2)}</div>
          <div className="label">Unpaid fines</div>
        </div>
        <div className="stat-card">
          <div className="value">{data.unread_notifications}</div>
          <div className="label">Unread notifications</div>
        </div>
      </div>

      <div className="panel">
        <h2>My loans</h2>
        {data.open_loans.length === 0 ? (
          <p className="muted">No open loans.</p>
        ) : (
          <table>
            <thead>
              <tr>
                <th>Book</th>
                <th>Barcode</th>
                <th>Due</th>
                <th>Renewals</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {data.open_loans.map((loan) => (
                <tr key={loan.loan_id}>
                  <td>{loan.book_title}</td>
                  <td>{loan.barcode}</td>
                  <td>{new Date(loan.due_at).toLocaleDateString()}</td>
                  <td>{loan.renewed_count}</td>
                  <td>
                    {loan.is_overdue && (
                      <span className="badge warn">overdue</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <div className="panel">
        <h2>My reservations</h2>
        {data.active_reservations.length === 0 ? (
          <p className="muted">No active reservations.</p>
        ) : (
          <table>
            <thead>
              <tr>
                <th>Book</th>
                <th>Branch</th>
                <th>Expires</th>
              </tr>
            </thead>
            <tbody>
              {data.active_reservations.map((res) => (
                <tr key={res.reservation_id}>
                  <td>{res.book_title}</td>
                  <td>{res.branch_name}</td>
                  <td>{new Date(res.expires_at).toLocaleDateString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </>
  );
}

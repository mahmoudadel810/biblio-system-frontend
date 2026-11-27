import { useEffect, useState } from 'react';
import { api } from '../api/client';
import type { Dashboard } from '../api/types';
import MyLibrary from './MyLibrary';

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
        <MyLibrary />
      </div>
    </>
  );
}

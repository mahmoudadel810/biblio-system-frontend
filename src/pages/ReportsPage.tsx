import { useEffect, useState } from 'react';
import { api } from '../api/client';
import type {
  CirculationDay,
  FinesSummary,
  OverdueLoan,
  Overview,
  PopularBook,
} from '../api/types';

export default function ReportsPage() {
  const [overview, setOverview] = useState<Overview | null>(null);
  const [popular, setPopular] = useState<PopularBook[]>([]);
  const [overdue, setOverdue] = useState<OverdueLoan[]>([]);
  const [fines, setFines] = useState<FinesSummary | null>(null);
  const [activity, setActivity] = useState<CirculationDay[]>([]);
  const [error, setError] = useState('');

  useEffect(() => {
    api.get<Overview>('/stats/overview').then(setOverview).catch((e) => setError(e.message));
    api.get<PopularBook[]>('/reports/popular-books').then(setPopular).catch(() => {});
    api.get<OverdueLoan[]>('/reports/overdue').then(setOverdue).catch(() => {});
    api.get<FinesSummary>('/reports/fines-summary').then(setFines).catch(() => {});
    api
      .get<CirculationDay[]>('/reports/circulation?days=14')
      .then(setActivity)
      .catch(() => {});
  }, []);

  if (error) return <p className="error-text">{error}</p>;

  return (
    <>
      {overview && (
        <div className="stat-grid">
          <div className="stat-card">
            <div className="value">{overview.books}</div>
            <div className="label">Books</div>
          </div>
          <div className="stat-card">
            <div className="value">{overview.copies}</div>
            <div className="label">Copies</div>
          </div>
          <div className="stat-card">
            <div className="value">{overview.members}</div>
            <div className="label">Members</div>
          </div>
          <div className="stat-card">
            <div className="value">{overview.active_loans}</div>
            <div className="label">Active loans</div>
          </div>
          <div className="stat-card">
            <div className="value">{overview.overdue_loans}</div>
            <div className="label">Overdue</div>
          </div>
          <div className="stat-card">
            <div className="value">{overview.active_reservations}</div>
            <div className="label">Reservations</div>
          </div>
          <div className="stat-card">
            <div className="value">{overview.unpaid_fines_total.toFixed(2)}</div>
            <div className="label">Unpaid fines</div>
          </div>
        </div>
      )}

      <div className="panel">
        <h2>Popular books</h2>
        <table>
          <thead>
            <tr>
              <th>Title</th>
              <th>ISBN</th>
              <th>Loans</th>
              <th>Active reservations</th>
            </tr>
          </thead>
          <tbody>
            {popular.map((b) => (
              <tr key={b.book_id}>
                <td>{b.title}</td>
                <td>{b.isbn}</td>
                <td>{b.loan_count}</td>
                <td>{b.active_reservations}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="panel">
        <h2>Overdue loans</h2>
        {overdue.length === 0 ? (
          <p className="muted">Nothing overdue.</p>
        ) : (
          <table>
            <thead>
              <tr>
                <th>Member</th>
                <th>Book</th>
                <th>Barcode</th>
                <th>Due</th>
                <th>Days late</th>
              </tr>
            </thead>
            <tbody>
              {overdue.map((o) => (
                <tr key={o.loan_id}>
                  <td>
                    {o.member_name} <span className="muted">({o.member_email})</span>
                  </td>
                  <td>{o.book_title}</td>
                  <td>{o.barcode}</td>
                  <td>{new Date(o.due_at).toLocaleDateString()}</td>
                  <td>
                    <span className="badge warn">{o.days_overdue}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {fines && (
        <div className="panel">
          <h2>Fines</h2>
          <table>
            <thead>
              <tr>
                <th></th>
                <th>Count</th>
                <th>Total</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>Unpaid</td>
                <td>{fines.unpaid_count}</td>
                <td>{fines.unpaid_total.toFixed(2)}</td>
              </tr>
              <tr>
                <td>Paid</td>
                <td>{fines.paid_count}</td>
                <td>{fines.paid_total.toFixed(2)}</td>
              </tr>
              <tr>
                <td>Waived</td>
                <td>{fines.waived_count}</td>
                <td>{fines.waived_total.toFixed(2)}</td>
              </tr>
            </tbody>
          </table>
        </div>
      )}

      <div className="panel">
        <h2>Circulation, last 14 days</h2>
        <table>
          <thead>
            <tr>
              <th>Day</th>
              <th>Loans</th>
              <th>Returns</th>
              <th>Renewals</th>
            </tr>
          </thead>
          <tbody>
            {activity.map((d) => (
              <tr key={d.day}>
                <td>{d.day}</td>
                <td>{d.loans}</td>
                <td>{d.returns}</td>
                <td>{d.renewals}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}

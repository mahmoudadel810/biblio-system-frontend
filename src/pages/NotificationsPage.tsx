import { useCallback, useEffect, useState } from 'react';
import { api } from '../api/client';
import type { AppNotification } from '../api/types';

export default function NotificationsPage() {
  const [items, setItems] = useState<AppNotification[]>([]);
  const [error, setError] = useState('');

  const load = useCallback(() => {
    api
      .get<AppNotification[]>('/notifications')
      .then(setItems)
      .catch((e) => setError(e.message));
  }, []);

  useEffect(load, [load]);

  const markRead = async (id: string) => {
    try {
      await api.post(`/notifications/${id}/read`);
      load();
    } catch (e) {
      setError((e as Error).message);
    }
  };

  if (error) return <p className="error-text">{error}</p>;

  return (
    <div className="panel">
      <h2>Notifications</h2>
      {items.length === 0 ? (
        <p className="muted">Nothing yet.</p>
      ) : (
        <table>
          <thead>
            <tr>
              <th>When</th>
              <th>Title</th>
              <th>Message</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {items.map((n) => (
              <tr key={n.id}>
                <td>{new Date(n.created_at).toLocaleString()}</td>
                <td>{n.title}</td>
                <td>{n.body}</td>
                <td>
                  {n.is_read ? (
                    <span className="badge ok">read</span>
                  ) : (
                    <button
                      type="button"
                      className="secondary"
                      onClick={() => markRead(n.id)}
                    >
                      Mark read
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}

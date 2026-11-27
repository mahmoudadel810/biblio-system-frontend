import { useCallback, useEffect, useState } from 'react';
import { useI18n } from '../i18n';
import { fmtDateTime } from '../public/format';
import { useCalendar } from '../public/useCalendar';
import { api } from '../api/client';
import type { AppNotification } from '../api/types';
import { NOTIF_CHANGED } from '../components/useUnread';

export default function NotificationsPage() {
  const { t, lang } = useI18n();
  useCalendar();
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
      window.dispatchEvent(new Event(NOTIF_CHANGED));
      load();
    } catch (e) {
      setError((e as Error).message);
    }
  };

  if (error) return <p className="error-text">{error}</p>;

  return (
    <div className="panel">
      <h2>{t('reader.notes')}</h2>
      {items.length === 0 ? (
        <p className="muted">{t('notif.none')}</p>
      ) : (
        <table>
          <thead>
            <tr>
              <th>{t('col.when')}</th>
              <th>{t('col.title')}</th>
              <th>{t('col.message')}</th>
              <th><span className="sr-only">{t('col.actions')}</span></th>
            </tr>
          </thead>
          <tbody>
            {items.map((n) => (
              <tr key={n.id}>
                <td>{fmtDateTime(n.created_at, lang)}</td>
                <td>{n.title}</td>
                <td>{n.body}</td>
                <td>
                  {n.is_read ? (
                    <span className="badge ok">{t('notif.read')}</span>
                  ) : (
                    <button
                      type="button"
                      className="secondary"
                      onClick={() => markRead(n.id)}
                    >
                      {t('notif.markRead')}
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

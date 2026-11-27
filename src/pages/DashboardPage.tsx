import { useEffect, useState } from 'react';
import { api } from '../api/client';
import type { Dashboard } from '../api/types';
import MyLibrary from './MyLibrary';
import { useI18n } from '../i18n';

export default function DashboardPage() {
  const { t } = useI18n();
  const [data, setData] = useState<Dashboard | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    api
      .get<Dashboard>('/dashboard/me')
      .then(setData)
      .catch((e) => setError(e.message));
  }, []);

  if (error) return <p className="error-text">{error}</p>;
  if (!data) return <p className="page-message">{t('loading')}</p>;

  return (
    <>
      <div className="stat-grid">
        <div className="stat-card">
          <div className="value">{data.open_loans.length}</div>
          <div className="label">{t('dash.stat.loans')}</div>
        </div>
        <div className="stat-card">
          <div className="value">{data.active_reservations.length}</div>
          <div className="label">{t('dash.stat.res')}</div>
        </div>
        <div className="stat-card">
          <div className="value">{data.unpaid_fines_total.toFixed(2)}</div>
          <div className="label">{t('dash.stat.fines')}</div>
        </div>
        <div className="stat-card">
          <div className="value">{data.unread_notifications}</div>
          <div className="label">{t('dash.stat.unread')}</div>
        </div>
      </div>

      <div className="panel">
        <MyLibrary />
      </div>
    </>
  );
}

import { useCallback, useEffect, useState } from 'react';
import { useI18n } from '../i18n';
import { fmtDateTime } from '../public/format';
import { useCalendar } from '../public/useCalendar';
import { api } from '../api/client';
import type { AuditLog } from '../api/types';

export default function AuditPage() {
  const { t, lang } = useI18n();
  useCalendar();
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [entityType, setEntityType] = useState('');
  const [error, setError] = useState('');
  const [more, setMore] = useState(false);
  const PAGE = 200;

  const query = useCallback((offset: number) => {
    const p = new URLSearchParams();
    if (entityType) p.set('entity_type', entityType);
    if (offset) p.set('offset', String(offset));
    const qs = p.toString();
    return api.get<AuditLog[]>(`/audit-logs${qs ? `?${qs}` : ''}`);
  }, [entityType]);

  const load = useCallback(() => {
    query(0)
      .then((rows) => { setLogs(rows); setMore(rows.length === PAGE); })
      .catch((e) => setError(e.message));
  }, [query]);

  const loadMore = () =>
    query(logs.length)
      .then((rows) => { setLogs((prev) => [...prev, ...rows]); setMore(rows.length === PAGE); })
      .catch((e) => setError(e.message));

  useEffect(load, [load]);

  if (error) return <p className="error-text">{error}</p>;

  return (
    <div className="panel">
      <h2>{t('audit.title')}</h2>
      <form className="inline-form" onSubmit={(e) => e.preventDefault()}>
        <input
          placeholder={t('audit.filter')}
          value={entityType}
          onChange={(e) => setEntityType(e.target.value)}
        />
      </form>
      <table>
        <thead>
          <tr>
            <th>{t('col.when')}</th>
            <th>{t('col.action')}</th>
            <th>{t('col.entity')}</th>
            <th>{t('col.actor')}</th>
            <th>{t('col.details')}</th>
          </tr>
        </thead>
        <tbody>
          {logs.map((log) => (
            <tr key={log.id}>
              <td>{fmtDateTime(log.created_at, lang)}</td>
              <td>{log.action}</td>
              <td>
                {log.entity_type} <span className="muted">{log.entity_id}</span>
              </td>
              <td className="muted">{log.actor_id ?? t('audit.system')}</td>
              <td className="muted">{JSON.stringify(log.details)}</td>
            </tr>
          ))}
        </tbody>
      </table>
      {more && <button type="button" className="pill ghost" onClick={loadMore}>{t('more')}</button>}
    </div>
  );
}

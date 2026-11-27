import { useCallback, useEffect, useState } from 'react';
import { api } from '../api/client';
import type { AuditLog } from '../api/types';

export default function AuditPage() {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [entityType, setEntityType] = useState('');
  const [error, setError] = useState('');

  const load = useCallback(() => {
    const path = entityType
      ? `/audit-logs?entity_type=${encodeURIComponent(entityType)}`
      : '/audit-logs';
    api
      .get<AuditLog[]>(path)
      .then(setLogs)
      .catch((e) => setError(e.message));
  }, [entityType]);

  useEffect(load, [load]);

  if (error) return <p className="error-text">{error}</p>;

  return (
    <div className="panel">
      <h2>Audit log</h2>
      <form className="inline-form" onSubmit={(e) => e.preventDefault()}>
        <input
          placeholder="Filter by entity type (e.g. fine, transfer)"
          value={entityType}
          onChange={(e) => setEntityType(e.target.value)}
        />
      </form>
      <table>
        <thead>
          <tr>
            <th>When</th>
            <th>Action</th>
            <th>Entity</th>
            <th>Actor</th>
            <th>Details</th>
          </tr>
        </thead>
        <tbody>
          {logs.map((log) => (
            <tr key={log.id}>
              <td>{new Date(log.created_at).toLocaleString()}</td>
              <td>{log.action}</td>
              <td>
                {log.entity_type} <span className="muted">{log.entity_id}</span>
              </td>
              <td className="muted">{log.actor_id ?? 'system'}</td>
              <td className="muted">{JSON.stringify(log.details)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

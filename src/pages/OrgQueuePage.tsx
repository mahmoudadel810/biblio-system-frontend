import { useCallback, useEffect, useState } from 'react';
import { api, ApiError } from '../api/client';

interface Org { id: string; kind: string; name: string; status: string; status_note: string | null; contact_email: string | null; registration_no: string | null; document_url: string | null; owner_email: string | null; created_at: string }

// Admin review queue. Pending applications come first. A reason is required to reject or suspend.
export default function OrgQueuePage() {
  const [orgs, setOrgs] = useState<Org[]>([]);
  const [notes, setNotes] = useState<Record<string, string>>({});
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loadError, setLoadError] = useState('');
  const load = useCallback(() => {
    api.get<Org[]>('/admin/organizations?per_page=100').then(setOrgs).catch((e) => setLoadError(e.message));
  }, []);
  useEffect(load, [load]);

  const act = async (o: Org, status: 'verified' | 'rejected' | 'suspended') => {
    const note = (notes[o.id] ?? '').trim();
    if (status !== 'verified' && note.length < 3) {
      setErrors((e) => ({ ...e, [o.id]: 'Write a short reason first. The applicant will see it.' }));
      return;
    }
    try {
      await api.patch(`/admin/organizations/${o.id}/status`, { status, note: note || null });
      setErrors((e) => ({ ...e, [o.id]: '' }));
      load();
    } catch (err) {
      setErrors((e) => ({ ...e, [o.id]: err instanceof ApiError ? err.message : 'failed' }));
    }
  };

  return (
    <div className="panel">
      <h2>Organizations</h2>
      {loadError && <p className="error-text">{loadError}</p>}
      {orgs.length === 0 ? <p className="muted">No applications yet.</p> : (
        <ul className="mylist">
          {orgs.map((o) => (
            <li key={o.id} style={{ alignItems: 'flex-start' }}>
              <div style={{ flex: '1 1 260px' }}>
                <strong>{o.name}</strong> <span className={`badge ${o.status === 'verified' ? 'ok' : o.status === 'pending' ? '' : 'warn'}`}>{o.status}</span>
                <div className="muted small">{o.kind} · {o.owner_email ?? 'no owner'} · {o.contact_email ?? 'no contact email'}</div>
                <div className="muted small">Registration: {o.registration_no ?? 'none given'}{o.document_url && <> · <a href={o.document_url} target="_blank" rel="noopener noreferrer">document</a></>}</div>
                {o.status_note && <div className="small">Note: {o.status_note}</div>}
                {errors[o.id] && <div className="error-text small" role="alert">{errors[o.id]}</div>}
              </div>
              <div style={{ display: 'grid', gap: 6, flex: '1 1 220px' }}>
                <input placeholder="Reason (required to reject or suspend)" value={notes[o.id] ?? ''} onChange={(e) => setNotes({ ...notes, [o.id]: e.target.value })} />
                <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                  {o.status !== 'verified' && <button type="button" onClick={() => act(o, 'verified')}>Verify</button>}
                  {o.status !== 'rejected' && <button type="button" onClick={() => act(o, 'rejected')}>Reject</button>}
                  {o.status === 'verified' && <button type="button" onClick={() => act(o, 'suspended')}>Suspend</button>}
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

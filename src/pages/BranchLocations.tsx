import { useCallback, useEffect, useState } from 'react';
import { api, ApiError } from '../api/client';
import { useI18n } from '../i18n';
import type { Branch } from '../api/types';

// Admin sets where each branch is, so members can find the nearest one. Nothing is looked up online:
// type the coordinates, or stand at the branch and use this device's position.
export default function BranchLocations() {
  const { t } = useI18n();
  const [branches, setBranches] = useState<Branch[]>([]);
  const [draft, setDraft] = useState<Record<string, { lat: string; lng: string }>>({});
  const [msg, setMsg] = useState<Record<string, string>>({});
  const load = useCallback(() => api.get<Branch[]>('/branches').then((b) => {
    setBranches(b);
    setDraft(Object.fromEntries(b.map((x) => [x.id, { lat: x.latitude?.toString() ?? '', lng: x.longitude?.toString() ?? '' }])));
  }).catch(() => {}), []);
  useEffect(() => { load(); }, [load]);

  const note = (id: string, m: string) => setMsg((s) => ({ ...s, [id]: m }));
  const save = async (id: string, clear = false) => {
    const d = draft[id];
    const lat = clear ? null : Number(d.lat);
    const lng = clear ? null : Number(d.lng);
    if (!clear && (d.lat.trim() === '' || d.lng.trim() === '' || Number.isNaN(lat) || Number.isNaN(lng))) return note(id, t('loc.invalid'));
    try {
      await api.patch(`/branches/${id}/location`, { latitude: lat, longitude: lng });
      note(id, t(clear ? 'loc.cleared' : 'loc.saved'));
      load();
    } catch (e) {
      note(id, e instanceof ApiError ? e.message : t('loc.invalid'));
    }
  };
  const here = (id: string) => {
    if (!navigator.geolocation) return note(id, t('loc.unsupported'));
    navigator.geolocation.getCurrentPosition(
      (p) => setDraft((s) => ({ ...s, [id]: { lat: p.coords.latitude.toFixed(5), lng: p.coords.longitude.toFixed(5) } })),
      () => note(id, t('loc.denied')),
      { timeout: 10000 },
    );
  };

  return (
    <div className="panel">
      <h2>{t('loc.title')}</h2>
      <p className="muted">{t('loc.help')}</p>
      {branches.map((b) => (
        <fieldset key={b.id} className="loc-row">
          <legend><bdi>{b.name}</bdi></legend>
          <label>{t('loc.lat')}
            <input inputMode="decimal" dir="ltr" value={draft[b.id]?.lat ?? ''} onChange={(e) => setDraft((s) => ({ ...s, [b.id]: { ...s[b.id], lat: e.target.value } }))} />
          </label>
          <label>{t('loc.lng')}
            <input inputMode="decimal" dir="ltr" value={draft[b.id]?.lng ?? ''} onChange={(e) => setDraft((s) => ({ ...s, [b.id]: { ...s[b.id], lng: e.target.value } }))} />
          </label>
          <div className="loc-actions">
            <button type="button" onClick={() => here(b.id)}>{t('loc.here')}</button>
            <button type="button" onClick={() => save(b.id)}>{t('loc.save')}</button>
            {b.latitude != null && <button type="button" onClick={() => save(b.id, true)}>{t('loc.clear')}</button>}
          </div>
          {msg[b.id] && <p className="small" role="status">{msg[b.id]}</p>}
        </fieldset>
      ))}
    </div>
  );
}

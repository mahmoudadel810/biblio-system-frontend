import { useEffect, useState, type FormEvent } from 'react';
import { api, ApiError } from '../api/client';
import { useI18n } from '../i18n';
import { useAuth } from '../auth/AuthContext';

interface Org { id: string; name: string; kind: string; status: string; member_role?: string }
interface Policy { fine_per_day: number | null; max_fine_per_loan: number | null; lost_fee: number | null; damaged_fee: number | null }
interface View { policy: Policy; platform: Policy }
const KEYS: (keyof Policy)[] = ['fine_per_day', 'max_fine_per_loan', 'lost_fee', 'damaged_fee'];

// A library sets its own fines. An empty box means "use the platform value", which is shown as the hint.
export default function FinePolicy() {
  const { t } = useI18n();
  const { user } = useAuth();
  const [orgs, setOrgs] = useState<Org[]>([]);
  const [orgId, setOrgId] = useState('');
  const [view, setView] = useState<View | null>(null);
  const [draft, setDraft] = useState<Record<string, string>>({});
  const [msg, setMsg] = useState('');

  useEffect(() => {
    const isAdmin = user?.role === 'admin';
    const req = isAdmin ? api.get<Org[]>('/admin/organizations?per_page=100') : api.get<Org[]>('/me/organizations');
    req.then((all) => {
      const ok = all.filter((o) => o.kind === 'library' && o.status === 'verified' && (isAdmin || o.member_role === 'owner' || o.member_role === 'manager'));
      setOrgs(ok);
      if (ok.length) setOrgId(ok[0].id);
    }).catch(() => {});
  }, [user]);

  useEffect(() => {
    if (!orgId) return;
    api.get<View>(`/organizations/${orgId}/fine-policy`).then((v) => {
      setView(v);
      setDraft(Object.fromEntries(KEYS.map((k) => [k, v.policy[k] == null ? '' : String(v.policy[k])])));
      setMsg('');
    }).catch(() => setView(null));
  }, [orgId]);

  if (orgs.length === 0) return null;

  const save = async (e: FormEvent) => {
    e.preventDefault();
    const body = Object.fromEntries(KEYS.map((k) => [k, draft[k].trim() === '' ? null : Number(draft[k])]));
    try {
      await api.put(`/organizations/${orgId}/fine-policy`, body);
      setMsg(t('fp.saved'));
    } catch (err) {
      setMsg(err instanceof ApiError ? err.message : t('set.saveFail'));
    }
  };

  return (
    <div className="panel">
      <h2>{t('fp.title')}</h2>
      <p className="muted">{t('fp.help')}</p>
      <form className="inline-form" onSubmit={save}>
        {orgs.length > 1 && (
          <label>{t('fp.library')}{' '}
            <select value={orgId} onChange={(e) => setOrgId(e.target.value)}>
              {orgs.map((o) => <option key={o.id} value={o.id}>{o.name}</option>)}
            </select>
          </label>
        )}
        {orgs.length === 1 && <p><bdi>{orgs[0].name}</bdi></p>}
        {KEYS.map((k) => (
          <label key={k}>{t('set.' + k)}{' '}
            <input type="number" min={0} step="0.01" dir="ltr" value={draft[k] ?? ''}
              placeholder={view?.platform[k] != null ? `${t('fp.platform')} ${view.platform[k]}` : ''}
              onChange={(e) => setDraft({ ...draft, [k]: e.target.value })} />
          </label>
        ))}
        <button type="submit">{t('set.save')}</button>
      </form>
      {msg && <p role="status">{msg}</p>}
    </div>
  );
}

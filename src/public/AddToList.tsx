import { useEffect, useState, type FormEvent } from 'react';
import { useI18n } from '../i18n';
import { api, ApiError } from '../api/client';

interface MyList { id: string; name: string; is_public: boolean; book_count: number; slugs: string[] }

// "Save to a list" for signed-in members: pick a list or make a new one.
export default function AddToList({ slug }: { slug: string }) {
  const { t } = useI18n();
  const [open, setOpen] = useState(false);
  const [lists, setLists] = useState<MyList[]>([]);
  const [name, setName] = useState('');
  const [msg, setMsg] = useState('');
  const load = () => api.get<MyList[]>('/me/lists').then(setLists).catch(() => {});
  useEffect(() => {
    if (open) load();
  }, [open]);

  const toggle = async (l: MyList) => {
    setMsg('');
    try {
      if (l.slugs.includes(slug)) await api.del(`/me/lists/${l.id}/books/${encodeURIComponent(slug)}`);
      else await api.post(`/me/lists/${l.id}/books`, { slug });
      await load();
    } catch (e) {
      setMsg(e instanceof ApiError ? e.message : t('lists.failed'));
    }
  };
  const create = async (e: FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    try {
      const r = await api.post<{ id: string }>('/me/lists', { name });
      await api.post(`/me/lists/${r.id}/books`, { slug });
      setName('');
      await load();
    } catch (x) {
      setMsg(x instanceof ApiError ? x.message : t('lists.failed'));
    }
  };

  return (
    <div className="addlist">
      <button type="button" className="pill ghost" aria-expanded={open} onClick={() => setOpen(!open)}>{t('lists.save')}</button>
      {open && (
        <div className="addlist-box">
          {lists.length === 0 && <p className="muted small">{t('lists.none')}</p>}
          <ul className="mylist">
            {lists.map((l) => (
              <li key={l.id}>
                <label className="check-row">
                  <input type="checkbox" checked={l.slugs.includes(slug)} onChange={() => toggle(l)} />
                  {l.name}
                </label>
              </li>
            ))}
          </ul>
          <form className="row" onSubmit={create}>
            <input value={name} maxLength={80} onChange={(e) => setName(e.target.value)} placeholder={t('lists.new')} aria-label={t('lists.new')} />
            <button type="submit" className="pill ghost">{t('lists.create')}</button>
          </form>
          {msg && <p className="error small" role="alert">{msg}</p>}
        </div>
      )}
    </div>
  );
}

import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../api/client';
import { useI18n } from '../i18n';

interface MyList { id: string; name: string; is_public: boolean; book_count: number }

export default function MyLists() {
  const { t } = useI18n();
  const [lists, setLists] = useState<MyList[]>([]);
  const [copied, setCopied] = useState('');
  const load = useCallback(() => api.get<MyList[]>('/me/lists').then(setLists).catch(() => {}), []);
  useEffect(() => { load(); }, [load]);

  const share = async (l: MyList) => {
    await api.patch(`/me/lists/${l.id}`, { is_public: !l.is_public }).catch(() => {});
    load();
  };
  const copy = async (l: MyList) => {
    try { await navigator.clipboard.writeText(`${window.location.origin}/lists/${l.id}`); setCopied(l.id); } catch { setCopied(''); }
  };
  const remove = async (l: MyList) => { await api.del(`/me/lists/${l.id}`).catch(() => {}); load(); };

  return (
    <>
      <h2>{t('lists.title')}</h2>
      {lists.length === 0 ? <p className="muted">{t('lists.mine.none')}</p> : (
        <ul className="mylist">
          {lists.map((l) => (
            <li key={l.id}>
              <div>
                {l.is_public ? <Link to={`/lists/${l.id}`}>{l.name}</Link> : l.name}
                <div className="muted small"><bdi>{l.book_count}</bdi> {t('lists.books')} · {t(l.is_public ? 'lists.public' : 'lists.private')}</div>
                {copied === l.id && <div className="small" role="status">{t('lists.copied')}</div>}
              </div>
              <div className="row">
                <button type="button" className="pill ghost" aria-pressed={l.is_public} onClick={() => share(l)}>{t(l.is_public ? 'lists.makeprivate' : 'lists.makepublic')}</button>
                {l.is_public && <button type="button" className="pill ghost" onClick={() => copy(l)}>{t('lists.copy')}</button>}
                <button type="button" className="pill ghost" onClick={() => remove(l)}>{t('lists.delete')}</button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </>
  );
}

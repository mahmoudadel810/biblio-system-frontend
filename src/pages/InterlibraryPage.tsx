import { useCallback, useEffect, useState, type FormEvent } from 'react';
import { api, ApiError } from '../api/client';
import { useI18n } from '../i18n';
import { fmtDate } from '../public/format';
import Picker, { type PickItem } from '../components/Picker';
import type { Branch } from '../api/types';

interface Req {
  id: string; status: string; note: string; decline_reason: string | null;
  book_title: string; book_title_ar: string | null; from_branch: string; from_library: string | null;
  lender_branch: string | null; copy_barcode: string | null; created_at: string;
}

// One library asks another to lend a book. The lender sees the asking library and branch, never a person.
export default function InterlibraryPage() {
  const { t, lang } = useI18n();
  const [tab, setTab] = useState<'outgoing' | 'incoming'>('outgoing');
  const [rows, setRows] = useState<Req[]>([]);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [book, setBook] = useState<PickItem | null>(null);
  const [branchId, setBranchId] = useState('');
  const [note, setNote] = useState('');
  const [picked, setPicked] = useState<Record<string, PickItem | null>>({});
  const [msg, setMsg] = useState('');

  const load = useCallback(() => {
    api.get<Req[]>(`/interlibrary?box=${tab}`).then(setRows).catch(() => setRows([]));
  }, [tab]);
  useEffect(load, [load]);
  useEffect(() => {
    api.get<Branch[]>('/branches').then((b) => { setBranches(b); if (b[0]) setBranchId((x) => x || b[0].id); }).catch(() => {});
  }, []);

  const findBooks = useCallback(
    (q: string) => api.get<{ items: { id: string; title: string; title_ar: string | null }[] }>(`/public/books?q=${encodeURIComponent(q)}&per_page=8`)
      .then((r) => r.items.map((b) => ({ id: b.id, title: lang === 'ar' && b.title_ar ? b.title_ar : b.title }))),
    [lang],
  );
  const findCopies = useCallback(
    (title: string) => (q: string) =>
      api.get<{ id: string; barcode: string; status: string; book_title: string; branch_name: string }[]>(`/copies/lookup?q=${encodeURIComponent(q || title)}`)
        .then((r) => r.filter((c) => c.status === 'available' && c.book_title === title).map((c) => ({ id: c.id, title: c.book_title, sub: `${c.barcode} · ${c.branch_name}` }))),
    [],
  );

  const run = async (fn: () => Promise<unknown>, ok: string) => {
    setMsg('');
    try { await fn(); setMsg(ok); load(); } catch (e) { setMsg(e instanceof ApiError ? e.message : t('set.saveFail')); }
  };
  const create = (e: FormEvent) => {
    e.preventDefault();
    if (!book || !branchId) return;
    run(async () => { await api.post('/interlibrary', { book_id: book.id, branch_id: branchId, note }); setBook(null); setNote(''); }, t('ill.sent'));
  };
  const title = (r: Req) => (lang === 'ar' && r.book_title_ar ? r.book_title_ar : r.book_title);
  const act = (r: Req, a: string, body?: unknown) => run(() => api.post(`/interlibrary/${r.id}/${a}`, body ?? {}), t('ill.done'));

  return (
    <>
      <div className="panel">
        <h2>{t('ill.title')}</h2>
        <p className="muted">{t('ill.help')}</p>
        <form className="inline-form" onSubmit={create}>
          <Picker placeholder={t('ill.pickBook')} search={findBooks} value={book} onChange={setBook} required />
          <label>{t('ill.forBranch')}{' '}
            <select value={branchId} onChange={(e) => setBranchId(e.target.value)}>
              {branches.map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}
            </select>
          </label>
          <input placeholder={t('ill.note')} maxLength={500} value={note} onChange={(e) => setNote(e.target.value)} aria-label={t('ill.note')} />
          <button type="submit" disabled={!book}>{t('ill.ask')}</button>
        </form>
        {msg && <p role="status">{msg}</p>}
      </div>
      <div className="panel">
        <div className="tabs" role="tablist">
          {(['outgoing', 'incoming'] as const).map((k) => (
            <button key={k} type="button" role="tab" aria-selected={tab === k} className={tab === k ? 'pill' : 'pill ghost'} onClick={() => setTab(k)}>{t('ill.' + k)}</button>
          ))}
        </div>
        {rows.length === 0 ? <p className="muted">{t('ill.none')}</p> : (
          <ul className="mylist">
            {rows.map((r) => (
              <li key={r.id}>
                <div>
                  <strong><bdi>{title(r)}</bdi></strong>
                  <div className="muted small">
                    {tab === 'incoming' ? <bdi>{[r.from_library, r.from_branch].filter(Boolean).join(' · ')}</bdi> : r.lender_branch ? <bdi>{r.lender_branch}</bdi> : t('ill.waiting')}
                    {' · '}<bdi>{fmtDate(r.created_at, lang)}</bdi>
                  </div>
                  {r.note && <div className="muted small"><bdi>{r.note}</bdi></div>}
                  {r.decline_reason && <div className="muted small">{t('ill.reason')} <bdi>{r.decline_reason}</bdi></div>}
                </div>
                <span className={`status-badge ${r.status}`}>{t('ill.s.' + r.status)}</span>
                <div className="row">
                  {tab === 'outgoing' && (r.status === 'open' || r.status === 'accepted') && <button type="button" className="pill ghost" onClick={() => act(r, 'cancel')}>{t('ill.cancel')}</button>}
                  {tab === 'outgoing' && r.status === 'accepted' && <button type="button" className="pill" onClick={() => act(r, 'receive')}>{t('ill.receive')}</button>}
                  {tab === 'incoming' && r.status === 'open' && (
                    <>
                      <Picker placeholder={t('ill.pickCopy')} search={findCopies(r.book_title)} value={picked[r.id] ?? null} onChange={(v) => setPicked({ ...picked, [r.id]: v })} />
                      <button type="button" className="pill" disabled={!picked[r.id]} onClick={() => act(r, 'accept', { copy_id: picked[r.id]!.id })}>{t('ill.accept')}</button>
                      <button type="button" className="pill ghost" onClick={() => act(r, 'decline')}>{t('ill.decline')}</button>
                    </>
                  )}
                  {tab === 'incoming' && r.status === 'received' && <button type="button" className="pill" onClick={() => act(r, 'return')}>{t('ill.return')}</button>}
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </>
  );
}

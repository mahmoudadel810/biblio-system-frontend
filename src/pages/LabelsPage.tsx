import { useCallback, useEffect, useState } from 'react';
import { useI18n } from '../i18n';
import { api } from '../api/client';
import QrCode from '../components/QrCode';

interface CopyRow { id: string; barcode: string; book_title: string; branch_name: string }

// Shelf labels: one QR per copy (it holds the barcode), printed from the browser. Staff scan it at the desk.
export default function LabelsPage() {
  const { t } = useI18n();
  const [q, setQ] = useState('');
  const [rows, setRows] = useState<CopyRow[]>([]);
  const [picked, setPicked] = useState<Set<string>>(new Set());
  const [more, setMore] = useState(false);
  const [error, setError] = useState('');
  const PAGE = 60;

  const load = useCallback(
    async (offset: number, query: string) => {
      setError('');
      try {
        const r = await api.get<CopyRow[]>(`/copies/labels?q=${encodeURIComponent(query)}&limit=${PAGE}&offset=${offset}`);
        setRows((prev) => (offset === 0 ? r : [...prev, ...r]));
        setMore(r.length === PAGE);
      } catch {
        setError(t('labels.failed'));
      }
    },
    [t],
  );
  useEffect(() => {
    load(0, '');
  }, [load]);
  // The site hides pages when printing; this staff page opts in so labels can be printed.
  useEffect(() => {
    document.body.classList.add('printing-labels');
    return () => document.body.classList.remove('printing-labels');
  }, []);

  const toggle = (id: string) =>
    setPicked((p) => {
      const n = new Set(p);
      if (n.has(id)) n.delete(id);
      else n.add(id);
      return n;
    });
  const chosen = rows.filter((r) => picked.has(r.id));

  return (
    <>
      <div className="panel no-print">
        <h2>{t('labels.title')}</h2>
        <p className="muted">{t('labels.hint')}</p>
        <form className="scan-type" onSubmit={(e) => { e.preventDefault(); setPicked(new Set()); load(0, q); }}>
          <label className="sr-only" htmlFor="label-q">{t('labels.search')}</label>
          <input id="label-q" value={q} onChange={(e) => setQ(e.target.value)} placeholder={t('labels.search')} />
          <button type="submit" className="pill ghost">{t('scan.go')}</button>
        </form>
        {error && <p role="alert" className="error-text">{error}</p>}
        <div className="label-actions">
          <button type="button" className="pill ghost" onClick={() => setPicked(new Set(rows.map((r) => r.id)))}>{t('labels.all')}</button>
          <button type="button" className="pill ghost" onClick={() => setPicked(new Set())}>{t('labels.none')}</button>
          <button type="button" className="pill" disabled={!chosen.length} onClick={() => window.print()}>
            {t('labels.print')} ({chosen.length})
          </button>
        </div>
        {rows.length === 0 ? (
          <p className="muted">{t('labels.empty')}</p>
        ) : (
          <table>
            <thead>
              <tr><th><span className="sr-only">{t('labels.pick')}</span></th><th>{t('labels.book')}</th><th>{t('labels.barcode')}</th><th>{t('labels.branch')}</th></tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.id}>
                  <td><input type="checkbox" checked={picked.has(r.id)} onChange={() => toggle(r.id)} aria-label={`${t('labels.pick')} ${r.book_title} ${r.barcode}`} /></td>
                  <td>{r.book_title}</td>
                  <td dir="ltr">{r.barcode}</td>
                  <td>{r.branch_name}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
        {more && <button type="button" className="pill ghost" onClick={() => load(rows.length, q)}>{t('more')}</button>}
      </div>

      <div className="label-sheet" aria-hidden={chosen.length === 0}>
        {chosen.map((r) => (
          <div className="label" key={r.id}>
            <QrCode value={r.barcode} label={`${r.book_title} ${r.barcode}`} size={96} />
            <div className="label-text">
              <strong>{r.book_title}</strong>
              <span dir="ltr">{r.barcode}</span>
              <span>{r.branch_name}</span>
            </div>
          </div>
        ))}
      </div>
    </>
  );
}

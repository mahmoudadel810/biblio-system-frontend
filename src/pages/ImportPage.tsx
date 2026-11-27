import { useEffect, useState } from 'react';
import { useI18n } from '../i18n';
import { api, ApiError } from '../api/client';
import type { Branch } from '../api/types';

interface Row { line: number; status: 'ok' | 'exists' | 'invalid'; message: string }
interface Report { dry_run: boolean; committed: boolean; total: number; ok: number; exists: number; invalid: number; rows: Row[] }

const SAMPLES = {
  books: 'isbn,title,publisher,year,language,copies\n9780000000001,Example Book,Example Press,2020,en,2\n',
  members: 'email,full_name,temp_password\nreader@example.com,Example Reader,change-me-123\n',
};

// Staff bulk import. Always preview first (dry run); the Import button only works after a preview of the same file.
export default function ImportPage() {
  const { t } = useI18n();
  const [kind, setKind] = useState<'books' | 'members'>('books');
  const [csv, setCsv] = useState('');
  const [fileName, setFileName] = useState('');
  const [branches, setBranches] = useState<Branch[]>([]);
  const [branch, setBranch] = useState('');
  const [report, setReport] = useState<Report | null>(null);
  const [previewed, setPreviewed] = useState(false);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  useEffect(() => { api.get<Branch[]>('/branches').then(setBranches).catch(() => {}); }, []);
  const reset = () => { setReport(null); setPreviewed(false); setError(''); };

  const onFile = async (f: File | undefined) => {
    reset();
    if (!f) { setCsv(''); setFileName(''); return; }
    setFileName(f.name);
    setCsv(await f.text());
  };
  const run = async (dry: boolean) => {
    if (!csv) { setError(t('imp.pickFile')); return; }
    setBusy(true); setError('');
    try {
      const r = await api.post<Report>(`/import/${kind}`, { csv, dry_run: dry, branch_id: kind === 'books' && branch ? branch : undefined });
      setReport(r);
      setPreviewed(dry && r.invalid === 0);
    } catch (e) { setError(e instanceof ApiError ? e.message : 'failed'); setPreviewed(false); }
    setBusy(false);
  };
  const sample = () => {
    const url = URL.createObjectURL(new Blob([SAMPLES[kind]], { type: 'text/csv' }));
    const a = document.createElement('a'); a.href = url; a.download = `${kind}-sample.csv`; a.click(); URL.revokeObjectURL(url);
  };
  const fill = (s: string) => s.replace('{ok}', String(report?.ok ?? 0)).replace('{exists}', String(report?.exists ?? 0)).replace('{invalid}', String(report?.invalid ?? 0));

  return (
    <div className="panel">
      <h2>{t('imp.title')}</h2>
      <p className="muted">{t('imp.lead')}</p>
      <div className="row" style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBlockEnd: 12 }}>
        {(['books', 'members'] as const).map((k) => (
          <button key={k} type="button" className={kind === k ? '' : 'secondary'} aria-pressed={kind === k} onClick={() => { setKind(k); reset(); }}>{t(`imp.${k}`)}</button>
        ))}
      </div>
      <p className="muted small">{t(kind === 'books' ? 'imp.colsBooks' : 'imp.colsMembers')}</p>
      <div className="inline-form">
        <label style={{ maxWidth: "100%" }}>{t("imp.file")} <input style={{ maxWidth: "100%" }} type="file" accept=".csv,text/csv" onChange={(e) => onFile(e.target.files?.[0])} /></label>
        {kind === 'books' && (
          <select value={branch} onChange={(e) => { setBranch(e.target.value); reset(); }} aria-label={t('imp.branch')}>
            <option value="">{t('imp.noBranch')}</option>
            {branches.filter((b) => b.is_active).map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}
          </select>
        )}
      </div>
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBlockStart: 12 }}>
        <button type="button" disabled={busy || !csv} onClick={() => run(true)}>{t('imp.preview')}</button>
        <button type="button" disabled={busy || !previewed} onClick={() => run(false)}>{t('imp.run')}</button>
        <button type="button" className="secondary" onClick={sample}>{t('imp.sample')}</button>
      </div>
      {fileName && <p className="muted small"><bdi>{fileName}</bdi></p>}
      {error && <p className="error-text" role="alert">{error}</p>}
      {report && (
        <>
          <p role="status"><strong>{report.committed ? fill(t('imp.sumDone')) : fill(t('imp.sumPreview'))}</strong></p>
          {report.invalid > 0 && !report.dry_run && <p className="error-text">{t('imp.blocked')}</p>}
          <div className="table-scroll" style={{ overflowX: 'auto' }}>
            <table>
              <thead><tr><th>{t('imp.line')}</th><th>{t('imp.status')}</th><th>{t('imp.note')}</th></tr></thead>
              <tbody>
                {report.rows.map((r) => (
                  <tr key={r.line}>
                    <td>{r.line}</td>
                    <td><span className={`badge ${r.status === 'ok' ? 'ok' : r.status === 'invalid' ? 'warn' : ''}`}>{t(`imp.s.${r.status}`)}</span></td>
                    <td>{r.message}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}

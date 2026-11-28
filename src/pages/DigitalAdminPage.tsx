import { useCallback, useState, type FormEvent } from 'react';
import { api, ApiError } from '../api/client';
import { useI18n } from '../i18n';
import Picker, { type PickItem } from '../components/Picker';

const MAX_BYTES = 8 * 1024 * 1024;

function toBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(String(r.result).split(',')[1] ?? '');
    r.onerror = () => reject(new Error('read'));
    r.readAsDataURL(file);
  });
}

// Admin adds a readable edition from an EPUB. Only rights-cleared books: public domain (with a source link) or partner files.
export default function DigitalAdminPage() {
  const { t, lang } = useI18n();
  const [book, setBook] = useState<PickItem | null>(null);
  const [rights, setRights] = useState('public_domain');
  const [note, setNote] = useState('');
  const [url, setUrl] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState('');
  const [err, setErr] = useState('');

  const findBooks = useCallback(
    (q: string) => api.get<{ items: { id: string; title: string; title_ar: string | null }[] }>(`/public/books?q=${encodeURIComponent(q)}&per_page=8`)
      .then((r) => r.items.map((b) => ({ id: b.id, title: lang === 'ar' && b.title_ar ? b.title_ar : b.title }))),
    [lang],
  );

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setMsg(''); setErr('');
    if (!book || !file) return;
    if (file.size > MAX_BYTES) return setErr(t('dig.toobig'));
    setBusy(true);
    try {
      const r = await api.post<{ chunk_count: number }>('/admin/digital-editions/epub', {
        book_id: book.id, rights, source_note: note, source_url: url || null, file_base64: await toBase64(file),
      });
      setMsg(`${t('dig.done')} ${r.chunk_count}`);
      setBook(null); setFile(null); setNote(''); setUrl('');
    } catch (ex) {
      setErr(ex instanceof ApiError ? ex.message : t('set.saveFail'));
    } finally { setBusy(false); }
  };

  return (
    <div className="panel">
      <h2>{t('dig.title')}</h2>
      <p className="muted">{t('dig.help')}</p>
      <form className="form dig-form" onSubmit={submit}>
        <Picker placeholder={t('ill.pickBook')} search={findBooks} value={book} onChange={setBook} required />
        <label>{t('dig.rights')}
          <select value={rights} onChange={(e) => setRights(e.target.value)}>
            <option value="public_domain">{t('dig.pd')}</option>
            <option value="partner_supplied">{t('dig.partner')}</option>
          </select>
        </label>
        <label>{t('dig.note')}
          <input value={note} minLength={3} maxLength={500} required onChange={(e) => setNote(e.target.value)} />
        </label>
        <label>{t('dig.url')}
          <input type="url" dir="ltr" placeholder="https://" value={url} required={rights === 'public_domain'} onChange={(e) => setUrl(e.target.value)} />
        </label>
        <label>{t('dig.file')}
          <input type="file" accept=".epub,application/epub+zip" required onChange={(e) => setFile(e.target.files?.[0] ?? null)} />
        </label>
        <button type="submit" disabled={busy || !book || !file}>{busy ? t('loading') : t('dig.upload')}</button>
      </form>
      {msg && <p role="status">{msg}</p>}
      {err && <p className="error-text" role="alert">{err}</p>}
    </div>
  );
}

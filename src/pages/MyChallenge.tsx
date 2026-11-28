import { useCallback, useEffect, useState, type FormEvent } from 'react';
import { Link } from 'react-router-dom';
import { api, ApiError } from '../api/client';
import { useI18n } from '../i18n';

interface Ch { year: number; target: number | null; done: number; books: { slug: string | null; title: string; title_ar: string | null }[] }

// Yearly goal. Progress counts books the member actually returned this year, once each.
export default function MyChallenge() {
  const { t, lang } = useI18n();
  const [ch, setCh] = useState<Ch | null>(null);
  const [val, setVal] = useState('');
  const [err, setErr] = useState('');
  const load = useCallback(() => api.get<Ch>('/me/challenge').then((c) => { setCh(c); setVal(c.target ? String(c.target) : ''); }).catch(() => {}), []);
  useEffect(() => { load(); }, [load]);
  if (!ch) return null;
  const save = async (e: FormEvent) => {
    e.preventDefault();
    setErr('');
    const n = Number(val);
    if (!Number.isInteger(n) || n < 1 || n > 365) return setErr(t('chal.range'));
    try { await api.put('/me/challenge', { target: n }); load(); } catch (x) { setErr(x instanceof ApiError ? x.message : t('chal.range')); }
  };
  const clear = async () => { await api.del('/me/challenge').catch(() => {}); load(); };
  const pct = ch.target ? Math.min(100, Math.round((ch.done / ch.target) * 100)) : 0;
  const nf = new Intl.NumberFormat(lang === 'ar' ? 'ar-SA-u-nu-latn' : 'en');
  return (
    <>
      <h2>{t('chal.title')} <bdi>{ch.year}</bdi></h2>
      {ch.target ? (
        <>
          <p><strong><bdi>{nf.format(ch.done)} / {nf.format(ch.target)}</bdi></strong> {t('chal.books')}{ch.done >= ch.target ? ` · ${t('chal.reached')}` : ''}</p>
          <div className="meter" role="progressbar" aria-valuemin={0} aria-valuemax={ch.target} aria-valuenow={Math.min(ch.done, ch.target)} aria-label={t('chal.title')}>
            <div className="meter-fill" style={{ inlineSize: `${pct}%` }} />
          </div>
        </>
      ) : <p className="muted">{t('chal.none')}</p>}
      <form className="row" onSubmit={save}>
        <label>{t('chal.goal')} <input type="number" inputMode="numeric" min={1} max={365} value={val} onChange={(e) => setVal(e.target.value)} /></label>
        <button type="submit" className="pill ghost">{t(ch.target ? 'chal.update' : 'chal.set')}</button>
        {ch.target && <button type="button" className="pill ghost" onClick={clear}>{t('chal.clear')}</button>}
      </form>
      {err && <p className="error small" role="alert">{err}</p>}
      {ch.books.length > 0 && (
        <ul className="mylist">
          {ch.books.map((b) => (
            <li key={b.slug ?? b.title}>{b.slug ? <Link to={`/books/${encodeURIComponent(b.slug)}`}>{lang === 'ar' && b.title_ar ? b.title_ar : b.title}</Link> : b.title}</li>
          ))}
        </ul>
      )}
    </>
  );
}

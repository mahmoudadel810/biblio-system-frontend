import { useState, type FormEvent } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { api, ApiError } from '../api/client';
import { useI18n } from '../i18n';
import AuthLang from '../components/AuthLang';

export default function ResetPasswordPage() {
  const { t } = useI18n();
  const token = new URLSearchParams(useLocation().search).get('token') ?? '';
  const [pw, setPw] = useState('');
  const [pw2, setPw2] = useState('');
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState('');

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (pw !== pw2) { setError(t('auth.mismatch')); return; }
    setBusy(true); setError('');
    try { await api.post('/auth/reset-password', { token, password: pw }); setDone(true); }
    catch (err) { setError(err instanceof ApiError && err.status === 400 && /reset link/.test(err.message) ? t('auth.resetFail') : err instanceof ApiError ? err.message : 'failed'); }
    finally { setBusy(false); }
  };

  return (
    <div className="auth-card">
      <AuthLang />
      <h1>{t('auth.resetTitle')}</h1>
      {done ? (
        <p role="status">{t('auth.resetOk')}</p>
      ) : !token ? (
        <p className="error-text" role="alert">{t('auth.noToken')}</p>
      ) : (
        <form onSubmit={onSubmit}>
          <input type="password" placeholder={t('auth.newPass')} value={pw} onChange={(e) => setPw(e.target.value)} minLength={8} maxLength={128} required autoComplete="new-password" />
          <input type="password" placeholder={t('auth.confirm')} value={pw2} onChange={(e) => setPw2(e.target.value)} minLength={8} maxLength={128} required autoComplete="new-password" />
          {error && <p className="error-text" role="alert">{error}</p>}
          <button type="submit" disabled={busy}>{t('auth.setPass')}</button>
        </form>
      )}
      <p className="muted">{done ? <Link to="/login">{t('auth.signin')}</Link> : <Link to="/forgot-password">{t('auth.forgot')}</Link>}</p>
    </div>
  );
}

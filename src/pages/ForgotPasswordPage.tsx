import { useState, type FormEvent } from 'react';
import { Link } from 'react-router-dom';
import { api, ApiError } from '../api/client';
import { useI18n } from '../i18n';
import AuthLang from '../components/AuthLang';

// Always shows the same answer, so the page cannot be used to find out who has an account.
export default function ForgotPasswordPage() {
  const { t } = useI18n();
  const [email, setEmail] = useState('');
  const [busy, setBusy] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState('');

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setBusy(true); setError('');
    try { await api.post('/auth/forgot-password', { email: email.trim() }); setSent(true); }
    catch (err) { setError(err instanceof ApiError ? err.message : 'failed'); }
    finally { setBusy(false); }
  };

  return (
    <div className="auth-card">
      <AuthLang />
      <h1>{t('auth.forgotTitle')}</h1>
      {sent ? (
        <p role="status">{t('auth.sent')}</p>
      ) : (
        <>
          <p className="muted">{t('auth.forgotLead')}</p>
          <form onSubmit={onSubmit}>
            <input type="email" placeholder={t('auth.email')} value={email} onChange={(e) => setEmail(e.target.value)} required autoComplete="email" />
            {error && <p className="error-text" role="alert">{error}</p>}
            <button type="submit" disabled={busy}>{busy ? t('auth.sending') : t('auth.sendLink')}</button>
          </form>
        </>
      )}
      <p className="muted"><Link to="/login">{t('auth.back')}</Link></p>
    </div>
  );
}

import { useState, type FormEvent } from 'react';
import { safeNext } from '../auth/next';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';
import { ApiError } from '../api/client';
import { useI18n } from '../i18n';
import AuthLang from '../components/AuthLang';

export default function RegisterPage() {
  const { register } = useAuth();
  const { t } = useI18n();
  const navigate = useNavigate();
  const location = useLocation();
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError('');
    try {
      await register(email, password, fullName);
      navigate(safeNext(location.search), { replace: true });
    } catch (err) {
      setError(err instanceof ApiError ? err.message : t('auth.regFail'));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="auth-card">
      <AuthLang />
      <h1>{t('auth.regTitle')}</h1>
      <form onSubmit={onSubmit}>
        <input
          placeholder={t('auth.fullName')}
          value={fullName}
          onChange={(e) => setFullName(e.target.value)}
          required
        />
        <input
          type="email"
          placeholder={t('auth.email')}
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
        <input
          type="password"
          placeholder={t('auth.passMin')}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          minLength={8}
          required
        />
        {error && <p className="error-text">{error}</p>}
        <button type="submit" disabled={busy}>
          {busy ? t('auth.creating') : t('auth.register')}
        </button>
      </form>
      <p className="muted">
        {t('auth.haveAccount')} <Link to={`/login${location.search}`}>{t('auth.signin')}</Link>
      </p>
    </div>
  );
}

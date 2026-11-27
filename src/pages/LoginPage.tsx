import { useState, type FormEvent } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { safeNext } from '../auth/next';
import { useAuth } from '../auth/AuthContext';
import { ApiError } from '../api/client';
import { useI18n } from '../i18n';
import AuthLang from '../components/AuthLang';

export default function LoginPage() {
  const { login } = useAuth();
  const { t } = useI18n();
  const navigate = useNavigate();
  const location = useLocation();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError('');
    try {
      await login(email, password);
      const from = (location.state as { from?: { pathname: string } } | null)
        ?.from?.pathname;
      navigate(from ?? safeNext(location.search), { replace: true });
    } catch (err) {
      setError(err instanceof ApiError ? err.message : t('auth.loginFail'));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="auth-card">
      <AuthLang />
      <h1>{t('auth.signinTitle')}</h1>
      <form onSubmit={onSubmit}>
        <input
          type="email"
          placeholder={t('auth.email')}
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
        <input
          type="password"
          placeholder={t('auth.password')}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />
        {error && <p className="error-text">{error}</p>}
        <button type="submit" disabled={busy}>
          {busy ? t('auth.signingIn') : t('auth.signin')}
        </button>
      </form>
      <p className="muted">
        {t('auth.noAccount')} <Link to="/register">{t('auth.register')}</Link>
      </p>
      <p className="muted"><Link to="/forgot-password">{t('auth.forgot')}</Link></p>
    </div>
  );
}

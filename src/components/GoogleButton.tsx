import { useEffect, useState } from 'react';
import { API_URL } from '../api/client';
import { useI18n } from '../i18n';

// "Continue with Google". Shown only when the server has Google sign-in set up.
export default function GoogleButton() {
  const { t } = useI18n();
  const [on, setOn] = useState(false);
  useEffect(() => {
    let live = true;
    fetch(`${API_URL}/auth/google/config`)
      .then((r) => (r.ok ? r.json() : { enabled: false }))
      .then((j) => live && setOn(j.enabled === true))
      .catch(() => {});
    return () => { live = false; };
  }, []);
  if (!on) return null;
  return (
    <>
      <a className="google-btn" href={`${API_URL}/auth/google/start`}>
        <svg width="18" height="18" viewBox="0 0 48 48" aria-hidden="true">
          <path fill="#4285F4" d="M45.1 24.5c0-1.6-.1-3.1-.4-4.5H24v8.5h11.9c-.5 2.8-2.1 5.1-4.5 6.7v5.5h7.3c4.3-3.9 6.8-9.7 6.8-16.2z" />
          <path fill="#34A853" d="M24 46c6.1 0 11.2-2 14.9-5.5l-7.3-5.5c-2 1.4-4.6 2.2-7.6 2.2-5.8 0-10.8-3.9-12.5-9.2H4v5.7C7.7 41.1 15.3 46 24 46z" />
          <path fill="#FBBC05" d="M11.5 28c-.5-1.4-.7-2.9-.7-4.5s.3-3.1.7-4.5v-5.7H4C2.4 16.5 1.5 20.1 1.5 24s.9 7.5 2.5 10.7l7.5-5.7z" />
          <path fill="#EA4335" d="M24 10.8c3.3 0 6.2 1.1 8.5 3.3l6.4-6.4C35.2 4.1 30.1 2 24 2 15.3 2 7.7 6.9 4 14.3l7.5 5.7c1.7-5.3 6.7-9.2 12.5-9.2z" />
        </svg>
        <span>{t('auth.google')}</span>
      </a>
      <p className="auth-or muted"><span>{t('auth.or')}</span></p>
    </>
  );
}

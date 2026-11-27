import { useEffect } from 'react';
import { storeTokens } from '../api/client';

// Google sign-in lands here with the tokens in the URL fragment. Store them, wipe the address, and reload into the app.
export default function GoogleCallbackPage() {
  useEffect(() => {
    const p = new URLSearchParams(window.location.hash.replace(/^#/, ''));
    const access = p.get('access_token');
    const refresh = p.get('refresh_token');
    if (access && refresh) {
      storeTokens({ access_token: access, refresh_token: refresh, token_type: 'Bearer', expires_in: 900 });
      window.location.replace('/app');
    } else {
      window.location.replace('/login?google=failed&reason=invalid');
    }
  }, []);
  return <p className="page-message" role="status">…</p>;
}

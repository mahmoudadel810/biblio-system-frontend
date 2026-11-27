import { useState, type FormEvent } from 'react';
import { useI18n } from '../i18n';
import { api, ApiError, clearTokens, request } from '../api/client';

// Self-service account safety: change password, sign out everywhere, download my data, delete my account.
export default function AccountPage() {
  const { t } = useI18n();
  const [cur, setCur] = useState('');
  const [next, setNext] = useState('');
  const [msg, setMsg] = useState('');
  const [err, setErr] = useState('');
  const [delPw, setDelPw] = useState('');
  const [confirmDel, setConfirmDel] = useState(false);

  const fail = (e: unknown) => setErr(e instanceof ApiError ? e.message : t('account.failed'));
  const leave = () => {
    clearTokens();
    window.location.assign('/login');
  };

  const changePw = async (e: FormEvent) => {
    e.preventDefault();
    setErr('');
    setMsg('');
    try {
      await api.post('/auth/change-password', { current_password: cur, new_password: next });
      leave();
    } catch (x) {
      fail(x);
    }
  };
  const signOutAll = async () => {
    setErr('');
    try {
      await api.post('/auth/logout-all');
      leave();
    } catch (x) {
      fail(x);
    }
  };
  const download = async () => {
    setErr('');
    try {
      const data = await api.get<unknown>('/me/export');
      const url = URL.createObjectURL(new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' }));
      const a = document.createElement('a');
      a.href = url;
      a.download = 'my-biblio-data.json';
      a.click();
      URL.revokeObjectURL(url);
      setMsg(t('account.downloaded'));
    } catch (x) {
      fail(x);
    }
  };
  const del = async (e: FormEvent) => {
    e.preventDefault();
    setErr('');
    try {
      await request('DELETE', '/me', { password: delPw });
      leave();
    } catch (x) {
      fail(x);
    }
  };

  return (
    <div className="account-page">
      <h1>{t('account.title')}</h1>
      {msg && <p role="status">{msg}</p>}
      {err && <p className="error-text" role="alert">{err}</p>}

      <section className="panel">
        <h2>{t('account.password')}</h2>
        <form className="stack-form" onSubmit={changePw}>
          <label>{t('account.current')}
            <input type="password" value={cur} onChange={(e) => setCur(e.target.value)} autoComplete="current-password" required />
          </label>
          <label>{t('account.new')}
            <input type="password" value={next} onChange={(e) => setNext(e.target.value)} autoComplete="new-password" minLength={8} maxLength={128} required />
          </label>
          <p className="muted">{t('account.pwNote')}</p>
          <button type="submit">{t('account.changePw')}</button>
        </form>
      </section>

      <section className="panel">
        <h2>{t('account.sessions')}</h2>
        <p className="muted">{t('account.sessionsNote')}</p>
        <button type="button" className="secondary" onClick={signOutAll}>{t('account.signOutAll')}</button>
      </section>

      <section className="panel">
        <h2>{t('account.data')}</h2>
        <p className="muted">{t('account.dataNote')}</p>
        <button type="button" className="secondary" onClick={download}>{t('account.download')}</button>
      </section>

      <section className="panel danger-zone">
        <h2>{t('account.delete')}</h2>
        <p className="muted">{t('account.deleteNote')}</p>
        {!confirmDel ? (
          <button type="button" className="secondary" onClick={() => setConfirmDel(true)}>{t('account.delete')}</button>
        ) : (
          <form className="stack-form" onSubmit={del}>
            <label>{t('account.confirmPw')}
              <input type="password" value={delPw} onChange={(e) => setDelPw(e.target.value)} autoComplete="current-password" required />
            </label>
            <div>
              <button type="submit" className="danger">{t('account.deleteForever')}</button>{' '}
              <button type="button" className="secondary" onClick={() => { setConfirmDel(false); setDelPw(''); }}>{t('account.cancel')}</button>
            </div>
          </form>
        )}
      </section>
    </div>
  );
}

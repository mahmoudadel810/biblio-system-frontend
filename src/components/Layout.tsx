import { useEffect } from 'react';
import { api } from '../api/client';
import { Link, NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';
import { useI18n } from '../i18n';
import Logo from './Logo';
import { useCalendar } from '../public/useCalendar';
import { useUnread } from './useUnread';
import { useInstall } from './useInstall';

export default function Layout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const isDesk = user?.role === 'assistant';
  const isStaff = user?.role === 'librarian' || user?.role === 'admin' || isDesk;
  const isFull = isStaff && !isDesk;
  const isAdmin = user?.role === 'admin';
  const { t, lang, setLang } = useI18n();
  const [cal, toggleCal] = useCalendar();
  const unread = useUnread(!!user);
  // Keep the saved language in step with the toggle so reminders arrive in the member's language.
  useEffect(() => {
    if (!user) return;
    const key = `biblio.lang.synced.${user.id ?? ''}`;
    if (sessionStorage.getItem(key) === lang) return;
    api.patch('/me/preferences', { lang }).then(() => sessionStorage.setItem(key, lang)).catch(() => {});
  }, [user, lang]);
  const { canInstall, install } = useInstall();
  const badge = unread > 0 ? <span className="nav-badge" aria-label={`${unread}`}>{unread > 99 ? '99+' : unread}</span> : null;

  const titleKeys: Record<string, string> = {
    '/app': isStaff ? 'staff.nav.dashboard' : 'reader.mylib', '/catalog': 'staff.nav.catalog', '/notifications': 'reader.notes',
    '/loans': 'staff.nav.loans', '/desk': 'staff.nav.desk', '/labels': 'staff.nav.labels', '/members': 'staff.nav.members', '/transfers': 'staff.nav.transfers', '/interlibrary': 'staff.nav.interlibrary',
    '/procurement': 'staff.nav.procurement', '/inventory': 'staff.nav.inventory', '/import': 'staff.nav.import',
    '/payments': 'staff.nav.payments', '/reports': 'staff.nav.reports', '/analytics': 'staff.nav.analytics', '/settings': 'staff.nav.settings',
    '/organizations': 'staff.nav.orgs', '/audit': 'staff.nav.audit', '/account': 'nav.account',
  };
  const pageH1 = <h1 className="sr-only">{titleKeys[pathname] ? t(titleKeys[pathname]) : 'Biblio'}</h1>;

  const onLogout = async () => {
    await logout();
    navigate('/login');
  };

  if (!isStaff) {
    // Readers get their own shell: warm, rounded and bilingual, clearly not the staff console.
    return (
      <div className="app-shell reader-shell">
        <header className="reader-bar">
          <Link to="/" aria-label="Biblio"><Logo lang={lang} /></Link>
          <nav className="reader-nav" aria-label={t('nav.main')}>
            <NavLink to="/app" end>{t('reader.mylib')}</NavLink>
            <NavLink to="/books">{t('nav.books')}</NavLink>
            <NavLink to="/notifications">{t('reader.notes')}{badge}</NavLink>
            <NavLink to="/account">{t('nav.account')}</NavLink>
          </nav>
          <div className="reader-user">
            <button type="button" className="pill ghost" onClick={() => setLang(lang === 'en' ? 'ar' : 'en')}>{t('lang.switch')}</button>
            {canInstall && <button type="button" className="pill" onClick={install}>{t('pwa.install')}</button>}
            <span className="reader-name">{user?.fullName || ''}</span>
            <button type="button" className="pill ghost" onClick={onLogout}>{t('reader.logout')}</button>
          </div>
        </header>
        <main className="reader-content">
          {pageH1}
          <Outlet />
        </main>
      </div>
    );
  }

  return (
    <div className="app-shell">
      <header className="topbar">
        <span className="brand">Biblio</span>
        <nav className="nav">
          <NavLink to="/app">{t('staff.nav.dashboard')}</NavLink>
          <NavLink to="/catalog">{t('staff.nav.catalog')}</NavLink>
          <NavLink to="/notifications">{t('reader.notes')}{badge}</NavLink>
          {isStaff && <NavLink to="/desk">{t('staff.nav.desk')}</NavLink>}
          {isFull && <NavLink to="/labels">{t('staff.nav.labels')}</NavLink>}
          {isStaff && <NavLink to="/loans">{t('staff.nav.loans')}</NavLink>}
          {isStaff && <NavLink to="/members">{t('staff.nav.members')}</NavLink>}
          {isFull && <NavLink to="/transfers">{t('staff.nav.transfers')}</NavLink>}
          {isFull && <NavLink to="/interlibrary">{t('staff.nav.interlibrary')}</NavLink>}
          {isFull && <NavLink to="/procurement">{t('staff.nav.procurement')}</NavLink>}
          {isFull && <NavLink to="/inventory">{t('staff.nav.inventory')}</NavLink>}
          {isFull && <NavLink to="/import">{t('staff.nav.import')}</NavLink>}
          {isFull && <NavLink to="/payments">{t('staff.nav.payments')}</NavLink>}
          {isFull && <NavLink to="/reports">{t('staff.nav.reports')}</NavLink>}
          {isFull && <NavLink to="/analytics">{t('staff.nav.analytics')}</NavLink>}
          {isAdmin && <NavLink to="/settings">{t('staff.nav.settings')}</NavLink>}
          {isAdmin && <NavLink to="/organizations">{t('staff.nav.orgs')}</NavLink>}
          {isAdmin && <NavLink to="/audit">{t('staff.nav.audit')}</NavLink>}
        </nav>
        <div className="topbar-user">
          <NavLink to="/account">{user?.fullName || t('nav.account')}</NavLink>
          <button type="button" className="secondary" onClick={() => setLang(lang === 'en' ? 'ar' : 'en')}>{t('lang.switch')}</button>
          <button type="button" className="secondary" aria-pressed={cal === 'hijri'} onClick={toggleCal}>
            {t(cal === 'hijri' ? 'my.useGregorian' : 'my.useHijri')}
          </button>
          <button type="button" onClick={onLogout}>
            {t('reader.logout')}
          </button>
        </div>
      </header>
      <main className="content">
        {pageH1}
        <Outlet />
      </main>
    </div>
  );
}

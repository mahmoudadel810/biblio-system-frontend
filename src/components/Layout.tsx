import { Link, NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';
import { useI18n } from '../i18n';
import Logo from './Logo';
import { useCalendar } from '../public/useCalendar';
import { useUnread } from './useUnread';

export default function Layout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const isStaff = user?.role === 'librarian' || user?.role === 'admin';
  const isAdmin = user?.role === 'admin';
  const { t, lang, setLang } = useI18n();
  const [cal, toggleCal] = useCalendar();
  const unread = useUnread(!!user);
  const badge = unread > 0 ? <span className="nav-badge" aria-label={`${unread}`}>{unread > 99 ? '99+' : unread}</span> : null;

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
          </nav>
          <div className="reader-user">
            <button type="button" className="pill ghost" onClick={() => setLang(lang === 'en' ? 'ar' : 'en')}>{t('lang.switch')}</button>
            <span className="reader-name">{user?.fullName || ''}</span>
            <button type="button" className="pill ghost" onClick={onLogout}>{t('reader.logout')}</button>
          </div>
        </header>
        <main className="reader-content">
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
          {isStaff && <NavLink to="/loans">{t('staff.nav.loans')}</NavLink>}
          {isStaff && <NavLink to="/members">{t('staff.nav.members')}</NavLink>}
          {isStaff && <NavLink to="/transfers">{t('staff.nav.transfers')}</NavLink>}
          {isStaff && <NavLink to="/procurement">{t('staff.nav.procurement')}</NavLink>}
          {isStaff && <NavLink to="/inventory">{t('staff.nav.inventory')}</NavLink>}
          {isStaff && <NavLink to="/import">{t('staff.nav.import')}</NavLink>}
          {isStaff && <NavLink to="/payments">{t('staff.nav.payments')}</NavLink>}
          {isStaff && <NavLink to="/reports">{t('staff.nav.reports')}</NavLink>}
          {isAdmin && <NavLink to="/settings">{t('staff.nav.settings')}</NavLink>}
          {isAdmin && <NavLink to="/organizations">{t('staff.nav.orgs')}</NavLink>}
          {isAdmin && <NavLink to="/audit">{t('staff.nav.audit')}</NavLink>}
        </nav>
        <div className="topbar-user">
          <span>{user?.fullName || user?.role}</span>
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
        <Outlet />
      </main>
    </div>
  );
}

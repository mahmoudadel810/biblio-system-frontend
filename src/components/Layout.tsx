import { Link, NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';
import { useI18n } from '../i18n';
import Logo from './Logo';

export default function Layout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const isStaff = user?.role === 'librarian' || user?.role === 'admin';
  const isAdmin = user?.role === 'admin';
  const { t, lang, setLang } = useI18n();

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
            <NavLink to="/notifications">{t('reader.notes')}</NavLink>
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
          <NavLink to="/app">Dashboard</NavLink>
          <NavLink to="/catalog">Catalog</NavLink>
          <NavLink to="/notifications">Notifications</NavLink>
          {isStaff && <NavLink to="/loans">Loans</NavLink>}
          {isStaff && <NavLink to="/members">Members</NavLink>}
          {isStaff && <NavLink to="/transfers">Transfers</NavLink>}
          {isStaff && <NavLink to="/procurement">Procurement</NavLink>}
          {isStaff && <NavLink to="/inventory">Inventory</NavLink>}
          {isStaff && <NavLink to="/payments">Payments</NavLink>}
          {isStaff && <NavLink to="/reports">Reports</NavLink>}
          {isAdmin && <NavLink to="/settings">Settings</NavLink>}
          {isAdmin && <NavLink to="/organizations">Organizations</NavLink>}
          {isAdmin && <NavLink to="/audit">Audit</NavLink>}
        </nav>
        <div className="topbar-user">
          <span>{user?.fullName || user?.role}</span>
          <button type="button" onClick={onLogout}>
            Log out
          </button>
        </div>
      </header>
      <main className="content">
        <Outlet />
      </main>
    </div>
  );
}

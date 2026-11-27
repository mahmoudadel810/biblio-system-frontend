import { useState, type FormEvent } from 'react';
import { Link, NavLink, Outlet, useNavigate } from 'react-router-dom';
import Logo from '../components/Logo';
import { useI18n } from '../i18n';
import { useAuth } from '../auth/AuthContext';

export default function PublicLayout() {
  const { t, lang, setLang } = useI18n();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [q, setQ] = useState('');
  const onSearch = (e: FormEvent) => {
    e.preventDefault();
    const term = q.trim();
    if (term) navigate(`/books?q=${encodeURIComponent(term)}`);
  };
  return (
    <>
      <a className="skip" href="#main">{t('skip')}</a>
      <div className="partner-line">
        <Link to="/library/start">{t('nav.partner')}</Link>
      </div>
      <header className="pub-head">
        <Link to="/" aria-label="Biblio"><Logo lang={lang} /></Link>
        <nav className="pub-nav" aria-label={t('nav.main')}>
          <NavLink to="/books">{t('nav.books')}</NavLink>
          <NavLink to="/authors">{t('nav.authors')}</NavLink>
          <NavLink to="/libraries">{t('nav.libraries')}</NavLink>
          <NavLink to="/bookstores">{t('nav.bookstores')}</NavLink>
        </nav>
        <form onSubmit={onSearch} role="search" className="pub-search">
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder={t('search.placeholder')} aria-label={t('search.placeholder')} />
          <button type="submit" className="sr-only">{t('search.go')}</button>
        </form>
        <button type="button" className="pill ghost" onClick={() => setLang(lang === 'en' ? 'ar' : 'en')}>
          {t('lang.switch')}
        </button>
        {user ? (
          <Link className="pill" to="/app">{user.fullName || 'Account'}</Link>
        ) : (
          <>
            <Link className="pill ghost" to="/login">{t('nav.signin')}</Link>
            <Link className="pill" to="/register">{t('nav.join')}</Link>
          </>
        )}
      </header>
      <main id="main"><Outlet /></main>
      <footer className="pub-foot">
        <span>Biblio</span>
        <span>{t('footer.credit')} <Link to="/credits">{t('credits.link')}</Link></span>
      </footer>
    </>
  );
}

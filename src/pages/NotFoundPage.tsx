import { Link } from 'react-router-dom';
import { useI18n } from '../i18n';

export default function NotFoundPage() {
  const { t } = useI18n();
  return (
    <div className="page-message" style={{ textAlign: 'center', padding: '72px 16px' }}>
      <h1>{t('notfound.title')}</h1>
      <p className="muted">{t('notfound.body')}</p>
      <p><Link className="pill" to="/">{t('notfound.home')}</Link> <Link className="pill ghost" to="/books">{t('nav.books')}</Link></p>
    </div>
  );
}

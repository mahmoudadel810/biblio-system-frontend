import { Link } from 'react-router-dom';
import { useI18n } from '../i18n';
import { useTitle } from './hooks';

const SOURCES = [
  { key: 'wp', url: 'https://www.wikipedia.org/' },
  { key: 'wq', url: 'https://www.wikiquote.org/' },
  { key: 'ol', url: 'https://openlibrary.org/' },
] as const;

export default function CreditsPage() {
  const { t } = useI18n();
  useTitle(t('credits.title'));
  return (
    <div className="credits">
      <h1>{t('credits.title')}</h1>
      <p className="lede">{t('credits.intro')}</p>
      <ul className="credits-list">
        {SOURCES.map((s) => (
          <li key={s.key}>
            <h2><a href={s.url} target="_blank" rel="noopener noreferrer">{t(`credits.${s.key}.name`)}</a></h2>
            <p>{t(`credits.${s.key}.use`)}</p>
            <p className="muted">{t(`credits.${s.key}.terms`)}</p>
          </li>
        ))}
      </ul>
      <p>
        <a href="https://creativecommons.org/licenses/by-sa/4.0/" target="_blank" rel="noopener noreferrer">{t('credits.license')}</a>
      </p>
      <p><Link to="/">{t('credits.back')}</Link></p>
    </div>
  );
}

import { useI18n } from '../i18n';

// Language switch for the sign-in screens, which have no header.
export default function AuthLang() {
  const { t, lang, setLang } = useI18n();
  return (
    <p style={{ textAlign: 'end', margin: 0 }}>
      <button type="button" className="secondary" onClick={() => setLang(lang === 'en' ? 'ar' : 'en')}>{t('lang.switch')}</button>
    </p>
  );
}

import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { en } from './en';
import { ar } from './ar';

export type Lang = 'en' | 'ar';
type Dict = Record<string, string>;
const dicts: Record<Lang, Dict> = { en, ar };

const Ctx = createContext<{ lang: Lang; setLang: (l: Lang) => void; t: (k: string) => string }>({
  lang: 'en',
  setLang: () => {},
  t: (k) => k,
});

function initial(): Lang {
  const q = new URLSearchParams(window.location.search).get('lang');
  if (q === 'ar' || q === 'en') return q;
  const saved = localStorage.getItem('biblio.lang');
  if (saved === 'ar' || saved === 'en') return saved;
  return navigator.language.toLowerCase().startsWith('ar') ? 'ar' : 'en';
}

export function I18nProvider({ children }: { children: ReactNode }) {
  const [lang, setLang] = useState<Lang>(initial);
  useEffect(() => {
    document.documentElement.lang = lang;
    document.documentElement.dir = lang === 'ar' ? 'rtl' : 'ltr';
    localStorage.setItem('biblio.lang', lang);
  }, [lang]);
  const value = useMemo(
    () => ({ lang, setLang, t: (k: string) => dicts[lang][k] ?? dicts.en[k] ?? k }),
    [lang],
  );
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export const useI18n = () => useContext(Ctx);

import type { Lang } from '../i18n';

export const dateIn = (days: number) => { const d = new Date(); d.setDate(d.getDate() + days); return d; };
export const ymd = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
// Calendar preference: Gregorian by default, Hijri (Umm al-Qura) when the user picks it. Digits stay Latin.
export type Calendar = 'gregory' | 'hijri';
export const getCalendar = (): Calendar => (localStorage.getItem('biblio.calendar') === 'hijri' ? 'hijri' : 'gregory');
export const setCalendar = (c: Calendar) => localStorage.setItem('biblio.calendar', c);
export const fmtDate = (iso: string, lang: Lang) => {
  const cal = getCalendar() === 'hijri' ? 'islamic-umalqura' : 'gregory';
  return new Intl.DateTimeFormat(`${lang === 'ar' ? 'ar-SA' : 'en-GB'}-u-ca-${cal}-nu-latn`, { dateStyle: 'medium' }).format(new Date(iso));
};
// Amounts are in SAR. The currency symbol follows the locale.
export const fmtMoney = (n: number, lang: Lang) =>
  new Intl.NumberFormat(lang === 'ar' ? 'ar-SA' : 'en-SA', { style: 'currency', currency: 'SAR' }).format(n);
export const fmtDateTime = (iso: string, lang: Lang) => {
  const cal = getCalendar() === 'hijri' ? 'islamic-umalqura' : 'gregory';
  return new Intl.DateTimeFormat(`${lang === 'ar' ? 'ar-SA' : 'en-GB'}-u-ca-${cal}-nu-latn`, { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(iso));
};

import type { Lang } from '../i18n';

export const dateIn = (days: number) => { const d = new Date(); d.setDate(d.getDate() + days); return d; };
export const ymd = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
export const fmtDate = (iso: string, lang: Lang) =>
  new Intl.DateTimeFormat(lang === 'ar' ? 'ar-SA-u-nu-latn' : 'en-GB', { dateStyle: 'medium' }).format(new Date(iso));
// Amounts are in SAR. The currency symbol follows the locale.
export const fmtMoney = (n: number, lang: Lang) =>
  new Intl.NumberFormat(lang === 'ar' ? 'ar-SA' : 'en-SA', { style: 'currency', currency: 'SAR' }).format(n);

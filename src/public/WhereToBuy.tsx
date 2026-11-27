import { useI18n } from '../i18n';
import { useFetch } from './hooks';
import { fmtMoney } from './format';

interface Listing { id: string; store_name: string; store_slug: string; city: string | null; price_halalas: number | null; currency: string; buy_url: string; in_stock: boolean }

// Verified bookstores that list this book. Links go out to the store; Biblio takes no payment.
export default function WhereToBuy({ slug }: { slug: string }) {
  const { lang, t } = useI18n();
  const { data } = useFetch<Listing[]>(`/books/${encodeURIComponent(slug)}/listings`);
  if (!data || data.length === 0) return null;
  return (
    <section className="buy" aria-labelledby="buy-h">
      <h2 id="buy-h">{t('buy.title')}</h2>
      <ul className="buy-list">
        {data.map((l) => (
          <li key={l.id}>
            <div>
              <strong><bdi>{l.store_name}</bdi></strong>
              {l.city && <span className="muted small"> <bdi>{l.city}</bdi></span>}
              <div className="muted small">
                {l.price_halalas != null && <bdi>{fmtMoney(l.price_halalas / 100, lang)}</bdi>}
                {l.price_halalas != null && ' · '}
                {l.in_stock ? t('buy.instock') : t('buy.out')}
              </div>
            </div>
            <a className="pill ghost" href={l.buy_url} target="_blank" rel="noopener noreferrer sponsored">{t('buy.go')}</a>
          </li>
        ))}
      </ul>
      <p className="muted small">{t('buy.note')}</p>
    </section>
  );
}

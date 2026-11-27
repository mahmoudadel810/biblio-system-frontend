import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useI18n } from '../i18n';
import type { BookCard, AuthorCard } from './api';

const SCENES = [
  { bg: '#1f2a44', fg: '#f6f1e7', ac: '#e4572e' },
  { bg: '#c4400f', fg: '#ffffff', ac: '#1f2a44' },
  { bg: '#2f7d5b', fg: '#f6f1e7', ac: '#f2c14e' },
  { bg: '#f2c14e', fg: '#1f2a44', ac: '#e4572e' },
];

function sceneFor(text: string) {
  let h = 0;
  for (const ch of text) h = (h * 31 + ch.charCodeAt(0)) >>> 0;
  return SCENES[h % SCENES.length];
}

// Designed fallback for books without a cover: flat colour, spine band, title and author.
export function FallbackCover({ title, author }: { title: string; author?: string }) {
  const s = sceneFor(title);
  return (
    <div
      className="cover fallback"
      style={{ background: s.bg, color: s.fg }}
      role="img"
      aria-label={title}
    >
      <span className="spine" style={{ background: s.ac }} aria-hidden="true" />
      <strong>{title}</strong>
      {author && <small>{author}</small>}
    </div>
  );
}

export function Cover({
  book,
  decorative = false,
  eager = false,
}: {
  book: Pick<BookCard, 'title' | 'cover_url' | 'authors'> & { cover_url_ar?: string | null };
  decorative?: boolean;
  eager?: boolean;
}) {
  const { lang, t } = useI18n();
  const [failed, setFailed] = useState(false);
  const a = book.authors[0];
  const author = a ? (lang === 'ar' && a.name_ar ? a.name_ar : a.name) : undefined;
  const base = lang === 'ar' && book.cover_url_ar ? book.cover_url_ar : book.cover_url;
  // Larger variant for the hero and book page when we host one.
  const src = base && eager && base.startsWith('/covers/') ? base.replace('.webp', '-lg.webp') : base;
  if (!src || failed) return <FallbackCover title={book.title} author={author} />;
  return (
    <img
      className="cover"
      src={src}
      alt={decorative ? '' : `${t('cover.alt')} ${book.title}`}
      loading={eager ? 'eager' : 'lazy'}
      decoding="async"
      {...(eager ? { fetchPriority: 'high' as const } : {})}
      width={200}
      height={300}
      onError={() => setFailed(true)}
    />
  );
}

export function BookTile({ book }: { book: BookCard }) {
  const { lang } = useI18n();
  const title = lang === 'ar' && book.title_ar ? book.title_ar : book.title;
  const a = book.authors[0];
  const author = a ? (lang === 'ar' && a.name_ar ? a.name_ar : a.name) : '';
  return (
    <Link to={`/books/${encodeURIComponent(book.slug)}`} className="tile reveal">
      <Cover book={{ ...book, title }} decorative />
      {book.tag && <span className="tag">{book.tag}</span>}
      <strong>{title}</strong>
      <span className="muted">{author}</span>
    </Link>
  );
}

export function AuthorTile({ a }: { a: AuthorCard }) {
  const { lang } = useI18n();
  const name = lang === 'ar' && a.name_ar ? a.name_ar : a.name;
  const years = [a.birth_year, a.death_year].filter(Boolean).join(' - ');
  return (
    <Link to={`/authors/${encodeURIComponent(a.slug)}`} className="tile reveal">
      {a.photo_url ? (
        <img className="cover round" src={a.photo_url} alt="" loading="lazy" width={200} height={200} />
      ) : (
        <div className="cover blank round" aria-hidden="true">{name}</div>
      )}
      <strong>{name}</strong>
      <bdi className="muted">{years}</bdi>
    </Link>
  );
}

// Floating book for the hero: tilts with scroll and pointer (transform only).
export function HeroBook({ book }: { book: BookCard }) {
  return (
    <div className="hero-book" aria-hidden="true">
      <div className="hero-book-inner">
        <Cover book={book} decorative eager />
      </div>
    </div>
  );
}

import { Link } from 'react-router-dom';
import { useI18n } from '../i18n';
import type { BookCard, AuthorCard } from './api';

export function Cover({ book }: { book: Pick<BookCard, 'title' | 'cover_url'> }) {
  return book.cover_url ? (
    <img className="cover" src={book.cover_url} alt={`Cover of ${book.title}`} loading="lazy" width={200} height={300} />
  ) : (
    <div className="cover blank" role="img" aria-label={`No cover for ${book.title}`}>{book.title}</div>
  );
}

export function BookTile({ book }: { book: BookCard }) {
  const { lang } = useI18n();
  const title = lang === 'ar' && book.title_ar ? book.title_ar : book.title;
  const a = book.authors[0];
  const author = a ? (lang === 'ar' && a.name_ar ? a.name_ar : a.name) : '';
  return (
    <Link to={`/books/${book.slug}`} className="tile reveal">
      <Cover book={book} />
      <strong>{title}</strong>
      <span className="muted">{author}</span>
    </Link>
  );
}

export function AuthorTile({ a }: { a: AuthorCard }) {
  const { lang } = useI18n();
  return (
    <Link to={`/authors/${a.slug}`} className="tile reveal">
      {a.photo_url ? <img className="cover round" src={a.photo_url} alt={a.name} loading="lazy" width={200} height={200} /> : <div className="cover blank round">{a.name}</div>}
      <strong>{lang === 'ar' && a.name_ar ? a.name_ar : a.name}</strong>
      <span className="muted">{[a.birth_year, a.death_year].filter(Boolean).join(' - ')}</span>
    </Link>
  );
}

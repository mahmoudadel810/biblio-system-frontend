import { Fragment, useCallback, useEffect, useState, type FormEvent } from 'react';
import { api, ApiError } from '../api/client';
import type { Book, Branch, Copy } from '../api/types';
import { useAuth } from '../auth/AuthContext';
import { useI18n } from '../i18n';

export default function CatalogPage() {
  const { user } = useAuth();
  const { t } = useI18n();
  const st = (v: string) => { const r = t(`copy.s.${v}`); return r === `copy.s.${v}` ? v : r; };
  const isStaff = user?.role === 'librarian' || user?.role === 'admin';
  const [query, setQuery] = useState('');
  const [books, setBooks] = useState<Book[]>([]);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [reserveBranch, setReserveBranch] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [newBook, setNewBook] = useState({ isbn: '', title: '', publisher: '' });
  const [copies, setCopies] = useState<Record<string, Copy[]>>({});

  const toggleCopies = async (bookId: string) => {
    if (copies[bookId]) {
      setCopies((prev) => {
        const next = { ...prev };
        delete next[bookId];
        return next;
      });
      return;
    }
    try {
      const rows = await api.get<Copy[]>(`/books/${bookId}/copies`);
      setCopies((prev) => ({ ...prev, [bookId]: rows }));
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'could not load copies');
    }
  };

  const load = useCallback((q: string) => {
    const path = q ? `/books?q=${encodeURIComponent(q)}` : '/books';
    api
      .get<Book[]>(path)
      .then(setBooks)
      .catch((e) => setError(e.message));
  }, []);

  useEffect(() => {
    load('');
    api
      .get<Branch[]>('/branches')
      .then((rows) => {
        setBranches(rows.filter((b) => b.is_active));
        if (rows.length > 0) setReserveBranch(rows[0].id);
      })
      .catch(() => {});
  }, [load]);

  const onSearch = (e: FormEvent) => {
    e.preventDefault();
    load(query.trim());
  };

  const reserve = async (bookId: string) => {
    if (!user || !reserveBranch) return;
    setMessage('');
    setError('');
    try {
      await api.post('/reservations', {
        book_id: bookId,
        member_id: user.id,
        branch_id: reserveBranch,
      });
      setMessage(t('cat.reserved'));
    } catch (err) {
      setError(err instanceof ApiError ? err.message : t('cat.resFail'));
    }
  };

  const addBook = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    try {
      await api.post('/books', {
        isbn: newBook.isbn,
        title: newBook.title,
        publisher: newBook.publisher || undefined,
        language: 'en',
      });
      setNewBook({ isbn: '', title: '', publisher: '' });
      load(query.trim());
    } catch (err) {
      setError(err instanceof ApiError ? err.message : t('cat.addFail'));
    }
  };

  return (
    <>
      <div className="panel">
        <h2>{t('cat.title')}</h2>
        <form className="inline-form" onSubmit={onSearch}>
          <input
            placeholder={t('cat.search')}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
          <button type="submit">{t('cat.searchBtn')}</button>
        </form>
        {!isStaff && branches.length > 0 && (
          <p className="muted">
            {t('cat.reserveAt')}{' '}
            <select
              value={reserveBranch}
              onChange={(e) => setReserveBranch(e.target.value)}
            >
              {branches.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.name}
                </option>
              ))}
            </select>
          </p>
        )}
        {message && <p>{message}</p>}
        {error && <p className="error-text">{error}</p>}
        <table>
          <thead>
            <tr>
              <th>{t('rep.title')}</th>
              <th>{t('rep.isbn')}</th>
              <th>{t('cat.publisher')}</th>
              <th>{t('cat.year')}</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {books.map((book) => (
              <Fragment key={book.id}>
                <tr>
                  <td>{book.title}</td>
                  <td>{book.isbn}</td>
                  <td>{book.publisher ?? '—'}</td>
                  <td>{book.published_year ?? '—'}</td>
                  <td>
                    <button
                      type="button"
                      className="secondary"
                      onClick={() => toggleCopies(book.id)}
                    >
                      {copies[book.id] ? t('cat.hide') : t('cat.copies')}
                    </button>{' '}
                    {!isStaff && (
                      <button
                        type="button"
                        className="secondary"
                        onClick={() => reserve(book.id)}
                      >
                        {t('cat.reserve')}
                      </button>
                    )}
                  </td>
                </tr>
                {copies[book.id] && (
                  <tr key={`${book.id}-copies`}>
                    <td colSpan={5}>
                      {copies[book.id].length === 0 ? (
                        <span className="muted">{t('cat.noCopies')}</span>
                      ) : (
                        copies[book.id].map((c) => (
                          <span
                            key={c.id}
                            className={`badge ${c.status === 'available' ? 'ok' : ''}`}
                            style={{ marginRight: 6 }}
                          >
                            {c.branch_name}: {c.barcode} ({st(c.status)})
                          </span>
                        ))
                      )}
                    </td>
                  </tr>
                )}
              </Fragment>
            ))}
          </tbody>
        </table>
      </div>

      {isStaff && (
        <div className="panel">
          <h2>{t('cat.add')}</h2>
          <form className="inline-form" onSubmit={addBook}>
            <input
              placeholder={t('rep.isbn')}
              value={newBook.isbn}
              onChange={(e) => setNewBook({ ...newBook, isbn: e.target.value })}
              required
              minLength={10}
            />
            <input
              placeholder={t('rep.title')}
              value={newBook.title}
              onChange={(e) =>
                setNewBook({ ...newBook, title: e.target.value })
              }
              required
            />
            <input
              placeholder={t('cat.pub')}
              value={newBook.publisher}
              onChange={(e) =>
                setNewBook({ ...newBook, publisher: e.target.value })
              }
            />
            <button type="submit">{t('cat.addBtn')}</button>
          </form>
        </div>
      )}
    </>
  );
}

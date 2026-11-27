import { Fragment, useCallback, useEffect, useState, type FormEvent } from 'react';
import { api, ApiError } from '../api/client';
import type { Book, Branch, Copy } from '../api/types';
import { useAuth } from '../auth/AuthContext';

export default function CatalogPage() {
  const { user } = useAuth();
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
      setMessage('Reservation placed.');
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'reservation failed');
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
      setError(err instanceof ApiError ? err.message : 'could not add book');
    }
  };

  return (
    <>
      <div className="panel">
        <h2>Catalog</h2>
        <form className="inline-form" onSubmit={onSearch}>
          <input
            placeholder="Search by title or ISBN"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
          <button type="submit">Search</button>
        </form>
        {!isStaff && branches.length > 0 && (
          <p className="muted">
            Reserve at branch:{' '}
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
              <th>Title</th>
              <th>ISBN</th>
              <th>Publisher</th>
              <th>Year</th>
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
                      {copies[book.id] ? 'Hide copies' : 'Copies'}
                    </button>{' '}
                    {!isStaff && (
                      <button
                        type="button"
                        className="secondary"
                        onClick={() => reserve(book.id)}
                      >
                        Reserve
                      </button>
                    )}
                  </td>
                </tr>
                {copies[book.id] && (
                  <tr key={`${book.id}-copies`}>
                    <td colSpan={5}>
                      {copies[book.id].length === 0 ? (
                        <span className="muted">No copies yet.</span>
                      ) : (
                        copies[book.id].map((c) => (
                          <span
                            key={c.id}
                            className={`badge ${c.status === 'available' ? 'ok' : ''}`}
                            style={{ marginRight: 6 }}
                          >
                            {c.branch_name}: {c.barcode} ({c.status})
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
          <h2>Add a book</h2>
          <form className="inline-form" onSubmit={addBook}>
            <input
              placeholder="ISBN"
              value={newBook.isbn}
              onChange={(e) => setNewBook({ ...newBook, isbn: e.target.value })}
              required
              minLength={10}
            />
            <input
              placeholder="Title"
              value={newBook.title}
              onChange={(e) =>
                setNewBook({ ...newBook, title: e.target.value })
              }
              required
            />
            <input
              placeholder="Publisher (optional)"
              value={newBook.publisher}
              onChange={(e) =>
                setNewBook({ ...newBook, publisher: e.target.value })
              }
            />
            <button type="submit">Add</button>
          </form>
        </div>
      )}
    </>
  );
}

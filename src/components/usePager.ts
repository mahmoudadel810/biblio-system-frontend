import { useCallback, useState } from 'react';
import { api } from '../api/client';

// A list that loads the first page, then more on request (offset paging). The page calls `reload` to fetch from the start
// (on mount and after changes).
export function usePager<T>(path: string, pageSize: number) {
  const [rows, setRows] = useState<T[]>([]);
  const [more, setMore] = useState(false);
  const [error, setError] = useState('');
  const url = (offset: number) => `${path}${path.includes('?') ? '&' : '?'}offset=${offset}`;

  const reload = useCallback(() => {
    api
      .get<T[]>(url(0))
      .then((r) => { setRows(r); setMore(r.length === pageSize); setError(''); })
      .catch((e) => setError((e as Error).message));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [path, pageSize]);

  const loadMore = () =>
    api
      .get<T[]>(url(rows.length))
      .then((r) => { setRows((prev) => [...prev, ...r]); setMore(r.length === pageSize); })
      .catch((e) => setError((e as Error).message));

  return { rows, more, error, reload, loadMore };
}

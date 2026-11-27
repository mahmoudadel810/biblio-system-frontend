import { api } from '../api/client';
import type { Book } from '../api/types';
import type { PickItem } from './Picker';

// Search functions for Picker. Module-level so their identity is stable between renders.
export const findCopies = (q: string): Promise<PickItem[]> =>
  api
    .get<{ id: string; barcode: string; book_title: string; branch_name: string }[]>(
      `/copies/lookup?q=${encodeURIComponent(q)}`,
    )
    .then((r) => r.map((c) => ({ id: c.id, title: c.book_title, sub: `${c.barcode} · ${c.branch_name}` })));

export const findBooks = (q: string): Promise<PickItem[]> =>
  api
    .get<Book[]>(`/books?q=${encodeURIComponent(q)}`)
    .then((r) => r.slice(0, 20).map((b) => ({ id: b.id, title: b.title, sub: b.isbn || undefined })));

export const findMembers = (q: string): Promise<PickItem[]> =>
  api
    .get<{ id: string; full_name: string; email: string }[]>(`/members?q=${encodeURIComponent(q)}`)
    .then((r) => r.map((m) => ({ id: m.id, title: m.full_name, sub: m.email })));

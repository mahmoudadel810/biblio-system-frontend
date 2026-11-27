const API_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:8080';

export async function pub<T>(path: string): Promise<T> {
  const res = await fetch(`${API_URL}/public${path}`);
  if (!res.ok) throw Object.assign(new Error(`request failed (${res.status})`), { status: res.status });
  return res.json() as Promise<T>;
}

export interface AuthorRef { slug: string | null; name: string; name_ar: string | null }
export interface BookCard {
  id: string; slug: string; title: string; title_ar: string | null; cover_url: string | null;
  published_year: number | null; language: string; featured: boolean; is_public_domain: boolean;
  authors: AuthorRef[]; available_copies: number;
}
export interface Page<T> { items: T[]; page: number; per_page: number; total: number }
export interface Quote {
  id: string; text: string; text_ar: string | null; author_name: string | null;
  author_name_ar: string | null; author_slug: string | null; source_url: string | null;
}
export interface Category { slug: string; name: string; name_ar: string | null; book_count: number }
export interface AuthorCard {
  slug: string; name: string; name_ar: string | null; photo_url: string | null;
  birth_year: number | null; death_year: number | null; nationality: string | null; book_count: number;
}
export interface BookDetail extends BookCard {
  subtitle: string | null; description: string | null; description_ar: string | null;
  publisher: string | null; page_count: number | null;
  categories: { slug: string | null; name: string; name_ar: string | null }[];
  why_this_book: { why: string; why_ar: string | null; written_by: string } | null;
  readership: { year: number; note: string; note_ar: string | null; copies_sold: number | null; is_estimate: boolean; source_url: string }[];
  quotes: Quote[];
  availability: { branch: string; available: number; total: number }[];
  related: BookCard[];
}
export interface AuthorDetail extends AuthorCard {
  bio: string | null; life_story: string | null; life_story_ar: string | null; bio_ar: string | null;
  source_url: string | null; books: BookCard[]; quotes: Quote[];
}

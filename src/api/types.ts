// API types mirroring the biblio-system-rust backend responses.

export type Role = 'member' | 'librarian' | 'admin';

export interface Member {
  id: string;
  branch_id: string | null;
  email: string;
  full_name: string;
  role: Role;
  is_active: boolean;
}

export interface TokenPair {
  access_token: string;
  refresh_token: string;
  token_type: string;
  expires_in: number;
}

export interface Branch {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  address: string;
  is_active: boolean;
}

export interface Author {
  id: string;
  name: string;
  bio: string | null;
}

export interface Category {
  id: string;
  name: string;
  description: string | null;
}

export interface Book {
  id: string;
  isbn: string;
  title: string;
  subtitle: string | null;
  publisher: string | null;
  published_year: number | null;
  language: string;
  description: string | null;
}

export type CopyStatus =
  | 'available'
  | 'borrowed'
  | 'reserved'
  | 'in_transit'
  | 'lost'
  | 'maintenance';

export interface Copy {
  id: string;
  branch_id: string;
  branch_name: string;
  barcode: string;
  status: CopyStatus;
}

export interface Loan {
  id: string;
  copy_id: string;
  member_id: string;
  borrowed_at: string;
  due_at: string;
  returned_at: string | null;
  renewed_count: number;
  member_name?: string | null;
  member_email?: string | null;
  book_title?: string | null;
  copy_barcode?: string | null;
}

export interface Reservation {
  id: string;
  book_id: string;
  member_id: string;
  branch_id: string;
  status: string;
  expires_at: string;
}

export interface Fine {
  id: string;
  loan_id: string;
  member_id: string;
  amount: number;
  reason: string;
  status: 'unpaid' | 'paid' | 'waived';
  member_name?: string | null;
  member_email?: string | null;
}

export interface AppNotification {
  id: string;
  kind: string;
  title: string;
  body: string;
  is_read: boolean;
  created_at: string;
}

export interface DashboardLoan {
  loan_id: string;
  book_title: string;
  barcode: string;
  due_at: string;
  renewed_count: number;
  is_overdue: boolean;
}

export interface DashboardReservation {
  reservation_id: string;
  book_title: string;
  branch_name: string;
  expires_at: string;
}

export interface Dashboard {
  open_loans: DashboardLoan[];
  active_reservations: DashboardReservation[];
  unpaid_fines_total: number;
  unread_notifications: number;
}

export interface LibrarySettings {
  loan_days: number;
  max_renewals: number;
  fine_per_day: number;
  reservation_days: number;
  max_loan_days: number;
  max_fine_per_loan: number;
  lost_fee: number;
  damaged_fee: number;
  digital_loan_days: number;
  hold_pickup_days: number;
  max_open_loans: number;
}

export interface AuditLog {
  id: string;
  actor_id: string | null;
  actor_name?: string | null;
  action: string;
  entity_type: string;
  entity_id: string | null;
  details: Record<string, unknown>;
  created_at: string;
}

export interface Transfer {
  id: string;
  copy_label?: string | null;
  copy_id: string;
  from_branch_id: string;
  to_branch_id: string;
  status: 'in_transit' | 'received' | 'cancelled';
  requested_by: string | null;
  received_by: string | null;
  created_at: string;
  received_at: string | null;
}

export interface Supplier {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  address: string | null;
  active: boolean;
}

export interface PurchaseOrderItem {
  id: string;
  order_id: string;
  book_id: string;
  quantity: number;
  received_qty: number;
  unit_cost: number;
}

export interface PurchaseOrder {
  id: string;
  supplier_id: string;
  branch_id: string;
  status: 'draft' | 'ordered' | 'received' | 'cancelled';
  ordered_by: string | null;
  received_by: string | null;
  created_at: string;
  updated_at: string;
  ordered_at: string | null;
  received_at: string | null;
}

export interface PurchaseOrderWithItems extends PurchaseOrder {
  items: PurchaseOrderItem[];
}

export interface Adjustment {
  id: string;
  copy_label?: string | null;
  copy_id: string;
  adjusted_by: string | null;
  from_status: string;
  to_status: string;
  reason: string;
  created_at: string;
}

export interface StockLevel {
  branch_id: string;
  status: CopyStatus;
  copies: number;
}

export interface Payment {
  id: string;
  fine_id: string;
  member_id: string;
  amount: number;
  method: 'cash' | 'card' | 'transfer';
  received_by: string | null;
  created_at: string;
  member_name?: string | null;
}

export interface PaymentSummary {
  days: number;
  collected: number;
  payments: number;
  by_method: { method: string; payments: number; total: number }[];
}

export interface PopularBook {
  book_id: string;
  title: string;
  isbn: string;
  loan_count: number;
  active_reservations: number;
}

export interface OverdueLoan {
  loan_id: string;
  member_id: string;
  member_name: string;
  member_email: string;
  book_title: string;
  barcode: string;
  due_at: string;
  days_overdue: number;
}

export interface FinesSummary {
  unpaid_count: number;
  unpaid_total: number;
  paid_count: number;
  paid_total: number;
  waived_count: number;
  waived_total: number;
}

export interface CirculationDay {
  day: string;
  loans: number;
  returns: number;
  renewals: number;
}

export interface Overview {
  books: number;
  copies: number;
  members: number;
  active_loans: number;
  overdue_loans: number;
  active_reservations: number;
  unpaid_fines_total: number;
}

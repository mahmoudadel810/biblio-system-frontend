import { lazy, Suspense } from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';
import PublicLayout from './public/PublicLayout';
import HomePage from './public/HomePage';
import BooksPage from './public/BooksPage';
import BookPage from './public/BookPage';
import { AuthorsPage, AuthorPage } from './public/AuthorsPage';
import LibraryStartPage from './public/LibraryStartPage';
import DirectoryPage from './public/DirectoryPage';
import ProtectedRoute from './components/ProtectedRoute';

// Staff and account screens load on demand; the public site stays in the main chunk.
const Layout = lazy(() => import('./components/Layout'));
const AuditPage = lazy(() => import('./pages/AuditPage'));
const CatalogPage = lazy(() => import('./pages/CatalogPage'));
const DashboardPage = lazy(() => import('./pages/DashboardPage'));
const InventoryPage = lazy(() => import('./pages/InventoryPage'));
const LoansPage = lazy(() => import('./pages/LoansPage'));
const LoginPage = lazy(() => import('./pages/LoginPage'));
const MembersPage = lazy(() => import('./pages/MembersPage'));
const NotificationsPage = lazy(() => import('./pages/NotificationsPage'));
const PaymentsPage = lazy(() => import('./pages/PaymentsPage'));
const ProcurementPage = lazy(() => import('./pages/ProcurementPage'));
const RegisterPage = lazy(() => import('./pages/RegisterPage'));
const ReportsPage = lazy(() => import('./pages/ReportsPage'));
const SettingsPage = lazy(() => import('./pages/SettingsPage'));
const OrgQueuePage = lazy(() => import('./pages/OrgQueuePage'));
const TransfersPage = lazy(() => import('./pages/TransfersPage'));

export default function App() {
  return (
    <Suspense fallback={<p className="page-message" role="status">…</p>}>
    <Routes>
      <Route element={<PublicLayout />}>
        <Route path="/" element={<HomePage />} />
        <Route path="/books" element={<BooksPage />} />
        <Route path="/books/:slug" element={<BookPage />} />
        <Route path="/authors" element={<AuthorsPage />} />
        <Route path="/authors/:slug" element={<AuthorPage />} />
        <Route path="/library/start" element={<LibraryStartPage />} />
        <Route path="/libraries" element={<DirectoryPage kind="library" />} />
        <Route path="/bookstores" element={<DirectoryPage kind="bookstore" />} />
      </Route>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />
      <Route
        element={
          <ProtectedRoute>
            <Layout />
          </ProtectedRoute>
        }
      >
        <Route path="/app" element={<DashboardPage />} />
        <Route path="/catalog" element={<CatalogPage />} />
        <Route path="/notifications" element={<NotificationsPage />} />
        <Route
          path="/loans"
          element={
            <ProtectedRoute role="librarian">
              <LoansPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/members"
          element={
            <ProtectedRoute role="librarian">
              <MembersPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/transfers"
          element={
            <ProtectedRoute role="librarian">
              <TransfersPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/procurement"
          element={
            <ProtectedRoute role="librarian">
              <ProcurementPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/inventory"
          element={
            <ProtectedRoute role="librarian">
              <InventoryPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/payments"
          element={
            <ProtectedRoute role="librarian">
              <PaymentsPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/reports"
          element={
            <ProtectedRoute role="librarian">
              <ReportsPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/settings"
          element={
            <ProtectedRoute role="admin">
              <SettingsPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/organizations"
          element={
            <ProtectedRoute role="admin">
              <OrgQueuePage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/audit"
          element={
            <ProtectedRoute role="admin">
              <AuditPage />
            </ProtectedRoute>
          }
        />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
    </Suspense>
  );
}

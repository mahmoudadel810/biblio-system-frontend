import { lazy, Suspense } from 'react';
import { useEffect } from 'react';
import { Route, Routes, useLocation } from 'react-router-dom';
import PublicLayout from './public/PublicLayout';
import HomePage from './public/HomePage';
import BooksPage from './public/BooksPage';
import BookPage from './public/BookPage';
import { AuthorsPage, AuthorPage } from './public/AuthorsPage';
import LibraryStartPage from './public/LibraryStartPage';
import DirectoryPage from './public/DirectoryPage';
import CreditsPage from './public/CreditsPage';
const StoreListingsPage = lazy(() => import('./pages/StoreListingsPage'));
const ReaderPage = lazy(() => import('./public/ReaderPage'));
import ProtectedRoute from './components/ProtectedRoute';

// Staff and account screens load on demand; the public site stays in the main chunk.
const Layout = lazy(() => import('./components/Layout'));
const AuditPage = lazy(() => import('./pages/AuditPage'));
const CatalogPage = lazy(() => import('./pages/CatalogPage'));
const DashboardPage = lazy(() => import('./pages/DashboardPage'));
const InventoryPage = lazy(() => import('./pages/InventoryPage'));
const DeskPage = lazy(() => import('./pages/DeskPage'));
const LoansPage = lazy(() => import('./pages/LoansPage'));
const LoginPage = lazy(() => import('./pages/LoginPage'));
const ForgotPasswordPage = lazy(() => import('./pages/ForgotPasswordPage'));
const ResetPasswordPage = lazy(() => import('./pages/ResetPasswordPage'));
const MembersPage = lazy(() => import('./pages/MembersPage'));
const NotificationsPage = lazy(() => import('./pages/NotificationsPage'));
const PaymentsPage = lazy(() => import('./pages/PaymentsPage'));
const ProcurementPage = lazy(() => import('./pages/ProcurementPage'));
const RegisterPage = lazy(() => import('./pages/RegisterPage'));
const ReportsPage = lazy(() => import('./pages/ReportsPage'));
const SettingsPage = lazy(() => import('./pages/SettingsPage'));
const OrgQueuePage = lazy(() => import('./pages/OrgQueuePage'));
const TransfersPage = lazy(() => import('./pages/TransfersPage'));
const GoogleCallbackPage = lazy(() => import('./pages/GoogleCallbackPage'));
const NotFoundPage = lazy(() => import('./pages/NotFoundPage'));
const AccountPage = lazy(() => import('./pages/AccountPage'));
const ImportPage = lazy(() => import('./pages/ImportPage'));

// Staff and account screens have no page-level title hook; give each route a title.
const ROUTE_TITLES: Record<string, string> = {
  '/login': 'Sign in', '/forgot-password': 'Reset password', '/reset-password': 'New password', '/register': 'Create account', '/app': 'My library', '/account': 'Account', '/catalog': 'Catalog',
  '/notifications': 'Notifications', '/loans': 'Loans', '/members': 'Members', '/transfers': 'Transfers',
  '/procurement': 'Procurement', '/inventory': 'Inventory', '/payments': 'Payments', '/reports': 'Reports',
  '/import': 'Import', '/settings': 'Settings', '/organizations': 'Organizations', '/audit': 'Audit log',
};
function RouteTitle() {
  const { pathname } = useLocation();
  useEffect(() => {
    const t = ROUTE_TITLES[pathname];
    if (t) document.title = `${t} | Biblio`;
    else if (/^\/store\/[^/]+\/listings$/.test(pathname)) document.title = 'Store listings | Biblio';
  }, [pathname]);
  return null;
}

export default function App() {
  return (
    <>
    <RouteTitle />
    <Suspense fallback={<p className="page-message" role="status">…</p>}>
    <Routes>
      <Route element={<PublicLayout />}>
        <Route path="/" element={<HomePage />} />
        <Route path="/books" element={<BooksPage />} />
        <Route path="/books/:slug" element={<BookPage />} />
        <Route path="/read/:slug" element={<ReaderPage />} />
        <Route path="/store/:orgId/listings" element={<ProtectedRoute><StoreListingsPage /></ProtectedRoute>} />
        <Route path="/authors" element={<AuthorsPage />} />
        <Route path="/authors/:slug" element={<AuthorPage />} />
        <Route path="/library/start" element={<LibraryStartPage />} />
        <Route path="/credits" element={<CreditsPage />} />
        <Route path="/libraries" element={<DirectoryPage kind="library" />} />
        <Route path="/bookstores" element={<DirectoryPage kind="bookstore" />} />
      </Route>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />
      <Route path="/auth/google" element={<GoogleCallbackPage />} />
      <Route path="/forgot-password" element={<ForgotPasswordPage />} />
      <Route path="/reset-password" element={<ResetPasswordPage />} />
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
        <Route path="/account" element={<AccountPage />} />
        <Route
          path="/loans"
          element={
            <ProtectedRoute role="librarian">
              <LoansPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/desk"
          element={
            <ProtectedRoute role="librarian">
              <DeskPage />
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
          path="/import"
          element={
            <ProtectedRoute role="librarian">
              <ImportPage />
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
      <Route element={<PublicLayout />}>
        <Route path="*" element={<NotFoundPage />} />
      </Route>
    </Routes>
    </Suspense>
    </>
  );
}

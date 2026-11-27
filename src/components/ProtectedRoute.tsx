import type { ReactNode } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';
import type { Role } from '../api/types';

const ROLE_RANK: Record<Role, number> = { member: 0, librarian: 1, admin: 2 };

interface Props {
  children: ReactNode;
  role?: Role;
}

export default function ProtectedRoute({ children, role }: Props) {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) return <p className="page-message">Loading…</p>;
  if (!user) return <Navigate to="/login" state={{ from: location }} replace />;
  if (role && ROLE_RANK[user.role] < ROLE_RANK[role]) {
    return <Navigate to="/" replace />;
  }
  return <>{children}</>;
}

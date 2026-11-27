import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';

export default function Layout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const isStaff = user?.role === 'librarian' || user?.role === 'admin';
  const isAdmin = user?.role === 'admin';

  const onLogout = async () => {
    await logout();
    navigate('/login');
  };

  return (
    <div className="app-shell">
      <header className="topbar">
        <span className="brand">Biblio</span>
        <nav className="nav">
          <NavLink to="/app">Dashboard</NavLink>
          <NavLink to="/catalog">Catalog</NavLink>
          <NavLink to="/notifications">Notifications</NavLink>
          {isStaff && <NavLink to="/loans">Loans</NavLink>}
          {isStaff && <NavLink to="/members">Members</NavLink>}
          {isStaff && <NavLink to="/transfers">Transfers</NavLink>}
          {isStaff && <NavLink to="/procurement">Procurement</NavLink>}
          {isStaff && <NavLink to="/inventory">Inventory</NavLink>}
          {isStaff && <NavLink to="/payments">Payments</NavLink>}
          {isStaff && <NavLink to="/reports">Reports</NavLink>}
          {isAdmin && <NavLink to="/settings">Settings</NavLink>}
          {isAdmin && <NavLink to="/organizations">Organizations</NavLink>}
          {isAdmin && <NavLink to="/audit">Audit</NavLink>}
        </nav>
        <div className="topbar-user">
          <span>{user?.fullName || user?.role}</span>
          <button type="button" onClick={onLogout}>
            Log out
          </button>
        </div>
      </header>
      <main className="content">
        <Outlet />
      </main>
    </div>
  );
}

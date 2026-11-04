import AdminUsers from './pages/AdminUsers';
import { BrowserRouter, Link, NavLink, Navigate, Route, Routes, useLocation, useNavigate, Outlet } from 'react-router-dom';
import { AuthProvider, useAuth } from './AuthContext';
import Home from './pages/Home';
import AuthForm from './pages/AuthForm';
import Book from './pages/Book';
import MyBookings from './pages/MyBookings';
import Staff from './pages/Staff';
import Admin from './pages/Admin';
import AdminOverview from './pages/AdminOverview';
import AdminLayout from './AdminLayout';
import './styles.css';

function ProtectedRoute({ roles, children }) {
  const { user, loading } = useAuth();
  const location = useLocation();
  if (loading) return <div className="shell section empty">Loading account...</div>;
  if (!user) return <Navigate to={`/login?next=${encodeURIComponent(location.pathname + location.search)}`} replace />;
  if (roles && !roles.includes(user.role)) return <Navigate to="/" replace />;
  return children;
}

function Header() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const goHome = (e) => {
    e.preventDefault();
    navigate('/');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const goPackages = (e) => {
    e.preventDefault();
    if (location.pathname === '/') {
      document.getElementById('packages')?.scrollIntoView({ behavior: 'smooth' });
    } else {
      navigate('/');
      setTimeout(() => {
        document.getElementById('packages')?.scrollIntoView({ behavior: 'smooth' });
      }, 100);
    }
  };

  return (
    <header className="site-header">
      <div className="shell nav-shell">
        <Link className="brand" to="/" aria-label="CaterEase homepage" onClick={goHome}>
          <span className="brand-mark">✳</span> Cater<span>Ease</span>
        </Link>
        <nav aria-label="Main navigation" className="nav-links">
          <a href="/" onClick={goHome} className={location.pathname === '/' && !location.hash ? 'active' : ''}>Home</a>
          <a href="/#packages" onClick={goPackages} className={location.hash === '#packages' ? 'active' : ''}>Packages</a>
          {user?.role === 'customer' && <NavLink to="/my-bookings">My bookings</NavLink>}
          {(user?.role === 'staff' || user?.role === 'admin') && <NavLink to="/staff">Operations</NavLink>}
          {user?.role === 'admin' && <NavLink to="/admin/overview">Dashboard</NavLink>}
          {user?.role === 'admin' && <NavLink to="/admin" end>Manage packages</NavLink>}
        </nav>
        <div className="nav-account">
          {user ? (
            <>
              <span className="nav-name" title={user.full_name}>Hi, {user.full_name.split(' ')[0]}</span>
              <button className="button outline small" onClick={() => { logout(); navigate('/'); }}>Log out</button>
            </>
          ) : (
            <>
              <Link className="nav-signin" to="/login">Log in</Link>
              <Link className="button small" to="/register">Get started</Link>
            </>
          )}
        </div>
      </div>
    </header>
  );
}

function Footer() {
  return <footer className="site-footer"><div className="shell footer-flex"><span className="brand footer-brand"><span className="brand-mark">✳</span> Cater<span>Ease</span></span><span>Beautiful events start with simple planning.</span><small>Information Management · Student project</small></div></footer>;
}

function PublicLayout() {
  return <div className="app-shell"><Header /><main><Outlet /></main><Footer /></div>;
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route element={<PublicLayout />}>
            <Route path="/" element={<Home />} />
            <Route path="/login" element={<AuthForm mode="login" />} />
            <Route path="/register" element={<AuthForm mode="register" />} />
            <Route path="/book" element={<ProtectedRoute roles={['customer']}><Book /></ProtectedRoute>} />
            <Route path="/my-bookings" element={<ProtectedRoute roles={['customer']}><MyBookings /></ProtectedRoute>} />
            <Route path="*" element={<section className="shell section"><h1>Page not found</h1><Link to="/">Return home</Link></section>} />
          </Route>

          <Route path="/staff" element={<ProtectedRoute roles={['staff', 'admin']}><AdminLayout><Staff /></AdminLayout></ProtectedRoute>} />
          <Route path="/admin/overview" element={<ProtectedRoute roles={['admin']}><AdminLayout><AdminOverview /></AdminLayout></ProtectedRoute>} />
          <Route path="/admin" element={<ProtectedRoute roles={['admin']}><AdminLayout><Admin /></AdminLayout></ProtectedRoute>} />
          <Route path="/admin/users" element={<ProtectedRoute roles={['admin']}><AdminLayout><AdminUsers /></AdminLayout></ProtectedRoute>} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}
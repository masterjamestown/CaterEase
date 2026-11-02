import { NavLink, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from './AuthContext';
import { useState, useEffect } from 'react';
import './AdminLayout.css';

export default function AdminLayout({ children }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  useEffect(() => {
    setIsSidebarOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    const handleEsc = (e) => {
      if (e.key === 'Escape') setIsSidebarOpen(false);
    };
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, []);

  useEffect(() => {
    if (isSidebarOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isSidebarOpen]);

  const closeSidebar = () => setIsSidebarOpen(false);

  return (
    <div className="al-wrapper">
      <div
        className={`al-overlay ${isSidebarOpen ? 'open' : ''}`}
        onClick={closeSidebar}
        aria-hidden="true"
      ></div>

      <aside className={`al-sidebar ${isSidebarOpen ? 'open' : ''}`}>
        <div 
          className="al-brand" 
          onClick={() => { navigate(user?.role === 'admin' ? '/admin/overview' : '/staff'); closeSidebar(); }} 
          style={{ cursor: 'pointer' }}
        >
          <span className="al-brand-mark">✳</span> Cater<span>Ease</span>
        </div>

        <nav className="al-nav">
          <span className="al-nav-label">Menu</span>
          <NavLink to="/admin/overview" className={({ isActive }) => isActive ? 'al-nav-link active' : 'al-nav-link'} onClick={closeSidebar}>
            <span className="al-icon">◫</span> Dashboard
          </NavLink>
          <NavLink to="/staff" className={({ isActive }) => isActive ? 'al-nav-link active' : 'al-nav-link'} onClick={closeSidebar}>
            <span className="al-icon">☷</span> Operations
          </NavLink>
          {user?.role === 'admin' && (
            <NavLink to="/admin" end className={({ isActive }) => isActive ? 'al-nav-link active' : 'al-nav-link'} onClick={closeSidebar}>
              <span className="al-icon">◈</span> Manage Packages
            </NavLink>
          )}

          <div className="al-nav-divider"></div>

          <NavLink to="/" className="al-nav-link" onClick={closeSidebar}>
            <span className="al-icon">←</span> Back to Website
          </NavLink>
        </nav>

        <div className="al-footer">
          <div className="al-user">
            <span className="al-user-name">{user?.full_name}</span>
            <span className="al-user-role">{user?.role}</span>
          </div>
          <button className="al-logout" onClick={() => { logout(); navigate('/'); }}>
            Log out
          </button>
        </div>
      </aside>

      <main className="al-main">
        <div className="al-topbar">
          <button className="al-hamburger" onClick={() => setIsSidebarOpen(true)} aria-label="Open sidebar">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="3" y1="12" x2="21" y2="12"></line>
              <line x1="3" y1="6" x2="21" y2="6"></line>
              <line x1="3" y1="18" x2="21" y2="18"></line>
            </svg>
          </button>
          <span className="al-topbar-title">CaterEase {user?.role === 'admin' ? 'Admin' : 'Staff'}</span>
        </div>
        {children}
      </main>
    </div>
  );
}
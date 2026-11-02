import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from './AuthContext';
import './AdminLayout.css';

export default function AdminLayout({ children }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  return (
    <div className="al-wrapper">
      <aside className="al-sidebar">
        <div className="al-brand" onClick={() => navigate(user?.role === 'admin' ? '/admin/overview' : '/staff')} style={{ cursor: 'pointer' }}>
          <span className="al-brand-mark">✳</span> Cater<span>Ease</span>
        </div>
        
        <nav className="al-nav">
          <span className="al-nav-label">Menu</span>
          {user?.role === 'admin' && (
            <NavLink to="/admin/overview" className={({ isActive }) => isActive ? 'al-nav-link active' : 'al-nav-link'}>
              <span className="al-icon">◫</span> Dashboard
            </NavLink>
          )}
          <NavLink to="/staff" className={({ isActive }) => isActive ? 'al-nav-link active' : 'al-nav-link'}>
            <span className="al-icon">☷</span> Operations
          </NavLink>
          {user?.role === 'admin' && (
            <NavLink to="/admin" end className={({ isActive }) => isActive ? 'al-nav-link active' : 'al-nav-link'}>
              <span className="al-icon">◈</span> Manage Packages
            </NavLink>
          )}
          
          <div className="al-nav-divider"></div>
          
          <NavLink to="/" className="al-nav-link">
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
        {children}
      </main>
    </div>
  );
}
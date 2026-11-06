import { useEffect, useState } from 'react';
import { api } from '../api';

export default function AdminUsers() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [busy, setBusy] = useState(null);

  const loadUsers = () => {
    setLoading(true);
    api('/admin/users')
      .then(setUsers)
      .catch(err => setError(err.message))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadUsers();
  }, []);

  async function changeRole(id, newRole) {
    setBusy(id);
    setError('');
    setMessage('');
    try {
      await api(`/admin/users/${id}/role`, { 
        method: 'PATCH', 
        body: JSON.stringify({ role: newRole }) 
      });
      setMessage('User role updated successfully.');
      await loadUsers();
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(null);
    }
  }

  async function deleteUser(id) {
    if (!window.confirm('Are you sure you want to permanently delete this user?')) return;
    setBusy(id);
    setError('');
    setMessage('');
    try {
      await api(`/admin/users/${id}`, { method: 'DELETE' });
      setMessage('User deleted successfully.');
      await loadUsers();
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(null);
    }
  }

  return (
    <section className="admin-page-wrapper">
      <div className="admin-header">
        <div>
          <span className="ce-eyebrow">ADMINISTRATOR</span>
          <h1 className="admin-title">User <span className="ce-gold-italic">Accounts</span></h1>
        </div>
        <p className="admin-subtitle">Manage system access and promote customers to staff or admin roles.</p>
      </div>

      {error && <div className="auth-status-banner" style={{ borderLeftColor: '#914c49', backgroundColor: '#f5e0dc', color: '#914c49', marginBottom: '20px' }} role="alert">{error}</div>}
      {message && <div className="ce-alert-success" style={{ marginBottom: '20px' }} role="status">{message}</div>}

      {loading && <div className="empty">Loading users...</div>}

      {!loading && users.length > 0 && (
        <div className="admin-table-card">
          <table className="premium-table">
            <thead>
              <tr>
                <th>User Info</th>
                <th>Joined</th>
                <th>Role</th>
                <th style={{ textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.map(user => (
                <tr key={user.user_id}>
                  <td>
                    <div className="user-cell">
                      <div className="user-avatar">
                        {user.full_name.charAt(0).toUpperCase()}
                      </div>
                      <div className="user-info-stack">
                        <strong>{user.full_name}</strong>
                        <small>{user.email}</small>
                      </div>
                    </div>
                  </td>
                  <td className="table-date">{user.created_at}</td>
                  <td>
                    <span className={`role-pill role-${user.role}`}>
                      {user.role}
                    </span>
                  </td>
                  <td>
                    <div className="table-actions">
                      <select
                        value={user.role}
                        onChange={(e) => changeRole(user.user_id, e.target.value)}
                        disabled={busy === user.user_id || user.role === 'admin'}
                        className="premium-select"
                      >
                        <option value="customer">Customer</option>
                        <option value="staff">Staff</option>
                        <option value="admin">Admin</option>
                      </select>
                      {user.role !== 'admin' && (
                        <button
                          onClick={() => deleteUser(user.user_id)}
                          disabled={busy === user.user_id}
                          className="premium-delete-btn"
                          title="Delete User"
                        >
                          {busy === user.user_id ? '...' : 'Delete'}
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}
import { useEffect, useState } from 'react';
import { api } from '../api';
import './AdminOverview.css';

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
    <section className="ov-page">
      <div className="ov-head">
        <div>
          <span className="eyebrow green">ADMINISTRATOR</span>
          <h1>User Accounts</h1>
        </div>
        <p>Manage system access and promote customers to staff or admin roles.</p>
      </div>

      {error && <div className="ov-alert" role="alert">{error}</div>}
      {message && <div className="notice success" role="status">{message}</div>}

      {loading && <div className="ov-loading">Loading users...</div>}

      {!loading && users.length > 0 && (
        <div className="ov-panel">
          <table className="ov-recent-table">
            <thead>
              <tr>
                <th>User Info</th>
                <th>Joined</th>
                <th>Current Role</th>
                <th style={{ textAlign: 'center' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.map(user => (
                <tr key={user.user_id}>
                  <td>
                    <div className="ov-cell-stack" style={{ alignItems: 'flex-start', textAlign: 'left' }}>
                      <strong>{user.full_name}</strong>
                      <small>{user.email}</small>
                    </div>
                  </td>
                  <td>{user.created_at}</td>
                  <td>
                    <span className={`ov-pill ${user.role === 'admin' ? 'confirmed' : user.role === 'staff' ? 'in_preparation' : 'pending'}`}>
                      {user.role}
                    </span>
                  </td>
                  <td>
                    <div style={{ display: 'flex', gap: '8px', alignItems: 'center', justifyContent: 'flex-end' }}>
                      <select 
                        value={user.role} 
                        onChange={(e) => changeRole(user.user_id, e.target.value)}
                        disabled={busy === user.user_id || user.role === 'admin'}
                        className="role-select"
                      >
                        <option value="customer">Customer</option>
                        <option value="staff">Staff</option>
                        <option value="admin">Admin</option>
                      </select>

                      {user.role !== 'admin' && (
                        <button 
                          onClick={() => deleteUser(user.user_id)}
                          disabled={busy === user.user_id}
                          className="button small outline"
                          style={{ color: '#914c49', borderColor: '#f5e0dc', padding: '8px 12px' }}
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
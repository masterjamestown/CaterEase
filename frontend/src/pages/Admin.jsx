import { useCallback, useEffect, useState } from 'react';
import { api, peso } from '../api';

const emptyForm = { name: '', description: '', price_per_guest: '', minimum_guests: '20' };

const packageImages = [
  "https://images.unsplash.com/photo-1555244162-803834f70033?q=80&w=1000&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1511795409834-ef04bbd61622?q=80&w=1000&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1555939594-58d7cb561ad1?q=80&w=1000&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1464366400600-7168b8af9bc3?q=80&w=1000&auto=format&fit=crop"
];

export default function Admin() {
  const [packages, setPackages] = useState([]);
  const [form, setForm] = useState(emptyForm);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  const load = useCallback(async () => { 
    try { 
      setPackages(await api('/admin/packages')); 
    } catch (err) { 
      setError(err.message); 
    } finally { 
      setLoading(false); 
    } 
  }, []);
  
  useEffect(() => { load(); }, [load]);

  async function create(event) {
    event.preventDefault();
    setSaving(true);
    setError('');
    setMessage('');
    try {
      await api('/admin/packages', { method: 'POST', body: JSON.stringify(form) });
      setForm(emptyForm);
      setMessage('New catering package created.');
      await load();
    } catch (err) { 
      setError(err.message); 
    } finally { 
      setSaving(false); 
    }
  }

  async function toggle(item) {
    setError('');
    setMessage('');
    try {
      await api(`/admin/packages/${item.package_id}/visibility`, { method: 'PATCH', body: JSON.stringify({ is_active: !Boolean(item.is_active) }) });
      setMessage('Package visibility updated.');
      await load();
    } catch (err) { 
      setError(err.message); 
    }
  }

  return (
    <section className="admin-page-wrapper">
      <div className="admin-header">
        <div>
          <span className="ce-eyebrow">ADMINISTRATOR</span>
          <h1 className="admin-title">Manage <span className="ce-gold-italic">Packages</span></h1>
        </div>
        <p className="admin-subtitle">Add new offerings and manage which packages customers can book.</p>
      </div>

      {error && <div className="auth-status-banner" style={{ borderLeftColor: '#914c49', backgroundColor: '#f5e0dc', color: '#914c49', marginBottom: '20px' }} role="alert">{error}</div>}
      {message && <div className="ce-alert-success" style={{ marginBottom: '20px' }} role="status">{message}</div>}

      <div className="admin-grid-layout">
        <div className="admin-form-panel">
          <h2>Add a new package</h2>
          <p className="admin-form-sub">Create a new option for your customers.</p>
          <form className="admin-form-stack" onSubmit={create}>
            <label>
              Package name
              <input required minLength={2} maxLength={120} value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="e.g. Garden Celebration" />
            </label>
            <label>
              Description
              <textarea required rows={4} minLength={5} maxLength={4000} value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} placeholder="Describe the food and service..." />
            </label>
            <div className="admin-field-pair">
              <label>
                Price per guest (₱)
                <input required type="number" min="0.01" step="0.01" value={form.price_per_guest} onChange={e => setForm({ ...form, price_per_guest: e.target.value })} />
              </label>
              <label>
                Minimum guests
                <input required type="number" min="1" step="1" value={form.minimum_guests} onChange={e => setForm({ ...form, minimum_guests: e.target.value })} />
              </label>
            </div>
            <button className="ce-btn ce-btn-gold ce-btn-full" type="submit" disabled={saving}>
              {saving ? 'Saving...' : 'Add package ↗'}
            </button>
          </form>
        </div>

        <div className="admin-list-panel">
          <h2>Existing packages</h2>
          {loading && <div className="empty">Loading packages...</div>}
          {!loading && !packages.length && <div className="empty">No packages have been added.</div>}
          
          <div className="admin-package-grid">
            {packages.map((item, index) => (
              <article className="admin-package-card" key={item.package_id}>
                <div className="admin-package-img-wrapper">
                  <img src={packageImages[index % 4]} alt={item.name} />
                  <span className={`admin-package-badge ${item.is_active ? 'active' : 'hidden'}`}>
                    {item.is_active ? 'Available' : 'Hidden'}
                  </span>
                </div>
                <div className="admin-package-body">
                  <span className="ce-eyebrow" style={{ marginBottom: '5px' }}>#{item.package_id}</span>
                  <h3>{item.name}</h3>
                  <p>{item.description}</p>
                  <div className="admin-package-footer">
                    <div>
                      <strong>{peso(item.price_per_guest)}</strong>
                      <small>per guest · min. {item.minimum_guests} guests</small>
                    </div>
                    <button className="ce-btn ce-btn-outline" style={{ padding: '8px 16px', fontSize: '0.8rem' }} type="button" onClick={() => toggle(item)}>
                      {item.is_active ? 'Hide' : 'Show'}
                    </button>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
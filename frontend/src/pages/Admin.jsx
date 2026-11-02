import { useCallback, useEffect, useState } from 'react';
import { api, peso } from '../api';

const emptyForm = { name: '', description: '', price_per_guest: '', minimum_guests: '20' };

export default function Admin() {
  const [packages, setPackages] = useState([]);
  const [form, setForm] = useState(emptyForm);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  const load = useCallback(async () => { try { setPackages(await api('/admin/packages')); } catch (err) { setError(err.message); } finally { setLoading(false); } }, []);
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
    } catch (err) { setError(err.message); }
    finally { setSaving(false); }
  }

  async function toggle(item) {
    setError('');
    setMessage('');
    try {
      await api(`/admin/packages/${item.package_id}/visibility`, { method: 'PATCH', body: JSON.stringify({ is_active: !Boolean(item.is_active) }) });
      setMessage('Package visibility updated.');
      await load();
    } catch (err) { setError(err.message); }
  }

  return <section className="shell section"><div className="section-heading"><div><span className="eyebrow green">ADMINISTRATOR</span><h1>Catering packages</h1></div><p>Add new offerings and manage which packages customers can book.</p></div>
    {error && <div className="notice warning" role="alert">{error}</div>}
    {message && <div className="notice success" role="status">{message}</div>}
    <div className="admin-layout"><div className="form-card"><h2>Add a package</h2><p className="muted">Create a new option for your customers.</p><form className="form-stack" onSubmit={create}>
      <label>Package name<input required minLength={2} maxLength={120} value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="e.g. Garden Celebration" /></label>
      <label>Description<textarea required rows={4} minLength={5} maxLength={4000} value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} placeholder="Describe the food and service..." /></label>
      <div className="field-pair"><label>Price per guest (₱)<input required type="number" min="0.01" step="0.01" value={form.price_per_guest} onChange={e => setForm({ ...form, price_per_guest: e.target.value })} /></label><label>Minimum guests<input required type="number" min="1" step="1" value={form.minimum_guests} onChange={e => setForm({ ...form, minimum_guests: e.target.value })} /></label></div>
      <button className="button full" type="submit" disabled={saving}>{saving ? 'Saving...' : 'Add package ↗'}</button>
    </form></div><div className="admin-list"><h2>Existing packages</h2>{loading && <div className="empty">Loading packages...</div>}{!loading && !packages.length && <div className="empty">No packages have been added.</div>}
      {packages.map(item => <article className="admin-row" key={item.package_id}><div><span className="eyebrow green">#{item.package_id} · {item.is_active ? 'AVAILABLE' : 'HIDDEN'}</span><h3>{item.name}</h3><p>{item.description}</p><small>{peso(item.price_per_guest)}/guest · minimum {item.minimum_guests} guests</small></div><button className={`button small ${item.is_active ? 'outline' : ''}`} type="button" onClick={() => toggle(item)}>{item.is_active ? 'Hide' : 'Show'}</button></article>)}
    </div></div>
  </section>;
}

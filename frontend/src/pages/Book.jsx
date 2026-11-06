import { useEffect, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { api, peso } from '../api';

export default function Book() {
  const [params] = useSearchParams();
  const [packages, setPackages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ package_id: params.get('package') || '', event_date: '', event_time: '12:00', guest_count: '', venue: '', contact_number: '', special_requests: '' });
  const navigate = useNavigate();

  useEffect(() => {
    api('/packages').then(setPackages).catch(err => setError(err.message)).finally(() => setLoading(false));
  }, []);

  const selected = packages.find(p => String(p.package_id) === String(form.package_id));
  const estimated = selected && Number(form.guest_count) >= selected.minimum_guests ? Number(selected.price_per_guest) * Number(form.guest_count) : null;

  let isWeekend = false;
  if (form.event_date) {
    const day = new Date(form.event_date).getDay();
    isWeekend = day === 0 || day === 6;
  }

  async function submit(event) {
    event.preventDefault();
    setError('');
    setSaving(true);
    try {
      await api('/bookings', { method: 'POST', body: JSON.stringify(form) });
      navigate('/my-bookings?created=1');
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <section className="shell section narrow-section">
      <Link to="/" className="back-link">← Back to packages</Link>
      <div className="page-heading">
        <span className="ce-eyebrow">LET'S MAKE IT HAPPEN</span>
        <h1 className="admin-title">Book your <span className="ce-gold-italic">celebration.</span></h1>
        <p className="muted" style={{ marginTop: '10px' }}>Tell us about your event. We'll review your request before confirming.</p>
      </div>
      <div className="form-card book-card" style={{ marginTop: '30px' }}>
        {loading ? (
          <div className="empty">Loading packages...</div>
        ) : (
          <form className="form-stack" onSubmit={submit}>
            {error && <div className="auth-status-banner" style={{ borderLeftColor: '#914c49', backgroundColor: '#f5e0dc', color: '#914c49', marginBottom: '10px' }} role="alert">{error}</div>}
            <label>
              Catering package
              <select required value={form.package_id} onChange={e => setForm({ ...form, package_id: e.target.value, guest_count: '' })}>
                <option value="">Select a package</option>
                {packages.map(p => (
                  <option value={p.package_id} key={p.package_id}>{p.name} — {peso(p.price_per_guest)}/guest</option>
                ))}
              </select>
            </label>
            <div className="field-pair">
              <label>Event date<input required type="date" min={new Date().toLocaleDateString('en-CA')} value={form.event_date} onChange={e => setForm({ ...form, event_date: e.target.value })} /></label>
              <label>Event time<input required type="time" value={form.event_time} onChange={e => setForm({ ...form, event_time: e.target.value })} /></label>
            </div>
            <label>Number of guests<input required type="number" min={selected?.minimum_guests || 1} max={100000} value={form.guest_count} onChange={e => setForm({ ...form, guest_count: e.target.value })} placeholder={selected ? `At least ${selected.minimum_guests} guests` : 'Select a package first'} /></label>
            <label>Event venue<input required minLength={3} maxLength={255} value={form.venue} onChange={e => setForm({ ...form, venue: e.target.value })} placeholder="Venue / full location" /></label>
            <label>Contact number<input required minLength={7} maxLength={20} type="tel" value={form.contact_number} onChange={e => setForm({ ...form, contact_number: e.target.value })} placeholder="e.g. 09171234567" /></label>
            <label>Special requests <span className="optional">(optional)</span><textarea rows={4} maxLength={1000} value={form.special_requests} onChange={e => setForm({ ...form, special_requests: e.target.value })} placeholder="Allergies, setup preferences, or other details" /></label>
            
            <div className="estimate">
              <div>
                <span>Estimated package cost</span>
                <small>Based on package rate × guest count</small>
                {isWeekend && (
                  <small style={{ color: '#bd8353', fontWeight: 'bold', marginTop: '4px', display: 'block' }}>
                    ⚠️ Weekend surcharge (15%) will be applied.
                  </small>
                )}
              </div>
              <strong>{estimated === null ? '—' : peso(estimated)}</strong>
            </div>
            
            <button className="ce-btn ce-btn-gold ce-btn-full" type="submit" disabled={saving || !packages.length}>{saving ? 'Submitting...' : 'Submit booking request ↗'}</button>
            <p className="fine-print">Submitting a request does not confirm the date or process any payment.</p>
          </form>
        )}
      </div>
    </section>
  );
}
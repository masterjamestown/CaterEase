import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { api, peso, prettyStatus } from '../api';

export default function MyBookings() {
  const [bookings, setBookings] = useState([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [params] = useSearchParams();
  const [busy, setBusy] = useState(null);

  useEffect(() => { api('/bookings/mine').then(setBookings).catch(err => setError(err.message)).finally(() => setLoading(false)); }, []);
  async function cancelBooking(id) {
  if (!window.confirm('Are you sure you want to cancel this booking?')) return;
  setBusy(id);
  setError('');
  try {
    await api(`/bookings/${id}/cancel`, { method: 'PATCH' });
    const updated = await api('/bookings/mine');
    setBookings(updated);
  } catch (err) {
    setError(err.message);
  } finally {
    setBusy(null);
  }
  }

  return <section className="shell section"><div className="section-heading"><div><span className="eyebrow green">YOUR EVENTS IN ONE PLACE</span><h1>My bookings</h1></div><Link className="button" to="/#packages">Plan another event ↗</Link></div>
    {params.has('created') && <p className="notice success" role="status">Booking request submitted! Our team can now review it.</p>}
    {error && <p className="notice warning">{error}</p>}
    {loading && <div className="empty">Loading bookings...</div>}
    {!loading && !error && !bookings.length && <div className="empty">No bookings yet. <Link to="/">Explore catering packages</Link> to get started.</div>}
    <div className="booking-grid">{bookings.map(item => <article className="booking-card" key={item.booking_id}>
      <div className="booking-top"><div><span className="eyebrow green">BOOKING #{item.booking_id}</span><h3>{item.package_name}</h3></div><span className={`status status-${item.status}`}>{prettyStatus(item.status)}</span></div>
      <div className="booking-details"><div><small>Event date</small><strong>{item.event_date} · {item.event_time}</strong></div><div><small>Guests</small><strong>{item.guest_count}</strong></div><div><small>Venue</small><strong>{item.venue}</strong></div><div><small>Quoted total</small><strong>{peso(item.quoted_total)}</strong></div></div>
      {item.special_requests && <p className="requests"><strong>Requests:</strong> {item.special_requests}</p>}
      
      {(item.status === 'pending' || item.status === 'confirmed') && (
        <div className="status-control" style={{ display: 'flex', justifyContent: 'flex-end' }}>
          <button 
            className="button outline small" 
            onClick={() => cancelBooking(item.booking_id)}
            disabled={busy === item.booking_id}
            style={{ color: '#914c49', borderColor: '#f5e0dc' }}
          >
            {busy === item.booking_id ? 'Cancelling...' : 'Cancel booking'}
          </button>
        </div>
      )}
    </article>)}
    </div>
  </section>;
}

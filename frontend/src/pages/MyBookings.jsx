import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { api, peso, prettyStatus } from '../api';

export default function MyBookings() {
  const [bookings, setBookings] = useState([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [params] = useSearchParams();
  const [busy, setBusy] = useState(null);

  const loadBookings = () => {
    setLoading(true);
    api('/bookings/mine')
      .then(setBookings)
      .catch(err => setError(err.message))
      .finally(() => setLoading(false));
  };

  useEffect(() => { loadBookings(); }, []);

  async function cancelBooking(id) {
    if (!window.confirm('Are you sure you want to cancel this booking?')) return;
    setBusy(id);
    setError('');
    try {
      await api(`/bookings/${id}/cancel`, { method: 'PATCH' });
      await loadBookings();
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(null);
    }
  }

  async function payOnline(id) {
    if (!window.confirm('Simulate payment via GCash/Card?')) return;
    setBusy(id);
    setError('');
    try {
      await api(`/bookings/${id}/pay-online`, { method: 'POST' });
      await loadBookings();
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(null);
    }
  }

  return (
    <section className="shell section">
      <div className="my-bookings-header">
        <div>
          <span className="ce-eyebrow">YOUR EVENTS IN ONE PLACE</span>
          <h1 className="my-bookings-title">My <span className="ce-gold-italic">Bookings</span></h1>
        </div>
        <Link className="ce-btn ce-btn-outline" to="/#packages">Plan another event ↗</Link>
      </div>

      {params.has('created') && <div className="ce-alert-success" role="status">Booking request submitted! Our team can now review it.</div>}
      {error && <div className="auth-status-banner" style={{ borderLeftColor: '#914c49', backgroundColor: '#f5e0dc', color: '#914c49', marginBottom: '20px' }} role="alert">{error}</div>}
      
      {loading && <div className="empty">Loading bookings...</div>}
      {!loading && !error && !bookings.length && <div className="empty">No bookings yet. <Link to="/">Explore catering packages</Link> to get started.</div>}
      
      <div className="booking-grid">
        {bookings.map(item => (
          <article className="booking-card" key={item.booking_id}>
            <div className="booking-top">
              <div>
                <span className="ce-eyebrow">BOOKING #{item.booking_id}</span>
                <h3>{item.package_name}</h3>
              </div>
              <span className={`status status-${item.status}`}>{prettyStatus(item.status)}</span>
            </div>
            
            <div className="booking-details">
              <div><small>Event date</small><strong>{item.event_date} · {item.event_time}</strong></div>
              <div><small>Guests</small><strong>{item.guest_count}</strong></div>
              <div><small>Venue</small><strong>{item.venue}</strong></div>
              <div>
                <small>Quoted total</small>
                <strong>{peso(item.quoted_total)}</strong>
                {item.payment_status === 'paid' && (
                  <span className="status status-completed" style={{ marginTop: '5px', display: 'inline-block', fontSize: '0.6rem' }}>
                    PAID {item.payment_method ? `(${item.payment_method})` : ''}
                  </span>
                )}
                {item.payment_status === 'refunded' && <span className="status status-cancelled" style={{ marginTop: '5px', display: 'inline-block', fontSize: '0.6rem' }}>REFUNDED</span>}
              </div>
            </div>

            {item.special_requests && <p style={{ marginTop: '15px', fontSize: '0.85rem', color: '#52675b' }}><strong>Requests:</strong> {item.special_requests}</p>}
            
            {(item.status === 'pending' || item.status === 'confirmed') && (
              <div className="status-control" style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', paddingTop: '15px', marginTop: '15px', borderTop: '1px solid rgba(24,62,49,0.08)' }}>
                {item.payment_status !== 'paid' && (
                  <button 
                    className="ce-btn ce-btn-gold" 
                    onClick={() => payOnline(item.booking_id)}
                    disabled={busy === item.booking_id}
                    style={{ padding: '8px 16px', fontSize: '0.8rem' }}
                  >
                    {busy === item.booking_id ? 'Processing...' : 'Pay Online'}
                  </button>
                )}
                <button 
                  className="ce-btn ce-btn-outline" 
                  onClick={() => cancelBooking(item.booking_id)}
                  disabled={busy === item.booking_id}
                  style={{ color: '#914c49', borderColor: '#f5e0dc', padding: '8px 16px', fontSize: '0.8rem' }}
                >
                  {busy === item.booking_id ? 'Cancelling...' : 'Cancel booking'}
                </button>
              </div>
            )}
          </article>
        ))}
      </div>
    </section>
  );
}
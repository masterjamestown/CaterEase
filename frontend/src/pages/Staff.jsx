import './AdminOverview.css';
import { useCallback, useEffect, useState } from 'react';
import { api, peso, prettyStatus } from '../api';

const statuses = ['pending', 'confirmed', 'in_preparation', 'completed', 'cancelled'];

export default function Staff() {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [busy, setBusy] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');

  const load = useCallback(async () => {
    try {
      setBookings(await api('/staff/bookings'));
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  async function update(id, status) {
    setBusy(id);
    setError('');
    setMessage('');
    try {
      await api(`/staff/bookings/${id}/status`, { method: 'PATCH', body: JSON.stringify({ status }) });
      setMessage(`Booking #${id} updated.`);
      await load();
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(null);
    }
  }

  async function payBooking(id) {
    if (!window.confirm('Mark this booking as paid (Cash)?')) return;
    setBusy(id);
    setError('');
    setMessage('');
    try {
      await api(`/staff/bookings/${id}/pay`, { method: 'POST' });
      setMessage(`Cash payment recorded for booking #${id}.`);
      await load();
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(null);
    }
  }

  async function refundBooking(id) {
    if (!window.confirm('Are you sure you want to refund this payment?')) return;
    setBusy(id);
    setError('');
    setMessage('');
    try {
      await api(`/staff/bookings/${id}/refund`, { method: 'POST' });
      setMessage(`Payment refunded for booking #${id}.`);
      await load();
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(null);
    }
  }

  const filteredBookings = bookings.filter(item => {
    const query = searchQuery.toLowerCase();
    return (
      item.full_name.toLowerCase().includes(query) ||
      item.email.toLowerCase().includes(query) ||
      item.package_name.toLowerCase().includes(query) ||
      String(item.booking_id).includes(query)
    );
  });

  return (
    <section className="staff-page-wrapper">
      <div className="staff-header">
        <div>
          <span className="ce-eyebrow">OPERATIONS CENTER</span>
          <h1 className="staff-title">Manage <span className="ce-gold-italic">Bookings</span></h1>
        </div>
        <p className="staff-subtitle">Review customer event requests and update their status.</p>
      </div>

      {message && <div className="ce-alert-success" style={{ marginBottom: '20px' }}>{message}</div>}
      {error && <div className="auth-status-banner" style={{ borderLeftColor: '#914c49', backgroundColor: '#f5e0dc', color: '#914c49', marginBottom: '20px' }}>{error}</div>}

      <div className="staff-search-container">
        <div className="staff-search-wrapper">
          <span className="staff-search-icon">🔍</span>
          <input
            type="search"
            placeholder="Search by customer name, email, package, or ID..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="staff-search-input"
          />
        </div>
      </div>

      {loading && <div className="empty">Loading requests...</div>}
      {!loading && !error && !bookings.length && <div className="empty">No customer requests have arrived yet.</div>}
      {!loading && !error && bookings.length > 0 && filteredBookings.length === 0 && (
        <div className="empty">No bookings match your search.</div>
      )}

      <div className="staff-grid">
        {filteredBookings.map(item => (
          <article className="staff-booking-card" key={item.booking_id}>
            <div className="staff-card-header">
              <div>
                <span className="ce-eyebrow">BOOKING #{item.booking_id}</span>
                <h3 className="staff-package-name">{item.package_name}</h3>
              </div>
              <span className={`status status-${item.status}`}>{prettyStatus(item.status)}</span>
            </div>

            <div className="staff-card-details">
              <div className="staff-detail-group">
                <span className="staff-detail-label">Customer</span>
                <strong className="staff-detail-value">{item.full_name}</strong>
                <span className="staff-detail-sub">{item.email}</span>
              </div>
              <div className="staff-detail-group">
                <span className="staff-detail-label">Event Date</span>
                <strong className="staff-detail-value">{item.event_date} · {item.event_time}</strong>
              </div>
              <div className="staff-detail-group">
                <span className="staff-detail-label">Guests</span>
                <strong className="staff-detail-value">{item.guest_count}</strong>
              </div>
              <div className="staff-detail-group">
                <span className="staff-detail-label">Venue</span>
                <strong className="staff-detail-value">{item.venue}</strong>
              </div>
              <div className="staff-detail-group" style={{ gridColumn: '1 / -1' }}>
                <span className="staff-detail-label">Total Estimate</span>
                <strong className="staff-detail-value staff-price">{peso(item.quoted_total)}</strong>
              </div>
            </div>

            {item.special_requests && (
              <div className="staff-requests">
                <strong>Requests:</strong> {item.special_requests}
              </div>
            )}

            <div className="staff-card-actions">
              <div className="staff-status-control">
                <label>Change status</label>
                <select
                  value={item.status}
                  disabled={busy === item.booking_id}
                  onChange={event => update(item.booking_id, event.target.value)}
                  className="staff-select"
                >
                  {statuses.map(status => (
                    <option value={status} key={status}>{prettyStatus(status)}</option>
                  ))}
                </select>
              </div>

              <div className="staff-payment-control">
                <label>Payment</label>
                {item.payment_status === 'paid' ? (
                  <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                    <span className="status status-completed">
                      PAID {item.payment_method ? `(${item.payment_method})` : ''}
                    </span>
                    {item.status === 'cancelled' && (
                      <button className="ce-btn ce-btn-outline" style={{ padding: '6px 12px', fontSize: '0.75rem' }} onClick={() => refundBooking(item.booking_id)} disabled={busy === item.booking_id}>
                        Refund
                      </button>
                    )}
                  </div>
                ) : item.payment_status === 'refunded' ? (
                  <span className="status status-cancelled">REFUNDED</span>
                ) : item.status === 'cancelled' ? (
                  <span className="status status-pending" style={{ background: '#f3eee5', color: '#86715d' }}>UNPAID</span>
                ) : (
                  <button
                    className="ce-btn ce-btn-gold"
                    style={{ padding: '8px 16px', fontSize: '0.8rem' }}
                    onClick={() => payBooking(item.booking_id)}
                    disabled={busy === item.booking_id}
                  >
                    {busy === item.booking_id ? 'Saving...' : 'Mark as Paid'}
                  </button>
                )}
              </div>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
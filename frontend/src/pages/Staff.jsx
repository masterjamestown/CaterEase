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
    if (!window.confirm('Mark this booking as paid?')) return;
    setBusy(id);
    setError('');
    setMessage('');
    try {
      await api(`/staff/bookings/${id}/pay`, { method: 'POST' });
      setMessage(`Payment recorded for booking #${id}.`);
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
    <section className="ov-page">
      <div className="ov-head">
        <div>
          <span className="eyebrow green">OPERATIONS CENTER</span>
          <h1>Manage bookings</h1>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '20px', flexWrap: 'wrap' }}>
          <p>Review customer event requests and update their status.</p>
        </div>
      </div>

      {message && <p className="notice success" role="status">{message}</p>}
      {error && <p className="notice warning" role="alert">{error}</p>}

      {!loading && bookings.length > 0 && (
        <div className="staff-search">
          <input
            type="search"
            placeholder="Search by customer name, email, package, or ID..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
          />
        </div>
      )}

      {loading && <div className="empty">Loading requests...</div>}
      {!loading && !error && !bookings.length && <div className="empty">No customer requests have arrived yet.</div>}
      {!loading && !error && bookings.length > 0 && filteredBookings.length === 0 && (
        <div className="empty">No bookings match your search.</div>
      )}

      <div className="booking-grid">
        {filteredBookings.map(item => (
          <article className="booking-card" key={item.booking_id}>
            <div className="booking-top">
              <div>
                <span className="eyebrow green">BOOKING #{item.booking_id}</span>
                <h3>{item.package_name}</h3>
              </div>
              <span className={`status status-${item.status}`}>{prettyStatus(item.status)}</span>
            </div>

            <div className="booking-details">
              <div>
                <small>Customer</small>
                <strong>{item.full_name}</strong>
                <small>{item.email}</small>
              </div>
              <div>
                <small>Event</small>
                <strong>{item.event_date} · {item.event_time}</strong>
              </div>
              <div>
                <small>Guests</small>
                <strong>{item.guest_count}</strong>
              </div>
              <div>
                <small>Venue</small>
                <strong>{item.venue}</strong>
              </div>
              <div>
                <small>Total estimate</small>
                <strong>{peso(item.quoted_total)}</strong>
              </div>
            </div>

            {item.special_requests && <p className="requests"><strong>Requests:</strong> {item.special_requests}</p>}

            <div className="status-control">
              <label htmlFor={`status-${item.booking_id}`}>Change booking status</label>
              <select
                id={`status-${item.booking_id}`}
                value={item.status}
                disabled={busy === item.booking_id}
                onChange={event => update(item.booking_id, event.target.value)}
              >
                {statuses.map(status => (
                  <option value={status} key={status}>{prettyStatus(status)}</option>
                ))}
              </select>
            </div>

            <div className="status-control" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <label style={{ marginBottom: 0 }}>Payment status</label>
              {item.payment_status === 'paid' ? (
                <span className="status status-completed">PAID</span>
              ) : item.status === 'cancelled' ? (
                <span className="status status-pending" style={{ background: '#f3eee5', color: '#86715d' }}>UNPAID</span>
              ) : (
                <button
                  className="button small"
                  type="button"
                  onClick={() => payBooking(item.booking_id)}
                  disabled={busy === item.booking_id}
                >
                  {busy === item.booking_id ? 'Saving...' : 'Mark as Paid'}
                </button>
              )}
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
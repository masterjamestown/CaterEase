import { useEffect, useState } from 'react';
import { api, peso, prettyStatus } from '../api';
import './AdminOverview.css';

const MONTHS = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];
const STATUS_ORDER = ['pending', 'confirmed', 'in_preparation', 'completed', 'cancelled'];

function splitDate(value) {
  const parts = String(value || '').split('-');
  if (parts.length !== 3) return { day: '—', month: '' };
  return {
    day: String(Number(parts[2])),
    month: MONTHS[Number(parts[1]) - 1] || ''
  };
}

function orderStatuses(rows) {
  return [...rows].sort((a, b) => STATUS_ORDER.indexOf(a.status) - STATUS_ORDER.indexOf(b.status));
}

const STATS = [
  { key: 'total_bookings', label: 'Total bookings', icon: '✦', accent: 'accent-green', format: 'int', note: 'All booking requests' },
  { key: 'pending_bookings', label: 'Pending bookings', icon: '◷', accent: 'accent-gold', format: 'int', note: 'Awaiting review' },
  { key: 'upcoming_events', label: 'Upcoming events', icon: '✧', accent: 'accent-sage', format: 'int', note: 'Scheduled from today' },
  { key: 'confirmed_booking_value', label: 'Confirmed value', icon: '₱', accent: 'accent-clay', format: 'money', note: 'Confirmed + in prep + completed' },
  { key: 'active_packages', label: 'Active packages', icon: '◈', accent: 'accent-cream', format: 'int', note: 'Visible to customers' },
  { key: 'total_customers', label: 'Total customers', icon: '❖', accent: 'accent-lilac', format: 'int', note: 'Registered accounts' }
];

export default function AdminOverview() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const loadData = () => {
    setLoading(true);
    setError('');
    api('/admin/overview')
      .then(setData)
      .catch(err => setError(err.message))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadData();
  }, []);

  if (loading && !data) {
    return <section className="ov-page"><div className="ov-loading">Loading dashboard...</div></section>;
  }

  if (error) {
    return <section className="ov-page"><div className="ov-alert" role="alert">{error}</div></section>;
  }

  if (!data) return null;

  const summary = data.summary || {};
  const statuses = orderStatuses(data.statusBreakdown || []);
  const upcoming = data.upcomingEvents || [];
  const recent = data.recentBookings || [];
  const maxStatus = Math.max(1, ...statuses.map(row => Number(row.total) || 0));

  return (
    <section className="ov-page">
      <div className="ov-head">
        <div>
          <span className="eyebrow green">ADMINISTRATOR</span>
          <h1>Overview dashboard</h1>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '20px', flexWrap: 'wrap' }}>
          <p>A live snapshot of CaterEase bookings, packages, and customer activity.</p>
          <button onClick={loadData} className="button small" disabled={loading}>
            {loading ? 'Refreshing...' : 'Refresh Data'}
          </button>
        </div>
      </div>

      <div className="ov-stats">
        {STATS.map(stat => {
          const raw = summary[stat.key];
          const display = stat.format === 'money'
            ? peso(Number(raw) || 0)
            : (Number(raw) || 0).toLocaleString();
          return (
            <article className={`ov-stat ${stat.accent}`} key={stat.key}>
              <div className="ov-stat-top">
                <span className="ov-stat-icon" aria-hidden="true">{stat.icon}</span>
              </div>
              <p className="ov-stat-label">{stat.label}</p>
              <div className="ov-stat-value">{display}</div>
              <p className="ov-stat-note">{stat.note}</p>
            </article>
          );
        })}
      </div>

      <div className="ov-grid">
        <article className="ov-panel">
          <div className="ov-panel-head">
            <div>
              <h2>Status breakdown</h2>
              <p>Where your bookings stand right now.</p>
            </div>
          </div>
          {statuses.length ? (
            <div className="ov-status-list">
              {statuses.map(row => {
                const total = Number(row.total) || 0;
                const width = Math.round((total / maxStatus) * 100);
                return (
                  <div className="ov-status-row" key={row.status}>
                    <span className="ov-status-name">{prettyStatus(row.status)}</span>
                    <div className="ov-status-track">
                      <div className={`ov-status-fill ${row.status}`} style={{ width: `${width}%` }} />
                    </div>
                    <span className="ov-status-count">{total}</span>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="ov-empty">No bookings have been created yet.</div>
          )}
        </article>

        <article className="ov-panel">
          <div className="ov-panel-head">
            <div>
              <h2>Upcoming events</h2>
              <p>Pending and confirmed events from today onward.</p>
            </div>
          </div>
          {upcoming.length ? (
            <div className="ov-event-list">
              {upcoming.map(event => {
                const date = splitDate(event.event_date);
                return (
                  <div className="ov-event" key={event.booking_id}>
                    <div className="ov-event-date">
                      <strong>{date.day}</strong>
                      <small>{date.month}</small>
                    </div>
                    <div className="ov-event-body">
                      <h3>{event.package_name}</h3>
                      <p>{event.event_time} · {event.guest_count} guests · {event.venue}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="ov-empty">No upcoming events scheduled.</div>
          )}
        </article>
      </div>

      <article className="ov-panel ov-recent-panel">
        <div className="ov-panel-head">
          <div>
            <h2>Recent bookings</h2>
            <p>The five most recently created bookings.</p>
          </div>
        </div>
        {recent.length ? (
          <table className="ov-recent-table">
            <thead>
              <tr>
                <th>Customer</th>
                <th>Package</th>
                <th>Event</th>
                <th>Status</th>
                <th>Total</th>
              </tr>
            </thead>
            <tbody>
              {recent.map(booking => (
                <tr key={booking.booking_id}>
                  <td>
                    <div className="ov-cell-stack">
                      <strong>{booking.full_name}</strong>
                      <small>{booking.email}</small>
                    </div>
                  </td>
                  <td>{booking.package_name}</td>
                  <td>
                    <div className="ov-cell-stack">
                      <strong>{booking.event_date}</strong>
                      <small>{booking.event_time}</small>
                    </div>
                  </td>
                  <td><span className={`ov-pill ${booking.status}`}>{prettyStatus(booking.status)}</span></td>
                  <td><span className="ov-money">{peso(booking.quoted_total)}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <div className="ov-empty">No bookings to show yet.</div>
        )}
      </article>
    </section>
  );
}
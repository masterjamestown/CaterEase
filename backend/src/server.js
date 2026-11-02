require('dotenv').config();
const express = require('express');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const db = require('./db');
const { signToken, authenticate, requireRole } = require('./auth');

if (!process.env.JWT_SECRET || process.env.JWT_SECRET.length < 32 || process.env.JWT_SECRET.startsWith('replace_')) {
  throw new Error('Set a unique JWT_SECRET of at least 32 characters in backend/.env');
}

const app = express();
app.disable('x-powered-by');

const allowedOrigins = [
  'http://localhost:5173',
  'http://127.0.0.1:5173'
];

app.use(cors({
  origin: allowedOrigins
}));

app.use(express.json({ limit: '32kb' }));

function asyncRoute(fn) {
  return (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);
}

function publicUser(user) {
  return {
    user_id: user.user_id,
    full_name: user.full_name,
    email: user.email,
    role: user.role
  };
}

const allowedStatuses = ['pending', 'confirmed', 'in_preparation', 'completed', 'cancelled'];
const bookingQuery = `
  SELECT b.booking_id, b.event_date, TIME_FORMAT(b.event_time, '%H:%i') AS event_time,
    b.guest_count, b.venue, b.special_requests, b.quoted_total, b.status,
    b.created_at, p.name AS package_name, u.full_name, u.email,
    (SELECT status FROM payments WHERE booking_id = b.booking_id AND status = 'paid' LIMIT 1) AS payment_status
  FROM bookings b
  JOIN packages p ON p.package_id = b.package_id
  JOIN users u ON u.user_id = b.customer_id
`;

app.get('/api/health', asyncRoute(async (req, res) => {
  await db.query('SELECT 1');
  res.json({ status: 'ok', database: 'connected' });
}));

app.get('/api/packages', asyncRoute(async (req, res) => {
  const [packages] = await db.query(
    'SELECT package_id, name, description, price_per_guest, minimum_guests FROM packages WHERE is_active = 1 ORDER BY package_id'
  );
  res.json(packages);
}));

app.post('/api/auth/register', asyncRoute(async (req, res) => {
  const fullName = String(req.body.full_name || '').trim();
  const email = String(req.body.email || '').trim().toLowerCase();
  const password = req.body.password;

  if (fullName.length < 2 || fullName.length > 120 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || email.length > 255 || typeof password !== 'string' || password.length < 8 || Buffer.byteLength(password, 'utf8') > 72) {
    return res.status(400).json({ error: 'Enter a valid name, email, and password (8–72 bytes).' });
  }

  const hash = await bcrypt.hash(password, 12);
  try {
    const [result] = await db.execute(
      'INSERT INTO users (full_name, email, password_hash, role) VALUES (?, ?, ?, ?)',
      [fullName, email, hash, 'customer']
    );
    const user = { user_id: result.insertId, full_name: fullName, email, role: 'customer' };
    res.status(201).json({ token: signToken(user.user_id), user });
  } catch (error) {
    if (error.code === 'ER_DUP_ENTRY') {
      return res.status(409).json({ error: 'This email is already registered.' });
    }
    throw error;
  }
}));

app.post('/api/auth/login', asyncRoute(async (req, res) => {
  const email = String(req.body.email || '').trim().toLowerCase();
  const password = req.body.password;
  if (!email || typeof password !== 'string') {
    return res.status(400).json({ error: 'Enter your email and password.' });
  }
  const [rows] = await db.execute('SELECT * FROM users WHERE email = ?', [email]);
  if (!rows.length || !(await bcrypt.compare(password, rows[0].password_hash))) {
    return res.status(401).json({ error: 'Incorrect email or password.' });
  }
  res.json({ token: signToken(rows[0].user_id), user: publicUser(rows[0]) });
}));

app.get('/api/auth/me', authenticate, (req, res) => res.json(publicUser(req.user)));

app.post('/api/bookings', authenticate, requireRole('customer'), asyncRoute(async (req, res) => {
  const packageId = Number(req.body.package_id);
  const guestCount = Number(req.body.guest_count);
  const eventDate = String(req.body.event_date || '').trim();
  const eventTime = String(req.body.event_time || '').trim();
  const venue = String(req.body.venue || '').trim();
  const requests = String(req.body.special_requests || '').trim();

  if (!Number.isSafeInteger(packageId) || packageId < 1 || !Number.isSafeInteger(guestCount) || guestCount < 1 || guestCount > 100000 || !/^\d{4}-\d{2}-\d{2}$/.test(eventDate) || !/^([01]\d|2[0-3]):[0-5]\d$/.test(eventTime) || venue.length < 3 || venue.length > 255 || requests.length > 1000) {
    return res.status(400).json({ error: 'Please provide valid event details.' });
  }

  const [todayRows] = await db.query("SELECT DATE_FORMAT(CURDATE(), '%Y-%m-%d') AS today");
  if (eventDate < todayRows[0].today) {
    return res.status(400).json({ error: 'The event date cannot be in the past.' });
  }
  const [packages] = await db.execute('SELECT package_id, price_per_guest, minimum_guests FROM packages WHERE package_id = ? AND is_active = 1', [packageId]);
  if (!packages.length) return res.status(404).json({ error: 'This package is not available.' });
  const chosen = packages[0];
  if (guestCount < chosen.minimum_guests) {
    return res.status(400).json({ error: `This package needs at least ${chosen.minimum_guests} guests.` });
  }

  const [existingBookings] = await db.execute(
    'SELECT status FROM bookings WHERE customer_id = ? AND event_date = ?',
    [req.user.user_id, eventDate]
  );
  
  if (existingBookings.length > 0) {
    return res.status(400).json({ error: 'You already have a booking request on this date.' });
  }

  const [pendingCount] = await db.execute(
    'SELECT COUNT(*) AS total FROM bookings WHERE customer_id = ? AND status = ?',
    [req.user.user_id, 'pending']
  );

  if (pendingCount[0].total >= 3) {
    return res.status(400).json({ error: 'You have 3 pending bookings. Please wait for staff to review them before booking again.' });
  }

  const quotedTotal = (Number(chosen.price_per_guest) * guestCount).toFixed(2);
  const [result] = await db.execute(
    'INSERT INTO bookings (customer_id, package_id, event_date, event_time, guest_count, venue, special_requests, quoted_total) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
    [req.user.user_id, packageId, eventDate, `${eventTime}:00`, guestCount, venue, requests || null, quotedTotal]
  );
  res.status(201).json({ booking_id: result.insertId, status: 'pending' });
}));

app.get('/api/bookings/mine', authenticate, requireRole('customer'), asyncRoute(async (req, res) => {
  const [bookings] = await db.execute(`${bookingQuery} WHERE b.customer_id = ? ORDER BY b.created_at DESC`, [req.user.user_id]);
  res.json(bookings);
}));

app.patch('/api/bookings/:id/cancel', authenticate, requireRole('customer'), asyncRoute(async (req, res) => {
  const id = Number(req.params.id);
  if (!Number.isSafeInteger(id) || id < 1) {
    return res.status(400).json({ error: 'Invalid booking ID.' });
  }

  const [rows] = await db.execute('SELECT customer_id, status FROM bookings WHERE booking_id = ?', [id]);
  if (!rows.length) {
    return res.status(404).json({ error: 'Booking not found.' });
  }
  if (rows[0].customer_id !== req.user.user_id) {
    return res.status(403).json({ error: 'You can only cancel your own bookings.' });
  }
  if (!['pending', 'confirmed'].includes(rows[0].status)) {
    return res.status(400).json({ error: 'This booking can no longer be cancelled.' });
  }

  await db.execute('UPDATE bookings SET status = ? WHERE booking_id = ?', ['cancelled', id]);
  res.json({ message: 'Booking cancelled successfully.' });
}));

app.get('/api/staff/bookings', authenticate, requireRole('staff', 'admin'), asyncRoute(async (req, res) => {
  const [bookings] = await db.query(`${bookingQuery} ORDER BY CASE WHEN b.status = 'pending' THEN 0 ELSE 1 END, b.event_date ASC, b.booking_id DESC`);
  res.json(bookings);
}));

app.patch('/api/staff/bookings/:id/status', authenticate, requireRole('staff', 'admin'), asyncRoute(async (req, res) => {
  const id = Number(req.params.id);
  const status = req.body.status;
  if (!Number.isSafeInteger(id) || id < 1 || !allowedStatuses.includes(status)) {
    return res.status(400).json({ error: 'Invalid booking or status.' });
  }
  const [result] = await db.execute('UPDATE bookings SET status = ? WHERE booking_id = ?', [status, id]);
  if (!result.affectedRows) return res.status(404).json({ error: 'Booking not found.' });
  res.json({ message: 'Booking status updated.' });
}));

app.post('/api/staff/bookings/:id/pay', authenticate, requireRole('staff', 'admin'), asyncRoute(async (req, res) => {
  const id = Number(req.params.id);
  if (!Number.isSafeInteger(id) || id < 1) {
    return res.status(400).json({ error: 'Invalid booking ID.' });
  }

  const [bookings] = await db.execute('SELECT quoted_total, status FROM bookings WHERE booking_id = ?', [id]);
  if (!bookings.length) return res.status(404).json({ error: 'Booking not found.' });
  
  if (bookings[0].status === 'cancelled') {
    return res.status(400).json({ error: 'Cannot record payment for a cancelled booking.' });
  }

  const [existing] = await db.execute('SELECT payment_id FROM payments WHERE booking_id = ? AND status = ?', [id, 'paid']);
  if (existing.length > 0) {
    return res.status(400).json({ error: 'This booking has already been paid.' });
  }

  await db.execute(
    'INSERT INTO payments (booking_id, amount, payment_method, status, paid_at) VALUES (?, ?, ?, ?, NOW())',
    [id, bookings[0].quoted_total, 'Cash', 'paid']
  );

  res.json({ message: 'Payment recorded successfully.' });
}));

app.get('/api/admin/packages', authenticate, requireRole('admin'), asyncRoute(async (req, res) => {
  const [packages] = await db.query('SELECT package_id, name, description, price_per_guest, minimum_guests, is_active FROM packages ORDER BY package_id');
  res.json(packages);
}));

app.post('/api/admin/packages', authenticate, requireRole('admin'), asyncRoute(async (req, res) => {
  const name = String(req.body.name || '').trim();
  const description = String(req.body.description || '').trim();
  const price = Number(req.body.price_per_guest);
  const minGuests = Number(req.body.minimum_guests);
  if (name.length < 2 || name.length > 120 || description.length < 5 || description.length > 4000 || !Number.isFinite(price) || price <= 0 || price > 99999999 || !Number.isSafeInteger(minGuests) || minGuests < 1 || minGuests > 100000) {
    return res.status(400).json({ error: 'Please enter valid package details.' });
  }
  try {
    const [result] = await db.execute(
      'INSERT INTO packages (name, description, price_per_guest, minimum_guests) VALUES (?, ?, ?, ?)',
      [name, description, price.toFixed(2), minGuests]
    );
    res.status(201).json({ package_id: result.insertId, message: 'Package created.' });
  } catch (error) {
    if (error.code === 'ER_DUP_ENTRY') return res.status(409).json({ error: 'Package name already exists.' });
    throw error;
  }
}));

app.patch('/api/admin/packages/:id/visibility', authenticate, requireRole('admin'), asyncRoute(async (req, res) => {
  const id = Number(req.params.id);
  if (!Number.isSafeInteger(id) || id < 1 || typeof req.body.is_active !== 'boolean') {
    return res.status(400).json({ error: 'Invalid package update.' });
  }
  const [result] = await db.execute('UPDATE packages SET is_active = ? WHERE package_id = ?', [req.body.is_active ? 1 : 0, id]);
  if (!result.affectedRows) return res.status(404).json({ error: 'Package not found.' });
  res.json({ message: 'Package availability updated.' });
}));

app.get('/api/admin/overview', authenticate, requireRole('admin'), asyncRoute(async (req, res) => {
  const [[summaryRows], [statusBreakdown], [upcomingEvents], [recentBookings]] = await Promise.all([
    db.query(`
      SELECT
        COUNT(*) AS total_bookings,
        COALESCE(SUM(status = 'pending'), 0) AS pending_bookings,
        COALESCE(SUM(event_date >= CURDATE() AND status IN ('pending', 'confirmed', 'in_preparation')), 0) AS upcoming_events,
        COALESCE(SUM(CASE WHEN status IN ('confirmed', 'in_preparation', 'completed') THEN quoted_total ELSE 0 END), 0) AS confirmed_booking_value,
        (SELECT COUNT(*) FROM packages WHERE is_active = 1) AS active_packages,
        (SELECT COUNT(*) FROM users WHERE role = 'customer') AS total_customers
      FROM bookings
    `),
    db.query(`
      SELECT status, COUNT(*) AS total
      FROM bookings
      GROUP BY status
      ORDER BY FIELD(status, 'pending', 'confirmed', 'in_preparation', 'completed', 'cancelled')
    `),
    db.query(`
      ${bookingQuery}
      WHERE b.event_date >= CURDATE()
      AND b.status IN ('pending', 'confirmed', 'in_preparation')
      ORDER BY b.event_date ASC, b.event_time ASC
      LIMIT 5
    `),
    db.query(`
      ${bookingQuery}
      ORDER BY b.created_at DESC
      LIMIT 5
    `)
  ]);

  res.json({
    summary: summaryRows[0],
    statusBreakdown,
    upcomingEvents,
    recentBookings
  });
}));

app.use((req, res) => res.status(404).json({ error: 'API endpoint not found.' }));

app.use((error, req, res, next) => {
  console.error(error);
  if (error instanceof SyntaxError && error.status === 400 && 'body' in error) {
    return res.status(400).json({ error: 'Invalid JSON request.' });
  }
  res.status(500).json({ error: 'Server error. Check the backend terminal.' });
});

const port = Number(process.env.PORT || 4000);
app.listen(port, () => console.log(`CaterEase API running at http://localhost:${port}`));
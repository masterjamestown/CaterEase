const jwt = require('jsonwebtoken');
const db = require('./db');

function signToken(userId) {
  return jwt.sign({ user_id: userId }, process.env.JWT_SECRET, { expiresIn: '2h' });
}

async function authenticate(req, res, next) {
  const header = req.headers.authorization || '';
  const match = /^Bearer\s+(.+)$/i.exec(header);
  if (!match) return res.status(401).json({ error: 'Please log in first.' });

  try {
    const payload = jwt.verify(match[1], process.env.JWT_SECRET);
    const [rows] = await db.execute(
      'SELECT user_id, full_name, email, role FROM users WHERE user_id = ?',
      [payload.user_id]
    );
    if (!rows.length) return res.status(401).json({ error: 'Account no longer exists.' });
    req.user = rows[0];
    next();
  } catch (error) {
    if (error.name === 'TokenExpiredError' || error.name === 'JsonWebTokenError') {
      return res.status(401).json({ error: 'Session expired. Please log in again.' });
    }
    next(error);
  }
}

function requireRole(...allowed) {
  return (req, res, next) => {
    if (!req.user || !allowed.includes(req.user.role)) {
      return res.status(403).json({ error: 'You do not have permission to do that.' });
    }
    next();
  };
}

module.exports = { signToken, authenticate, requireRole };

const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'igs-jwt-secret-change-in-production';

function auth(req, res, next) {
  // Support Bearer header (API calls) OR ?token= query param (OAuth browser redirects)
  const header = req.headers.authorization;
  const rawToken = header?.startsWith('Bearer ')
    ? header.split(' ')[1]
    : (req.query.token || null);

  if (!rawToken) {
    return res.status(401).json({ error: 'Authentication required' });
  }
  try {
    req.user = jwt.verify(rawToken, JWT_SECRET);
    next();
  } catch {
    return res.status(401).json({ error: 'Invalid or expired token' });
  }
}

function optionalAuth(req, res, next) {
  const header = req.headers.authorization;
  if (header?.startsWith('Bearer ')) {
    try { req.user = jwt.verify(header.split(' ')[1], JWT_SECRET); } catch { req.user = null; }
  } else {
    req.user = null;
  }
  next();
}

module.exports = { auth, optionalAuth, JWT_SECRET };

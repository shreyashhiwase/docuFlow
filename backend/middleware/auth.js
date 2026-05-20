const { db } = require('../db');

function requireAuth(req, res, next) {
  const userId = req.headers['x-user-id'];
  if (!userId) {
    return res.status(401).json({ error: 'Authentication required' });
  }

  const user = db.prepare('SELECT id, email, name FROM users WHERE id = ?').get(userId);
  if (!user) {
    return res.status(401).json({ error: 'Invalid user' });
  }

  req.user = user;
  next();
}

module.exports = { requireAuth };

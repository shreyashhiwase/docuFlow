const express = require('express');
const router = express.Router();
const { db } = require('../db');

// Simple login (no JWT for scope - just validate user and return id)
router.post('/login', (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password required' });
  }

  const user = db.prepare('SELECT id, email, name FROM users WHERE email = ? AND password = ?')
    .get(email.toLowerCase().trim(), password);

  if (!user) {
    return res.status(401).json({ error: 'Invalid credentials' });
  }

  res.json({ user });
});

// List all users (for sharing dropdown)
router.get('/users', (req, res) => {
  const requesterId = req.headers['x-user-id'];
  const users = db.prepare('SELECT id, email, name FROM users WHERE id != ?').all(requesterId || '');
  res.json({ users });
});

module.exports = router;

const express = require('express');
const router = express.Router();
const { v4: uuidv4 } = require('uuid');
const { db } = require('../db');
const { requireAuth } = require('../middleware/auth');

// Get shares for a document
router.get('/:documentId', requireAuth, (req, res) => {
  const { documentId } = req.params;
  const doc = db.prepare('SELECT * FROM documents WHERE id = ?').get(documentId);

  if (!doc) return res.status(404).json({ error: 'Document not found' });
  if (doc.owner_id !== req.user.id) return res.status(403).json({ error: 'Only owner can view shares' });

  const shares = db.prepare(`
    SELECT ds.*, u.name, u.email
    FROM document_shares ds
    JOIN users u ON u.id = ds.shared_with_id
    WHERE ds.document_id = ?
  `).all(documentId);

  res.json({ shares });
});

// Share a document
router.post('/', requireAuth, (req, res) => {
  const { documentId, sharedWithEmail, permission = 'view' } = req.body;

  if (!documentId || !sharedWithEmail) {
    return res.status(400).json({ error: 'documentId and sharedWithEmail are required' });
  }

  if (!['view', 'edit'].includes(permission)) {
    return res.status(400).json({ error: 'Permission must be view or edit' });
  }

  const doc = db.prepare('SELECT * FROM documents WHERE id = ?').get(documentId);
  if (!doc) return res.status(404).json({ error: 'Document not found' });
  if (doc.owner_id !== req.user.id) return res.status(403).json({ error: 'Only owner can share' });

  const targetUser = db.prepare('SELECT * FROM users WHERE email = ?').get(sharedWithEmail.toLowerCase().trim());
  if (!targetUser) return res.status(404).json({ error: 'User not found with that email' });
  if (targetUser.id === req.user.id) return res.status(400).json({ error: 'Cannot share with yourself' });

  // Upsert share
  db.prepare(`
    INSERT INTO document_shares (id, document_id, shared_with_id, permission)
    VALUES (?, ?, ?, ?)
    ON CONFLICT(document_id, shared_with_id) DO UPDATE SET permission = excluded.permission
  `).run(uuidv4(), documentId, targetUser.id, permission);

  res.json({ success: true, sharedWith: { name: targetUser.name, email: targetUser.email, permission } });
});

// Update share permission
router.put('/:documentId/:userId', requireAuth, (req, res) => {
  const { documentId, userId } = req.params;
  const { permission } = req.body;

  const doc = db.prepare('SELECT * FROM documents WHERE id = ?').get(documentId);
  if (!doc || doc.owner_id !== req.user.id) return res.status(403).json({ error: 'Forbidden' });

  db.prepare('UPDATE document_shares SET permission = ? WHERE document_id = ? AND shared_with_id = ?')
    .run(permission, documentId, userId);

  res.json({ success: true });
});

// Remove share
router.delete('/:documentId/:userId', requireAuth, (req, res) => {
  const { documentId, userId } = req.params;

  const doc = db.prepare('SELECT * FROM documents WHERE id = ?').get(documentId);
  if (!doc || doc.owner_id !== req.user.id) return res.status(403).json({ error: 'Forbidden' });

  db.prepare('DELETE FROM document_shares WHERE document_id = ? AND shared_with_id = ?').run(documentId, userId);
  res.json({ success: true });
});

module.exports = router;

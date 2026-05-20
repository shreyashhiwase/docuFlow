const express = require('express');
const router = express.Router();
const { v4: uuidv4 } = require('uuid');
const { db } = require('../db');
const { requireAuth } = require('../middleware/auth');

// Get all documents for current user (owned + shared)
router.get('/', requireAuth, (req, res) => {
  const userId = req.user.id;

  const owned = db.prepare(`
    SELECT d.*, 'owner' as role, u.name as owner_name, u.email as owner_email
    FROM documents d
    JOIN users u ON u.id = d.owner_id
    WHERE d.owner_id = ?
    ORDER BY d.updated_at DESC
  `).all(userId);

  const shared = db.prepare(`
    SELECT d.*, ds.permission as role, u.name as owner_name, u.email as owner_email
    FROM documents d
    JOIN document_shares ds ON ds.document_id = d.id
    JOIN users u ON u.id = d.owner_id
    WHERE ds.shared_with_id = ?
    ORDER BY d.updated_at DESC
  `).all(userId);

  res.json({ owned, shared });
});

// Get single document
router.get('/:id', requireAuth, (req, res) => {
  const { id } = req.params;
  const userId = req.user.id;

  const doc = db.prepare(`
    SELECT d.*, u.name as owner_name, u.email as owner_email
    FROM documents d
    JOIN users u ON u.id = d.owner_id
    WHERE d.id = ?
  `).get(id);

  if (!doc) return res.status(404).json({ error: 'Document not found' });

  // Check access
  const isOwner = doc.owner_id === userId;
  const share = db.prepare('SELECT permission FROM document_shares WHERE document_id = ? AND shared_with_id = ?').get(id, userId);

  if (!isOwner && !share) {
    return res.status(403).json({ error: 'Access denied' });
  }

  const role = isOwner ? 'owner' : share.permission;
  res.json({ ...doc, role });
});

// Create document
router.post('/', requireAuth, (req, res) => {
  const { title = 'Untitled Document', content = '' } = req.body;
  const id = uuidv4();

  db.prepare(`
    INSERT INTO documents (id, title, content, owner_id)
    VALUES (?, ?, ?, ?)
  `).run(id, title, content, req.user.id);

  const doc = db.prepare('SELECT * FROM documents WHERE id = ?').get(id);
  res.status(201).json(doc);
});

// Update document
router.put('/:id', requireAuth, (req, res) => {
  const { id } = req.params;
  const userId = req.user.id;
  const { title, content } = req.body;

  const doc = db.prepare('SELECT * FROM documents WHERE id = ?').get(id);
  if (!doc) return res.status(404).json({ error: 'Document not found' });

  const isOwner = doc.owner_id === userId;
  const share = db.prepare('SELECT permission FROM document_shares WHERE document_id = ? AND shared_with_id = ?').get(id, userId);

  if (!isOwner && share?.permission !== 'edit') {
    return res.status(403).json({ error: 'Edit access required' });
  }

  const updates = [];
  const values = [];

  if (title !== undefined) { updates.push('title = ?'); values.push(title); }
  if (content !== undefined) { updates.push('content = ?'); values.push(content); }
  updates.push("updated_at = datetime('now')");
  values.push(id);

  db.prepare(`UPDATE documents SET ${updates.join(', ')} WHERE id = ?`).run(...values);

  const updated = db.prepare('SELECT * FROM documents WHERE id = ?').get(id);
  res.json(updated);
});

// Delete document (owner only)
router.delete('/:id', requireAuth, (req, res) => {
  const { id } = req.params;
  const doc = db.prepare('SELECT * FROM documents WHERE id = ?').get(id);

  if (!doc) return res.status(404).json({ error: 'Document not found' });
  if (doc.owner_id !== req.user.id) return res.status(403).json({ error: 'Only owner can delete' });

  db.prepare('DELETE FROM documents WHERE id = ?').run(id);
  res.json({ success: true });
});

module.exports = router;

import React, { useState, useEffect } from 'react';
import { api } from '../utils/api';

export default function ShareModal({ docId, onClose, showToast }) {
  const [shares, setShares] = useState([]);
  const [email, setEmail] = useState('');
  const [permission, setPermission] = useState('view');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [users, setUsers] = useState([]);

  useEffect(() => {
    load();
  }, []);

  async function load() {
    try {
      const [sharesData, usersData] = await Promise.all([
        api.getShares(docId),
        api.getUsers(),
      ]);
      setShares(sharesData.shares);
      setUsers(usersData.users);
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      setLoading(false);
    }
  }

  async function handleShare(e) {
    e.preventDefault();
    if (!email.trim()) return;
    setSaving(true);
    try {
      await api.shareDocument(docId, email, permission);
      showToast(`Shared successfully!`, 'success');
      setEmail('');
      await load();
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      setSaving(false);
    }
  }

  async function handleRemove(userId) {
    try {
      await api.removeShare(docId, userId);
      setShares(s => s.filter(x => x.shared_with_id !== userId));
      showToast('Access removed', 'success');
    } catch (err) {
      showToast(err.message, 'error');
    }
  }

  async function handlePermChange(userId, perm) {
    try {
      await api.updateShare(docId, userId, perm);
      setShares(s => s.map(x => x.shared_with_id === userId ? { ...x, permission: perm } : x));
    } catch (err) {
      showToast(err.message, 'error');
    }
  }

  return (
    <div className="modal-backdrop" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal">
        <div className="modal-header">
          <h2>Share Document</h2>
          <button className="btn btn-ghost btn-icon" onClick={onClose}>✕</button>
        </div>
        <div className="modal-body">
          <form onSubmit={handleShare}>
            <div style={{ display: 'flex', gap: 8, alignItems: 'flex-end' }}>
              <div style={{ flex: 1 }}>
                <label className="label">Email address</label>
                <input
                  className="input"
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="colleague@example.com"
                  list="user-emails"
                />
                <datalist id="user-emails">
                  {users.filter(u => !shares.some(s => s.shared_with_id === u.id)).map(u => (
                    <option key={u.id} value={u.email}>{u.name}</option>
                  ))}
                </datalist>
              </div>
              <div style={{ width: 120 }}>
                <label className="label">Permission</label>
                <select className="input" value={permission} onChange={e => setPermission(e.target.value)}>
                  <option value="view">View</option>
                  <option value="edit">Edit</option>
                </select>
              </div>
              <button className="btn btn-primary" type="submit" disabled={saving || !email.trim()}>
                {saving ? <span className="spinner" style={{ width: 14, height: 14, borderWidth: 2 }} /> : 'Share'}
              </button>
            </div>
          </form>

          {shares.length > 0 && (
            <>
              <div className="divider" />
              <p style={{ fontSize: 13, fontWeight: 600, color: 'var(--ink-muted)', marginBottom: 12, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Shared with</p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {loading ? <span className="spinner" /> : shares.map(s => (
                  <div key={s.shared_with_id} style={styles.shareRow}>
                    <div style={styles.shareAvatar}>{s.name[0]}</div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={styles.shareName}>{s.name}</div>
                      <div style={styles.shareEmail}>{s.email}</div>
                    </div>
                    <select
                      className="input"
                      style={{ width: 110, padding: '5px 8px', fontSize: 13 }}
                      value={s.permission}
                      onChange={e => handlePermChange(s.shared_with_id, e.target.value)}
                    >
                      <option value="view">View</option>
                      <option value="edit">Edit</option>
                    </select>
                    <button className="btn btn-ghost btn-icon btn-sm" onClick={() => handleRemove(s.shared_with_id)} title="Remove access">✕</button>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

const styles = {
  shareRow: { display: 'flex', alignItems: 'center', gap: 10, padding: '8px 12px', background: 'var(--paper)', borderRadius: 'var(--radius)', border: '1px solid var(--border)' },
  shareAvatar: { width: 32, height: 32, background: 'var(--accent-light)', color: 'var(--accent)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, fontWeight: 600, flexShrink: 0 },
  shareName: { fontSize: 14, fontWeight: 500, color: 'var(--ink)' },
  shareEmail: { fontSize: 12, color: 'var(--ink-muted)' },
};

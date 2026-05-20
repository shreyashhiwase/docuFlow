import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { useToast } from '../hooks/useToast';
import { api } from '../utils/api';
import Toast from '../components/Toast';

function timeAgo(dateStr) {
  const diff = (Date.now() - new Date(dateStr + 'Z')) / 1000;
  if (diff < 60) return 'just now';
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
}

function DocCard({ doc, onOpen, onDelete, isOwner }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const ref = useRef();

  useEffect(() => {
    function handleClick(e) {
      if (ref.current && !ref.current.contains(e.target)) setMenuOpen(false);
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  return (
    <div style={styles.docCard} onClick={() => onOpen(doc.id)}>
      <div style={styles.docPreview}>
        <div style={styles.docLines}>
          {[90, 75, 60, 45, 80, 55].map((w, i) => (
            <div key={i} style={{ ...styles.docLine, width: `${w}%`, opacity: i === 0 ? 0.5 : 0.2 + (i * 0.05) }} />
          ))}
        </div>
      </div>
      <div style={styles.docInfo}>
        <div style={styles.docMeta}>
          <span className={`badge badge-${doc.role}`}>
            {doc.role === 'owner' ? 'Owner' : doc.role === 'edit' ? 'Can edit' : 'View only'}
          </span>
          <div ref={ref} style={{ position: 'relative' }} onClick={e => e.stopPropagation()}>
            <button className="btn btn-ghost btn-icon btn-sm" onClick={() => setMenuOpen(o => !o)}>⋯</button>
            {menuOpen && (
              <div style={styles.menu}>
                <button style={styles.menuItem} onClick={() => { setMenuOpen(false); onOpen(doc.id); }}>
                  Open
                </button>
                {isOwner && (
                  <button style={{ ...styles.menuItem, color: 'var(--danger)' }} onClick={() => { setMenuOpen(false); onDelete(doc.id, doc.title); }}>
                    Delete
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
        <h3 style={styles.docTitle}>{doc.title || 'Untitled'}</h3>
        <div style={styles.docFooter}>
          <span style={styles.docOwner}>{isOwner ? 'You' : doc.owner_name}</span>
          <span style={styles.docTime}>{timeAgo(doc.updated_at)}</span>
        </div>
      </div>
    </div>
  );
}

export default function Dashboard() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const { toast, showToast } = useToast();
  const [owned, setOwned] = useState([]);
  const [shared, setShared] = useState([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef();

  useEffect(() => { loadDocs(); }, []);

  async function loadDocs() {
    try {
      const { owned, shared } = await api.getDocuments();
      setOwned(owned);
      setShared(shared);
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      setLoading(false);
    }
  }

  async function createDoc() {
    try {
      const doc = await api.createDocument('Untitled Document');
      navigate(`/doc/${doc.id}`);
    } catch (err) {
      showToast(err.message, 'error');
    }
  }

  async function deleteDoc(id, title) {
    if (!confirm(`Delete "${title}"? This cannot be undone.`)) return;
    try {
      await api.deleteDocument(id);
      setOwned(prev => prev.filter(d => d.id !== id));
      showToast('Document deleted', 'success');
    } catch (err) {
      showToast(err.message, 'error');
    }
  }

  async function handleFileUpload(e) {
    const file = e.target.files[0];
    if (!file) return;
    setUploading(true);
    try {
      const { document: doc, message } = await api.importFile(file);
      showToast(message, 'success');
      navigate(`/doc/${doc.id}`);
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      setUploading(false);
      e.target.value = '';
    }
  }

  return (
    <div style={styles.page}>
      {/* Sidebar */}
      <aside style={styles.sidebar}>
        <div style={styles.sidebarLogo}>
          <span style={styles.logoIcon}>✦</span>
          <span style={styles.logoText}>DocuFlow</span>
        </div>
        <div style={styles.sidebarActions}>
          <button className="btn btn-primary" style={{ width: '100%', justifyContent: 'center' }} onClick={createDoc}>
            + New Document
          </button>
          <button className="btn btn-secondary" style={{ width: '100%', justifyContent: 'center' }} onClick={() => fileRef.current.click()} disabled={uploading}>
            {uploading ? <><span className="spinner" style={{ width: 14, height: 14, borderWidth: 2 }} /> Importing…</> : '↑ Import File'}
          </button>
          <input ref={fileRef} type="file" accept=".txt,.md,.markdown,.docx,.pdf" style={{ display: 'none' }} onChange={handleFileUpload} />
          <p style={styles.uploadNote}>Supported: .txt, .md, .docx, .pdf</p>
        </div>
        <div style={styles.sidebarBottom}>
          <div style={styles.userChip}>
            <div style={styles.avatar}>{user?.name?.[0]}</div>
            <div style={{ minWidth: 0 }}>
              <div style={styles.userName}>{user?.name}</div>
              <div style={styles.userEmail}>{user?.email}</div>
            </div>
          </div>
          <button className="btn btn-ghost btn-sm" onClick={logout} style={{ marginTop: 8 }}>Sign out</button>
        </div>
      </aside>

      {/* Main */}
      <main style={styles.main}>
        <div style={styles.mainInner}>
          {loading ? (
            <div style={styles.centered}><span className="spinner" style={{ width: 32, height: 32, borderWidth: 3 }} /></div>
          ) : (
            <>
              {owned.length === 0 && shared.length === 0 ? (
                <div style={styles.empty}>
                  <div style={styles.emptyIcon}>✦</div>
                  <h2 style={styles.emptyTitle}>No documents yet</h2>
                  <p style={styles.emptySub}>Create a new document or import a file to get started.</p>
                  <button className="btn btn-primary" onClick={createDoc}>Create Document</button>
                </div>
              ) : (
                <>
                  {owned.length > 0 && (
                    <section style={styles.section}>
                      <h2 style={styles.sectionTitle}>My Documents</h2>
                      <div style={styles.grid}>
                        {owned.map(doc => (
                          <DocCard key={doc.id} doc={doc} isOwner={true}
                            onOpen={id => navigate(`/doc/${id}`)}
                            onDelete={deleteDoc} />
                        ))}
                      </div>
                    </section>
                  )}
                  {shared.length > 0 && (
                    <section style={styles.section}>
                      <h2 style={styles.sectionTitle}>Shared with me</h2>
                      <div style={styles.grid}>
                        {shared.map(doc => (
                          <DocCard key={doc.id} doc={doc} isOwner={false}
                            onOpen={id => navigate(`/doc/${id}`)}
                            onDelete={deleteDoc} />
                        ))}
                      </div>
                    </section>
                  )}
                </>
              )}
            </>
          )}
        </div>
      </main>
      <Toast toast={toast} />
    </div>
  );
}

const styles = {
  page: { display: 'flex', height: '100vh', overflow: 'hidden' },
  sidebar: {
    width: 240,
    flexShrink: 0,
    background: '#fff',
    borderRight: '1px solid var(--border)',
    display: 'flex',
    flexDirection: 'column',
    padding: '24px 16px',
  },
  sidebarLogo: { display: 'flex', alignItems: 'center', gap: 8, padding: '0 4px', marginBottom: 28 },
  logoIcon: { fontSize: 16, color: 'var(--accent)' },
  logoText: { fontSize: 18, fontWeight: 600, color: 'var(--ink)', letterSpacing: '-0.02em' },
  sidebarActions: { display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 16 },
  uploadNote: { fontSize: 11, color: 'var(--ink-muted)', textAlign: 'center', marginTop: -4 },
  sidebarBottom: { marginTop: 'auto' },
  userChip: { display: 'flex', alignItems: 'center', gap: 10, padding: '10px 8px', borderRadius: 'var(--radius)', background: 'var(--paper-2)' },
  avatar: { width: 32, height: 32, background: 'var(--accent)', color: '#fff', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, fontWeight: 600, flexShrink: 0 },
  userName: { fontSize: 13, fontWeight: 500, color: 'var(--ink)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' },
  userEmail: { fontSize: 11, color: 'var(--ink-muted)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' },
  main: { flex: 1, overflow: 'auto', background: 'var(--paper)' },
  mainInner: { padding: '40px 48px', maxWidth: 1100, margin: '0 auto' },
  section: { marginBottom: 48 },
  sectionTitle: { fontSize: 13, fontWeight: 600, color: 'var(--ink-muted)', letterSpacing: '0.05em', textTransform: 'uppercase', marginBottom: 16 },
  grid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 16 },
  docCard: { background: '#fff', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', overflow: 'hidden', cursor: 'pointer', transition: 'all 180ms ease' },
  docCard_hover: { boxShadow: 'var(--shadow)', transform: 'translateY(-2px)' },
  docPreview: { height: 120, background: 'linear-gradient(135deg, #f8f8ff 0%, #f0f0f8 100%)', padding: '16px 20px', borderBottom: '1px solid var(--border)' },
  docLines: { display: 'flex', flexDirection: 'column', gap: 8 },
  docLine: { height: 6, background: 'var(--ink)', borderRadius: 99 },
  docInfo: { padding: '12px 14px' },
  docMeta: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 },
  docTitle: { fontSize: 14, fontWeight: 500, color: 'var(--ink)', marginBottom: 8, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' },
  docFooter: { display: 'flex', alignItems: 'center', justifyContent: 'space-between' },
  docOwner: { fontSize: 12, color: 'var(--ink-muted)' },
  docTime: { fontSize: 12, color: 'var(--ink-muted)' },
  menu: { position: 'absolute', right: 0, top: '100%', background: '#fff', border: '1px solid var(--border)', borderRadius: 'var(--radius)', boxShadow: 'var(--shadow)', zIndex: 10, minWidth: 120, padding: 4 },
  menuItem: { display: 'block', width: '100%', padding: '8px 14px', background: 'none', border: 'none', cursor: 'pointer', fontSize: 14, textAlign: 'left', borderRadius: 6, color: 'var(--ink)' },
  centered: { display: 'flex', justifyContent: 'center', alignItems: 'center', height: 300 },
  empty: { textAlign: 'center', padding: '80px 20px' },
  emptyIcon: { fontSize: 40, color: 'var(--accent)', marginBottom: 16 },
  emptyTitle: { fontFamily: 'var(--font-display)', fontSize: 28, fontWeight: 400, marginBottom: 10 },
  emptySub: { fontSize: 15, color: 'var(--ink-muted)', marginBottom: 24 },
};

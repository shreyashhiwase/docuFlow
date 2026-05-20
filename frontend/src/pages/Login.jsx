import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { api } from '../utils/api';

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const { user } = await api.login(email, password);
      login(user);
      navigate('/');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  function quickLogin(userEmail) {
    setEmail(userEmail);
    setPassword('password123');
  }

  return (
    <div style={styles.page}>
      <div style={styles.left}>
        <div style={styles.leftInner}>
          <div style={styles.logo}>
            <span style={styles.logoIcon}>✦</span>
            <span style={styles.logoText}>DocuFlow</span>
          </div>
          <h1 style={styles.headline}>Write together.<br /><em>Think faster.</em></h1>
          <p style={styles.sub}>A lightweight collaborative document editor designed for teams that move quickly.</p>
          <div style={styles.features}>
            {['Rich-text editing', 'File import', 'Document sharing', 'Persistent storage'].map(f => (
              <div key={f} style={styles.featureItem}>
                <span style={styles.featureDot}>◆</span>
                <span>{f}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div style={styles.right}>
        <div style={styles.formCard}>
          <div style={styles.formHeader}>
            <h2 style={styles.formTitle}>Sign in</h2>
            <p style={styles.formSub}>Use a seeded account to explore</p>
          </div>

          {error && <div style={styles.error}>{error}</div>}

          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label className="label">Email</label>
              <input className="input" type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="email@example.com" required />
            </div>
            <div className="form-group">
              <label className="label">Password</label>
              <input className="input" type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="••••••••" required />
            </div>
            <button className="btn btn-primary" type="submit" disabled={loading} style={{ width: '100%', justifyContent: 'center', padding: '11px' }}>
              {loading ? <span className="spinner" /> : 'Sign In'}
            </button>
          </form>

          <div className="divider" style={{ margin: '20px 0' }} />

          <div>
            <p style={styles.seedLabel}>Quick login with seeded accounts:</p>
            <div style={styles.seedBtns}>
              {[
                { name: 'Alice Johnson', email: 'alice@docuflow.dev' },
                { name: 'Bob Smith', email: 'bob@docuflow.dev' },
                { name: 'Carol White', email: 'carol@docuflow.dev' },
              ].map(u => (
                <button key={u.email} className="btn btn-secondary btn-sm" onClick={() => quickLogin(u.email)} style={{ flex: 1 }}>
                  {u.name}
                </button>
              ))}
            </div>
            <p style={styles.seedNote}>Password for all accounts: <code style={styles.code}>password123</code></p>
          </div>
        </div>
      </div>
    </div>
  );
}

const styles = {
  page: { display: 'flex', minHeight: '100vh', background: 'var(--paper)' },
  left: {
    flex: '0 0 45%',
    background: 'var(--ink)',
    display: 'flex',
    alignItems: 'center',
    padding: '60px',
    position: 'relative',
    overflow: 'hidden',
  },
  leftInner: { position: 'relative', zIndex: 1 },
  logo: { display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '60px' },
  logoIcon: { fontSize: '20px', color: '#a5b4fc' },
  logoText: { fontSize: '20px', fontWeight: '600', color: '#fff', letterSpacing: '-0.02em' },
  headline: { fontFamily: 'var(--font-display)', fontSize: '52px', fontWeight: '400', color: '#fff', lineHeight: 1.15, marginBottom: '20px' },
  sub: { fontSize: '17px', color: 'rgba(255,255,255,0.6)', lineHeight: 1.6, marginBottom: '40px', maxWidth: '380px' },
  features: { display: 'flex', flexDirection: 'column', gap: '12px' },
  featureItem: { display: 'flex', alignItems: 'center', gap: '12px', color: 'rgba(255,255,255,0.75)', fontSize: '15px' },
  featureDot: { color: '#818cf8', fontSize: '9px' },
  right: { flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '40px' },
  formCard: { width: '100%', maxWidth: '400px' },
  formHeader: { marginBottom: '28px' },
  formTitle: { fontFamily: 'var(--font-display)', fontSize: '32px', fontWeight: '400', color: 'var(--ink)', marginBottom: '6px' },
  formSub: { fontSize: '14px', color: 'var(--ink-muted)' },
  error: { background: 'var(--danger-light)', color: 'var(--danger)', padding: '10px 14px', borderRadius: 'var(--radius)', fontSize: '14px', marginBottom: '16px' },
  seedLabel: { fontSize: '13px', color: 'var(--ink-muted)', marginBottom: '10px' },
  seedBtns: { display: 'flex', gap: '8px', marginBottom: '12px' },
  seedNote: { fontSize: '13px', color: 'var(--ink-muted)' },
  code: { background: 'var(--paper-2)', padding: '2px 6px', borderRadius: '4px', fontFamily: 'monospace', fontSize: '12px' },
};

import React, { useState, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { ShieldCheck, Lock, AlertCircle } from 'lucide-react';

export default function AdminLogin() {
  const [adminId, setAdminId] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const { login } = useContext(AuthContext);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: adminId, password })
      });
      const data = await res.json();

      if (!res.ok) throw new Error(data.message || 'Admin authentication failed');

      if (data.user.role !== 'admin') {
        throw new Error('Access denied: Master Admin credentials required');
      }

      login(data.token, data.user);
      navigate('/');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: '420px', margin: '4rem auto', padding: '0 1.5rem' }}>
      <div className="card" style={{ border: '1px solid rgba(167,139,250,0.4)', background: 'linear-gradient(135deg, rgba(26,29,53,0.95), rgba(13,15,26,0.95))' }}>
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '1rem' }}>
          <div style={{
            width: '54px', height: '54px', borderRadius: '16px',
            background: 'linear-gradient(135deg, var(--accent), var(--accent2))',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: '0 8px 24px rgba(108,99,255,0.4)'
          }}>
            <ShieldCheck size={28} style={{ color: '#fff' }} />
          </div>
        </div>

        <h2 style={{ fontSize: '1.5rem', fontWeight: 800, marginBottom: '0.4rem', textAlign: 'center' }}>
          Master Admin Portal
        </h2>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.88rem', textAlign: 'center', marginBottom: '1.8rem' }}>
          Restricted access for system administrator
        </p>

        {error && (
          <div style={{
            background: 'rgba(248,113,113,0.1)',
            border: '1px solid rgba(248,113,113,0.3)',
            borderRadius: '10px',
            padding: '0.75rem 1rem',
            color: 'var(--red)',
            fontSize: '0.85rem',
            display: 'flex',
            alignItems: 'center',
            gap: '0.6rem',
            marginBottom: '1.2rem'
          }}>
            <AlertCircle size={16} /> {error}
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.2rem' }}>
          <div>
            <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: 'var(--accent2)', marginBottom: '0.4rem' }}>
              Admin Identifier
            </label>
            <input
              type="text"
              className="input-field"
              placeholder="Admin Username or ID"
              value={adminId}
              onChange={(e) => setAdminId(e.target.value)}
              required
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: 'var(--accent2)', marginBottom: '0.4rem' }}>
              Password
            </label>
            <input
              type="password"
              className="input-field"
              placeholder=""
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          <button type="submit" className="btn-primary" disabled={loading} style={{ justifyContent: 'center', width: '100%', marginTop: '0.5rem' }}>
            <Lock size={18} /> {loading ? 'Authenticating Admin...' : 'Authenticate Master Admin'}
          </button>
        </form>
      </div>
    </div>
  );
}

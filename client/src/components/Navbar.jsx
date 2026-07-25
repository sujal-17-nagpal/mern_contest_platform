import React, { useContext } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { Zap, LogOut, User, Trophy, LayoutDashboard, PlusCircle, ShieldCheck } from 'lucide-react';

export default function Navbar() {
  const { user, logout } = useContext(AuthContext);
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <nav style={{
      background: 'rgba(13, 15, 26, 0.95)',
      backdropFilter: 'blur(16px)',
      borderBottom: '1px solid var(--border)',
      padding: '0 2rem',
      height: '64px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      position: 'sticky',
      top: 0,
      zIndex: 100
    }}>
      <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
        <Zap style={{ color: 'var(--accent)' }} size={24} />
        <span style={{
          fontSize: '1.2rem',
          fontWeight: 800,
          background: 'linear-gradient(135deg, var(--accent), var(--accent2))',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent'
        }}>
          ContestHub
        </span>
      </Link>

      <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
        {user ? (
          <>
            <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.9rem', color: 'var(--text-muted)' }}>
              <LayoutDashboard size={16} /> Contests
            </Link>

            {user.role === 'admin' && (
              <Link to="/admin/create-contest" style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.9rem', color: 'var(--accent2)', fontWeight: 600 }}>
                <PlusCircle size={16} /> Create Contest
              </Link>
            )}

            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.6rem',
              background: 'rgba(255,255,255,0.05)',
              padding: '0.35rem 0.85rem',
              borderRadius: '99px',
              border: '1px solid var(--border)',
              fontSize: '0.85rem'
            }}>
              {user.role === 'admin' ? (
                <>
                  <ShieldCheck size={14} style={{ color: 'var(--yellow)' }} />
                  <span style={{ fontWeight: 700, color: 'var(--yellow)' }}>Master Admin</span>
                </>
              ) : (
                <>
                  <User size={14} style={{ color: 'var(--accent2)' }} />
                  <span style={{ fontWeight: 600 }}>{user.name}</span>
                </>
              )}
            </div>

            <button onClick={handleLogout} className="btn-secondary" style={{ padding: '0.4rem 0.85rem', fontSize: '0.82rem' }}>
              <LogOut size={14} /> Logout
            </button>
          </>
        ) : (
          <>
            <Link to="/login" className="btn-secondary" style={{ padding: '0.45rem 1rem', fontSize: '0.85rem' }}>Log In</Link>
            <Link to="/register" className="btn-primary" style={{ padding: '0.45rem 1rem', fontSize: '0.85rem' }}>Sign Up</Link>
          </>
        )}
      </div>
    </nav>
  );
}

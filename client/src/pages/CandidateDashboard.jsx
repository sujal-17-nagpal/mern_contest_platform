import React, { useState, useEffect, useContext } from 'react';
import { Link } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { Trophy, Clock, Play, HelpCircle, Edit3, Trash2, FileText, CheckCircle2 } from 'lucide-react';

export default function CandidateDashboard() {
  const [contests, setContests] = useState([]);
  const [loading, setLoading] = useState(true);
  const { token, user } = useContext(AuthContext);

  const fetchContests = () => {
    fetch('/api/contests', {
      headers: { Authorization: `Bearer ${token}` }
    })
      .then(res => res.json())
      .then(data => setContests(Array.isArray(data) ? data : []))
      .catch(err => console.error(err))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchContests();
  }, [token]);

  const handleDeleteContest = async (contestId, contestTitle) => {
    if (!window.confirm(`Are you sure you want to delete "${contestTitle}"?`)) return;

    try {
      const res = await fetch(`/api/contests/${contestId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });
      if (!res.ok) throw new Error('Failed to delete contest');
      fetchContests();
    } catch (err) {
      alert(err.message);
    }
  };

  return (
    <div style={{ maxWidth: '1000px', margin: '0 auto', padding: '2.5rem 1.5rem' }}>
      
      {/* HERO BANNER */}
      <div style={{
        background: 'linear-gradient(135deg, rgba(108,99,255,0.15), rgba(167,139,250,0.08))',
        border: '1px solid rgba(108,99,255,0.35)',
        borderRadius: '20px',
        padding: '2rem 2.2rem',
        marginBottom: '2.5rem',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '1.5rem'
      }}>
        <div>
          <span className="badge badge-purple" style={{ marginBottom: '0.6rem', display: 'inline-block' }}>
            ⚡ Active Platform
          </span>
          <h1 style={{ fontSize: '1.8rem', fontWeight: 800, color: '#fff', marginBottom: '0.4rem' }}>
            Welcome back, {user?.name}! 👋
          </h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem' }}>
            Explore available contests, solve MCQs &amp; coding challenges, and view live leaderboards.
          </p>
        </div>

        {user?.role === 'admin' && (
          <Link to="/admin/create-contest" className="btn-primary">
            ➕ Create New Contest
          </Link>
        )}
      </div>

      {/* SECTION TITLE */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
        <h2 style={{ fontSize: '1.3rem', fontWeight: 700 }}>Available Contests ({contests.length})</h2>
      </div>

      {loading ? (
        <div style={{ color: 'var(--text-muted)', textAlign: 'center', padding: '3rem 0' }}>
          Loading contests...
        </div>
      ) : contests.length === 0 ? (
        <div className="card" style={{ textAlign: 'center', padding: '3rem 2rem' }}>
          <HelpCircle size={48} style={{ color: 'var(--text-muted)', marginBottom: '1rem' }} />
          <h3 style={{ fontSize: '1.2rem', marginBottom: '0.5rem' }}>No Contests Available Yet</h3>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: '1.5rem' }}>
            {user?.role === 'admin' ? 'Click below to create the first contest for your candidates!' : 'Check back soon for new contests.'}
          </p>
          {user?.role === 'admin' && (
            <Link to="/admin/create-contest" className="btn-primary">
              Create First Contest
            </Link>
          )}
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(310px, 1fr))', gap: '1.5rem' }}>
          {contests.map((c) => (
            <div key={c._id} className="card" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
                  <span className="badge badge-green">LIVE</span>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                    <Clock size={14} /> {c.durationMinutes} Mins
                  </div>
                </div>

                <h3 style={{ fontSize: '1.15rem', fontWeight: 700, marginBottom: '0.5rem' }}>
                  {c.title}
                </h3>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.88rem', marginBottom: '1.2rem' }}>
                  {c.description}
                </p>

                <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginBottom: '1.5rem' }}>
                  <span className="badge badge-purple">
                    📌 {c.questions?.length || 0} Questions
                  </span>
                  <span className="badge badge-blue">
                    🛡️ Auto-Saved
                  </span>
                </div>
              </div>

              <div>
                {/* ADMIN ACTION CONTROLS */}
                {user?.role === 'admin' && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginBottom: '0.75rem' }}>
                    <Link to={`/admin/review/${c._id}`} className="btn-secondary" style={{ justifyContent: 'center', fontSize: '0.82rem', padding: '0.45rem 0.6rem', color: 'var(--accent2)', borderColor: 'rgba(167,139,250,0.3)' }}>
                      <FileText size={14} /> Review &amp; Grade Submissions
                    </Link>
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                      <Link to={`/admin/edit-contest/${c._id}`} className="btn-secondary" style={{ flex: 1, justifyContent: 'center', fontSize: '0.8rem', padding: '0.4rem 0.6rem' }}>
                        <Edit3 size={14} /> Edit
                      </Link>
                      <button onClick={() => handleDeleteContest(c._id, c.title)} className="btn-secondary" style={{ color: 'var(--red)', borderColor: 'rgba(248,113,113,0.3)', padding: '0.4rem 0.6rem' }} title="Delete Contest">
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                )}

                <div style={{ display: 'flex', gap: '0.75rem', paddingTop: '0.8rem', borderTop: '1px solid var(--border)' }}>
                  <Link to={`/contest/${c._id}`} className="btn-primary" style={{ flex: 1, justifyContent: 'center' }}>
                    <Play size={16} /> Enter Contest
                  </Link>
                  <Link to={`/contest-result/${c._id}`} className="btn-secondary" style={{ padding: '0.65rem 0.85rem', color: 'var(--green)' }} title="View Scorecard & Review">
                    <CheckCircle2 size={16} />
                  </Link>
                  <Link to={`/leaderboard/${c._id}`} className="btn-secondary" style={{ padding: '0.65rem 0.85rem' }} title="Leaderboard">
                    <Trophy size={16} style={{ color: 'var(--yellow)' }} />
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

    </div>
  );
}

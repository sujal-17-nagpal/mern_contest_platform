import React, { useState, useEffect, useContext } from 'react';
import { useParams, Link } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { Trophy, Medal, Clock, ArrowLeft, ShieldCheck, AlertCircle } from 'lucide-react';

export default function Leaderboard() {
  const { id: contestId } = useParams();
  const [data, setData] = useState({ isPublished: false, leaderboard: [], message: '' });
  const [loading, setLoading] = useState(true);
  const { token, user } = useContext(AuthContext);

  useEffect(() => {
    fetch(`/api/submissions/leaderboard/${contestId}`, {
      headers: { Authorization: `Bearer ${token}` }
    })
      .then(res => res.json())
      .then(resData => setData(resData))
      .catch(err => console.error(err))
      .finally(() => setLoading(false));
  }, [contestId, token]);

  const formatTime = (totalSec) => {
    const m = Math.floor(totalSec / 60);
    const s = totalSec % 60;
    return `${m}m ${s}s`;
  };

  return (
    <div style={{ maxWidth: '900px', margin: '2.5rem auto', padding: '0 1.5rem' }}>
      
      <div style={{ marginBottom: '1.5rem' }}>
        <Link to="/" className="btn-secondary" style={{ padding: '0.4rem 0.85rem', fontSize: '0.82rem', display: 'inline-flex' }}>
          <ArrowLeft size={14} /> Back to Contests
        </Link>
      </div>

      <div className="card">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.8rem' }}>
            <Trophy size={28} style={{ color: 'var(--yellow)' }} />
            <div>
              <h1 style={{ fontSize: '1.5rem', fontWeight: 800 }}>Contest Leaderboard &amp; Results</h1>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.88rem' }}>
                Real-time rankings based on score and submission speed.
              </p>
            </div>
          </div>

          {user?.role === 'admin' && (
            <Link to={`/admin/review/${contestId}`} className="btn-primary" style={{ padding: '0.5rem 1rem', fontSize: '0.82rem' }}>
              <ShieldCheck size={16} /> Review Submissions &amp; Grade
            </Link>
          )}
        </div>

        {loading ? (
          <div style={{ color: 'var(--text-muted)', textAlign: 'center', padding: '3rem' }}>
            Loading results...
          </div>
        ) : !data.isPublished && user?.role !== 'admin' ? (
          <div style={{
            background: 'linear-gradient(135deg, rgba(251,191,36,0.1), rgba(167,139,250,0.05))',
            border: '1px solid rgba(251,191,36,0.3)',
            borderRadius: '16px',
            padding: '3rem 2rem',
            textAlign: 'center'
          }}>
            <AlertCircle size={48} style={{ color: 'var(--yellow)', marginBottom: '1rem' }} />
            <h2 style={{ fontSize: '1.3rem', fontWeight: 700, marginBottom: '0.6rem' }}>Submission Received! 📝</h2>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem', maxWidth: '500px', margin: '0 auto 1.5rem', lineHeight: '1.6' }}>
              Your test answers have been saved successfully. You will be able to see your final scorecard and the official leaderboard as soon as the instructor reviews and publishes the contest results.
            </p>
            <span className="badge badge-yellow">Status: Under Review</span>
          </div>
        ) : data.leaderboard?.length === 0 ? (
          <div style={{ color: 'var(--text-muted)', textAlign: 'center', padding: '3rem' }}>
            No submissions recorded yet for this contest.
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.9rem' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border)', color: 'var(--text-muted)', fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  <th style={{ padding: '0.8rem 1rem' }}>Rank</th>
                  <th style={{ padding: '0.8rem 1rem' }}>Candidate</th>
                  <th style={{ padding: '0.8rem 1rem' }}>Score</th>
                  <th style={{ padding: '0.8rem 1rem' }}>Time Taken</th>
                </tr>
              </thead>
              <tbody>
                {data.leaderboard.map((item) => (
                  <tr key={item.rank} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                    <td style={{ padding: '1rem' }}>
                      {item.rank === 1 ? <Medal style={{ color: '#ffd700' }} size={20} /> :
                       item.rank === 2 ? <Medal style={{ color: '#c0c0c0' }} size={20} /> :
                       item.rank === 3 ? <Medal style={{ color: '#cd7f32' }} size={20} /> :
                       <span style={{ fontWeight: 700, color: 'var(--text-muted)', paddingLeft: '0.3rem' }}>#{item.rank}</span>}
                    </td>
                    <td style={{ padding: '1rem', fontWeight: 600 }}>
                      {item.candidateName}
                      <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', fontWeight: 400 }}>{item.candidateEmail}</div>
                    </td>
                    <td style={{ padding: '1rem', fontWeight: 700, color: 'var(--accent2)' }}>
                      {item.score} / {item.maxScore}
                    </td>
                    <td style={{ padding: '1rem', color: 'var(--text-muted)', fontFamily: "'Fira Code', monospace" }}>
                      <Clock size={14} style={{ display: 'inline', marginRight: '0.4rem' }} />
                      {formatTime(item.timeTakenSeconds)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

    </div>
  );
}

import React, { useState, useEffect, useContext } from 'react';
import { useParams, Link } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { Trophy, CheckCircle, XCircle, Clock, ArrowLeft, Award, HelpCircle, FileText, AlertCircle } from 'lucide-react';

export default function CandidateReview() {
  const { id: contestId } = useParams();
  const { token } = useContext(AuthContext);

  const [resultData, setResultData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/submissions/result/${contestId}`, {
      headers: { Authorization: `Bearer ${token}` }
    })
      .then(res => res.json())
      .then(data => setResultData(data))
      .catch(err => console.error(err))
      .finally(() => setLoading(false));
  }, [contestId, token]);

  const formatTime = (totalSec) => {
    const m = Math.floor((totalSec || 0) / 60);
    const s = (totalSec || 0) % 60;
    return `${m}m ${s}s`;
  };

  if (loading) {
    return <div style={{ color: 'var(--text-muted)', textAlign: 'center', padding: '5rem' }}>Loading your contest evaluation...</div>;
  }

  if (!resultData) {
    return <div style={{ color: 'var(--text-muted)', textAlign: 'center', padding: '5rem' }}>No submission record found.</div>;
  }

  // Handle case where results are not published yet
  if (!resultData.isResultsPublished) {
    return (
      <div style={{ maxWidth: '750px', margin: '4rem auto', padding: '0 1.5rem' }}>
        <div className="card" style={{ textAlign: 'center', padding: '3.5rem 2rem' }}>
          <AlertCircle size={48} style={{ color: 'var(--yellow)', marginBottom: '1rem' }} />
          <h2 style={{ fontSize: '1.4rem', fontWeight: 800, marginBottom: '0.6rem' }}>Submission Received &amp; Under Review 📝</h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem', maxWidth: '500px', margin: '0 auto 1.8rem', lineHeight: '1.6' }}>
            {resultData.message}
          </p>
          <div style={{ display: 'flex', justifyContent: 'center', gap: '1rem' }}>
            <Link to="/" className="btn-secondary">
              <ArrowLeft size={16} /> Back to Dashboard
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const sub = resultData.submission;

  return (
    <div style={{ maxWidth: '950px', margin: '2.5rem auto', padding: '0 1.5rem' }}>
      
      <div style={{ marginBottom: '1.5rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <Link to="/" className="btn-secondary" style={{ padding: '0.4rem 0.85rem', fontSize: '0.82rem' }}>
          <ArrowLeft size={14} /> Back to Contests
        </Link>
        <Link to={`/leaderboard/${contestId}`} className="btn-secondary" style={{ padding: '0.4rem 0.85rem', fontSize: '0.82rem', color: 'var(--yellow)' }}>
          <Trophy size={14} /> View Live Leaderboard
        </Link>
      </div>

      {/* HERO SCORECARD HEADER */}
      <div className="card" style={{
        background: 'linear-gradient(135deg, rgba(108,99,255,0.15), rgba(34,211,160,0.08))',
        border: '1px solid rgba(108,99,255,0.35)',
        padding: '2rem',
        marginBottom: '2rem'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1.5rem' }}>
          <div>
            <span className="badge badge-green" style={{ marginBottom: '0.6rem', display: 'inline-block' }}>
              🏆 Results Published
            </span>
            <h1 style={{ fontSize: '1.6rem', fontWeight: 800, color: '#fff', marginBottom: '0.3rem' }}>
              {sub.contestId?.title || 'Contest Evaluation'}
            </h1>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.88rem' }}>
              Completed in {formatTime(sub.timeTakenSeconds)}
            </p>
          </div>

          <div style={{ background: 'rgba(10,12,24,0.6)', border: '1px solid var(--border)', padding: '1rem 1.5rem', borderRadius: '16px', textAlign: 'center' }}>
            <div style={{ fontSize: '1.8rem', fontWeight: 800, color: 'var(--accent2)' }}>
              {sub.totalScore} / {sub.maxPossibleScore}
            </div>
            <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', fontWeight: 600 }}>Total Marks Achieved</div>
          </div>
        </div>

        {/* INSTRUCTOR FEEDBACK NOTES */}
        {sub.instructorFeedback && (
          <div style={{ marginTop: '1.5rem', paddingTop: '1.2rem', borderTop: '1px solid rgba(255,255,255,0.1)' }}>
            <div style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--accent2)', textTransform: 'uppercase', marginBottom: '0.3rem' }}>
              💬 Instructor Feedback / Review Notes:
            </div>
            <p style={{ fontSize: '0.9rem', color: 'var(--text)', fontStyle: 'italic', lineHeight: '1.6' }}>
              "{sub.instructorFeedback}"
            </p>
          </div>
        )}
      </div>

      {/* QUESTION BY QUESTION DETAILED BREAKDOWN */}
      <h2 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '1.2rem' }}>
        Detailed Evaluation Breakdown ({sub.answers?.length || 0} Questions)
      </h2>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
        {sub.answers?.map((ans, idx) => {
          const q = ans.questionId || {};
          return (
            <div key={idx} className="card" style={{ background: 'rgba(10,12,24,0.6)' }}>
              
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.8rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                  <span className="badge badge-purple">Q{idx + 1}</span>
                  <span className={`badge ${q.type === 'mcq' ? 'badge-green' : q.type === 'bug_hunt' ? 'badge-yellow' : 'badge-blue'}`}>
                    {q.type ? q.type.toUpperCase() : 'QUESTION'}
                  </span>
                  <h3 style={{ fontSize: '1.05rem', fontWeight: 700 }}>{q.title}</h3>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                  <span style={{ fontWeight: 800, fontSize: '1rem', color: ans.scoreAwarded > 0 ? 'var(--green)' : 'var(--red)' }}>
                    +{ans.scoreAwarded} / {q.marks || 10} Marks
                  </span>
                  {ans.scoreAwarded > 0 ? (
                    <CheckCircle size={20} style={{ color: 'var(--green)' }} />
                  ) : (
                    <XCircle size={20} style={{ color: 'var(--red)' }} />
                  )}
                </div>
              </div>

              <p style={{ color: 'var(--text-muted)', fontSize: '0.92rem', marginBottom: '1.2rem', lineHeight: '1.6' }}>
                {q.description}
              </p>

              {/* EVALUATION 1: MCQ */}
              {ans.type === 'mcq' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem', background: 'rgba(255,255,255,0.02)', padding: '1rem', borderRadius: '10px', border: '1px solid var(--border)' }}>
                  <div style={{ fontSize: '0.85rem' }}>
                    Your Selected Option: <span style={{ fontWeight: 700, color: ans.isCorrect ? 'var(--green)' : 'var(--red)' }}>Option {ans.selectedOption || 'None'}</span>
                  </div>
                  <div style={{ fontSize: '0.85rem', color: 'var(--green)' }}>
                    Correct Option: <span style={{ fontWeight: 700 }}>Option {q.correctOption}</span>
                  </div>
                </div>
              )}

              {/* EVALUATION 2: BUG HUNT */}
              {ans.type === 'bug_hunt' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem' }}>
                  {q.codeSnippet && (
                    <div style={{ background: 'var(--code-bg)', border: '1px solid var(--border)', borderRadius: '8px', padding: '1rem', fontFamily: "'Fira Code', monospace", fontSize: '0.82rem', color: '#cdd6f4' }}>
                      <pre>{q.codeSnippet}</pre>
                    </div>
                  )}
                  <div style={{ background: 'rgba(255,255,255,0.02)', padding: '1rem', borderRadius: '10px', border: '1px solid var(--border)' }}>
                    <div style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--accent2)', marginBottom: '0.4rem' }}>Your Response / Fix Explanation:</div>
                    <div style={{ fontFamily: "'Fira Code', monospace", fontSize: '0.88rem', color: 'var(--text)', whiteSpace: 'pre-wrap' }}>
                      {ans.bugFix || 'No response provided'}
                    </div>
                  </div>
                </div>
              )}

              {/* EVALUATION 3: CODING PROBLEM */}
              {ans.type === 'coding' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem' }}>
                  <div style={{ fontSize: '0.85rem', color: ans.testCasesPassed === ans.totalTestCases ? 'var(--green)' : 'var(--yellow)', fontWeight: 600 }}>
                    Test Cases Evaluation: Passed {ans.testCasesPassed} / {ans.totalTestCases} Test Cases
                  </div>
                  <div style={{ background: 'var(--code-bg)', border: '1px solid var(--border)', borderRadius: '10px', padding: '1rem', fontFamily: "'Fira Code', monospace", fontSize: '0.84rem', color: '#cdd6f4' }}>
                    <pre>{ans.code || '// No code submitted'}</pre>
                  </div>
                </div>
              )}

            </div>
          );
        })}
      </div>

    </div>
  );
}

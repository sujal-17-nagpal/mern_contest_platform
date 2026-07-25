import React, { useState, useEffect, useContext } from 'react';
import { useParams, Link } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { CheckCircle, Clock, Save, Send, ArrowLeft, Eye, Award, User } from 'lucide-react';

export default function AdminReview() {
  const { id: contestId } = useParams();
  const { token } = useContext(AuthContext);

  const [submissions, setSubmissions] = useState([]);
  const [selectedSub, setSelectedSub] = useState(null);
  const [loading, setLoading] = useState(true);
  const [grading, setGrading] = useState(false);
  const [publishing, setPublishing] = useState(false);

  const fetchSubmissions = () => {
    fetch(`/api/submissions/admin/contest/${contestId}`, {
      headers: { Authorization: `Bearer ${token}` }
    })
      .then(res => res.json())
      .then(data => {
        setSubmissions(Array.isArray(data) ? data : []);
        if (data.length > 0 && !selectedSub) {
          setSelectedSub(data[0]);
        }
      })
      .catch(err => console.error(err))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchSubmissions();
  }, [contestId, token]);

  const handleScoreChange = (qIdx, newScore) => {
    if (!selectedSub) return;
    const copy = { ...selectedSub };
    copy.answers[qIdx].scoreAwarded = Number(newScore);
    
    // Recalculate total
    let tot = 0;
    copy.answers.forEach(a => tot += Number(a.scoreAwarded || 0));
    copy.totalScore = tot;

    setSelectedSub(copy);
  };

  const handleSaveGrade = async () => {
    if (!selectedSub) return;
    setGrading(true);

    try {
      const res = await fetch(`/api/submissions/admin/grade/${selectedSub._id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          answers: selectedSub.answers,
          instructorFeedback: selectedSub.instructorFeedback || ''
        })
      });
      const updated = await res.json();
      setSelectedSub(updated);
      alert('Grades saved successfully!');
      fetchSubmissions();
    } catch (err) {
      alert('Error saving grade: ' + err.message);
    } finally {
      setGrading(false);
    }
  };

  const handlePublishResults = async () => {
    if (!window.confirm('Are you sure you want to publish results for all candidates? Candidates will now see their final scorecards and leaderboard.')) return;
    setPublishing(true);

    try {
      const res = await fetch(`/api/submissions/admin/publish/${contestId}`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      alert(data.message);
      fetchSubmissions();
    } catch (err) {
      alert('Error publishing results: ' + err.message);
    } finally {
      setPublishing(false);
    }
  };

  if (loading) {
    return <div style={{ color: 'var(--text-muted)', textAlign: 'center', padding: '5rem' }}>Loading candidate submissions for review...</div>;
  }

  const isAnyPublished = submissions.some(s => s.isResultsPublished);

  return (
    <div style={{ maxWidth: '1100px', margin: '2rem auto', padding: '0 1.5rem' }}>
      
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
        <Link to="/" className="btn-secondary" style={{ padding: '0.4rem 0.85rem', fontSize: '0.82rem' }}>
          <ArrowLeft size={14} /> Back to Contests
        </Link>

        <button onClick={handlePublishResults} className="btn-primary" disabled={publishing || submissions.length === 0}>
          <Send size={16} /> {isAnyPublished ? '✅ Results Already Published (Re-Publish)' : '📢 Publish Results & Announce Leaderboard'}
        </button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '320px 1fr', gap: '1.5rem' }}>
        
        {/* CANDIDATE LIST SIDEBAR */}
        <div className="card" style={{ padding: '1.2rem' }}>
          <h2 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '1rem' }}>
            Submissions ({submissions.length})
          </h2>

          {submissions.length === 0 ? (
            <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>No candidate submissions yet.</p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
              {submissions.map((sub) => (
                <div
                  key={sub._id}
                  onClick={() => setSelectedSub(sub)}
                  style={{
                    padding: '0.85rem 1rem',
                    borderRadius: '12px',
                    border: selectedSub?._id === sub._id ? '1.5px solid var(--accent)' : '1px solid var(--border)',
                    background: selectedSub?._id === sub._id ? 'rgba(108,99,255,0.12)' : 'rgba(255,255,255,0.02)',
                    cursor: 'pointer'
                  }}
                >
                  <div style={{ fontWeight: 700, fontSize: '0.9rem', marginBottom: '0.2rem' }}>
                    {sub.candidateId?.name || 'Candidate'}
                  </div>
                  <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginBottom: '0.5rem' }}>
                    {sub.candidateId?.email}
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <span className={`badge ${sub.isResultsPublished ? 'badge-green' : 'badge-yellow'}`} style={{ fontSize: '0.65rem' }}>
                      {sub.isResultsPublished ? 'Published' : 'Under Review'}
                    </span>
                    <span style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--accent2)' }}>
                      {sub.totalScore} / {sub.maxPossibleScore} pts
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* SUBMISSION REVIEW WORKSPACE */}
        <div>
          {selectedSub ? (
            <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
              
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingBottom: '1rem', borderBottom: '1px solid var(--border)' }}>
                <div>
                  <h2 style={{ fontSize: '1.3rem', fontWeight: 800 }}>{selectedSub.candidateId?.name}</h2>
                  <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>{selectedSub.candidateId?.email}</p>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--accent2)' }}>
                    {selectedSub.totalScore} / {selectedSub.maxPossibleScore}
                  </div>
                  <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>Total Score</div>
                </div>
              </div>

              {/* QUESTIONS REVIEW LIST */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1.2rem' }}>
                {selectedSub.answers?.map((ans, idx) => {
                  const q = ans.questionId || {};
                  return (
                    <div key={idx} style={{ background: 'rgba(10,12,24,0.6)', border: '1px solid var(--border)', borderRadius: '12px', padding: '1.2rem' }}>
                      
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.6rem' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                          <span className="badge badge-purple">Q{idx + 1}</span>
                          <span className="badge badge-blue">{q.type ? q.type.toUpperCase() : 'QUESTION'}</span>
                          <span style={{ fontWeight: 700, fontSize: '0.95rem' }}>{q.title || 'Question'}</span>
                        </div>
                        
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                          <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Score:</label>
                          <input
                            type="number"
                            className="input-field"
                            style={{ width: '70px', padding: '0.3rem 0.5rem', textAlign: 'center', fontWeight: 700 }}
                            value={ans.scoreAwarded}
                            onChange={(e) => handleScoreChange(idx, e.target.value)}
                            max={q.marks || 10}
                            min={0}
                          />
                          <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>/ {q.marks || 10}</span>
                        </div>
                      </div>

                      <p style={{ color: 'var(--text-muted)', fontSize: '0.88rem', marginBottom: '1rem' }}>{q.description}</p>

                      {/* ANSWER DETAIL DISPLAY */}
                      {ans.type === 'mcq' && (
                        <div style={{ fontSize: '0.88rem', fontFamily: "'Fira Code', monospace" }}>
                          Selected Option: <span style={{ color: ans.isCorrect ? 'var(--green)' : 'var(--red)', fontWeight: 700 }}>{ans.selectedOption || 'None'}</span>
                          <span style={{ color: 'var(--text-muted)', marginLeft: '1rem' }}>(Correct Option: {q.correctOption})</span>
                        </div>
                      )}

                      {ans.type === 'bug_hunt' && (
                        <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid var(--border)', borderRadius: '8px', padding: '0.8rem' }}>
                          <div style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--accent2)', marginBottom: '0.4rem' }}>Candidate Written Fix &amp; Explanation:</div>
                          <div style={{ fontFamily: "'Fira Code', monospace", fontSize: '0.85rem', color: 'var(--text)', whiteSpace: 'pre-wrap' }}>
                            {ans.bugFix || 'No response provided'}
                          </div>
                        </div>
                      )}

                      {ans.type === 'coding' && (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
                          <div style={{ fontSize: '0.8rem', color: 'var(--green)', fontWeight: 600 }}>
                            Passed {ans.testCasesPassed} / {ans.totalTestCases} Test Cases
                          </div>
                          <div style={{ background: 'var(--code-bg)', border: '1px solid var(--border)', borderRadius: '8px', padding: '0.8rem', fontFamily: "'Fira Code', monospace", fontSize: '0.82rem', color: '#cdd6f4' }}>
                            <pre>{ans.code || '// No code submitted'}</pre>
                          </div>
                        </div>
                      )}

                    </div>
                  );
                })}
              </div>

              {/* FEEDBACK & SAVE */}
              <div>
                <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: 'var(--accent2)', marginBottom: '0.4rem' }}>
                  Instructor Review Notes / Feedback for Candidate (Optional):
                </label>
                <textarea
                  className="input-field"
                  rows={3}
                  placeholder="e.g. Great fix on Q2! Keep up the good work."
                  value={selectedSub.instructorFeedback || ''}
                  onChange={(e) => setSelectedSub({ ...selectedSub, instructorFeedback: e.target.value })}
                />
              </div>

              <button onClick={handleSaveGrade} className="btn-primary" disabled={grading} style={{ justifyContent: 'center' }}>
                <Save size={16} /> {grading ? 'Saving Grade...' : 'Save Candidate Grade'}
              </button>

            </div>
          ) : (
            <div className="card" style={{ textAlign: 'center', padding: '4rem' }}>
              Select a candidate from the sidebar to review their answers.
            </div>
          )}
        </div>

      </div>

    </div>
  );
}

import React, { useState, useEffect, useContext, useRef } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import Editor from '@monaco-editor/react';
import { Clock, Play, CheckCircle, AlertTriangle, Send, ShieldCheck, ChevronRight, ChevronLeft, Eye, Lock, RotateCcw, FileText, ArrowLeft } from 'lucide-react';

export default function TakeContest() {
  const { id: contestId } = useParams();
  const navigate = useNavigate();
  const { token, user } = useContext(AuthContext);

  const [contest, setContest] = useState(null);
  const [currentQIndex, setCurrentQIndex] = useState(0);
  const [answers, setAnswers] = useState({}); // { [qId]: { selectedOption, bugFix, code } }
  const [secondsLeft, setSecondsLeft] = useState(40 * 60);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [alreadySubmitted, setAlreadySubmitted] = useState(false);
  const [saveStatus, setSaveStatus] = useState('saved');

  // Code Judge state
  const [judging, setJudging] = useState(false);
  const [judgeResults, setJudgeResults] = useState(null);

  const localStorageKey = `contest_draft_${contestId}_${user?.id || 'guest'}`;
  const timerStartKey = `contest_start_${contestId}_${user?.id || 'guest'}`;

  // Initialize or fetch timer start time
  const getOrSetStartTime = (durationMinutes) => {
    let storedStart = localStorage.getItem(timerStartKey);
    if (!storedStart) {
      storedStart = Date.now().toString();
      localStorage.setItem(timerStartKey, storedStart);
    }
    const startTime = parseInt(storedStart, 10);
    const elapsedSeconds = Math.floor((Date.now() - startTime) / 1000);
    const totalDurationSeconds = durationMinutes * 60;
    return Math.max(0, totalDurationSeconds - elapsedSeconds);
  };

  useEffect(() => {
    fetch(`/api/contests/${contestId}`, {
      headers: { Authorization: `Bearer ${token}` }
    })
      .then(res => res.json())
      .then(contestData => {
        setContest(contestData);
        
        // Compute remaining time based on real clock
        const remaining = getOrSetStartTime(contestData.durationMinutes || 40);
        setSecondsLeft(remaining);

        // Load local draft answers
        const localSaved = localStorage.getItem(localStorageKey);
        if (localSaved) {
          try { setAnswers(JSON.parse(localSaved)); } catch (e) {}
        }

        // Fetch server draft or submission
        fetch(`/api/submissions/draft/${contestId}`, {
          headers: { Authorization: `Bearer ${token}` }
        })
          .then(res => res.json())
          .then(subData => {
            if (subData) {
              if (subData.status === 'submitted' || subData.status === 'under_review' || subData.status === 'published') {
                setAlreadySubmitted(true);
              } else if (subData.answers) {
                const map = {};
                subData.answers.forEach(a => {
                  map[a.questionId] = {
                    selectedOption: a.selectedOption || '',
                    bugFix: a.bugFix || '',
                    code: a.code || ''
                  };
                });
                setAnswers(prev => ({ ...map, ...prev }));
              }
            }
          });
      })
      .catch(err => console.error(err))
      .finally(() => setLoading(false));
  }, [contestId, token]);

  // Real-time ticking clock aligned with real timestamps
  useEffect(() => {
    if (loading || submitted || alreadySubmitted || !contest) return;

    const interval = setInterval(() => {
      const remaining = getOrSetStartTime(contest.durationMinutes || 40);
      setSecondsLeft(remaining);

      if (remaining <= 0) {
        clearInterval(interval);
        handleFinalSubmit(true);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [loading, submitted, alreadySubmitted, contest]);

  const updateAnswer = (qId, fields) => {
    setAnswers(prev => {
      const updated = {
        ...prev,
        [qId]: { ...(prev[qId] || {}), ...fields }
      };
      localStorage.setItem(localStorageKey, JSON.stringify(updated));
      triggerBackendAutoSave(updated);
      return updated;
    });
  };

  const autoSaveTimeoutRef = useRef(null);
  const triggerBackendAutoSave = (answersData) => {
    setSaveStatus('saving');
    if (autoSaveTimeoutRef.current) clearTimeout(autoSaveTimeoutRef.current);

    autoSaveTimeoutRef.current = setTimeout(() => {
      const formatted = Object.keys(answersData).map(qId => ({
        questionId: qId,
        selectedOption: answersData[qId].selectedOption || '',
        bugFix: answersData[qId].bugFix || '',
        code: answersData[qId].code || ''
      }));

      fetch('/api/submissions/draft', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          contestId,
          answers: formatted,
          timeTakenSeconds: Math.floor((contest.durationMinutes * 60) - secondsLeft)
        })
      })
        .then(res => res.json())
        .then(() => setSaveStatus('saved'))
        .catch(() => setSaveStatus('error'));
    }, 1500);
  };

  const handleRunCode = async (questionId, codeToRun) => {
    setJudging(true);
    setJudgeResults(null);

    try {
      const res = await fetch('/api/judge/run', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ questionId, code: codeToRun })
      });
      const data = await res.json();
      setJudgeResults(data);
    } catch (err) {
      setJudgeResults({ compileError: 'Network Error: Failed to execute code' });
    } finally {
      setJudging(false);
    }
  };

  const handleFinalSubmit = async (isAutoSubmit = false) => {
    if (!isAutoSubmit && !window.confirm('Are you sure you want to submit your contest? You can review your submission afterwards.')) return;

    setSubmitting(true);

    // Read freshest answers from localStorage to prevent stale timer closure issues
    let currentAnswers = answers;
    const localSaved = localStorage.getItem(localStorageKey);
    if (localSaved) {
      try {
        currentAnswers = JSON.parse(localSaved);
      } catch (e) {}
    }

    const formatted = (contest?.questions || []).map(q => {
      const qAns = currentAnswers[q._id] || {};
      return {
        questionId: q._id,
        selectedOption: qAns.selectedOption || '',
        bugFix: qAns.bugFix || '',
        code: qAns.submittedCode || qAns.code || ''
      };
    });

    try {
      const res = await fetch('/api/submissions/submit', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          contestId,
          answers: formatted,
          timeTakenSeconds: Math.floor((contest.durationMinutes * 60) - secondsLeft)
        })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Submission failed');
      
      localStorage.removeItem(localStorageKey);
      setSubmitted(true);
    } catch (err) {
      alert(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  // Handler for Attempting Contest Again
  const handleAttemptAgain = () => {
    if (window.confirm('Starting a new attempt will reset your current timer and draft answers. Do you want to continue?')) {
      localStorage.removeItem(timerStartKey);
      localStorage.removeItem(localStorageKey);
      setAnswers({});
      setAlreadySubmitted(false);
      setSubmitted(false);
      if (contest) {
        localStorage.setItem(timerStartKey, Date.now().toString());
        setSecondsLeft(contest.durationMinutes * 60);
      }
    }
  };

  if (loading) {
    return <div style={{ color: 'var(--text-muted)', textAlign: 'center', padding: '5rem' }}>Loading contest environment...</div>;
  }

  if (!contest) {
    return <div style={{ color: 'var(--text-muted)', textAlign: 'center', padding: '5rem' }}>Contest not found.</div>;
  }

  // ALREADY SUBMITTED MODAL SCREEN (Attempt Again vs Review)
  if (alreadySubmitted && !submitted) {
    return (
      <div style={{ maxWidth: '650px', margin: '4rem auto', padding: '0 1.5rem' }}>
        <div className="card" style={{ textAlign: 'center', padding: '3.5rem 2rem', border: '1px solid rgba(167,139,250,0.4)', background: 'linear-gradient(135deg, rgba(26,29,53,0.95), rgba(13,15,26,0.95))' }}>
          <ShieldCheck size={54} style={{ color: 'var(--accent2)', marginBottom: '1.2rem' }} />
          <h2 style={{ fontSize: '1.6rem', fontWeight: 800, marginBottom: '0.6rem' }}>
            Contest Already Submitted
          </h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.92rem', maxWidth: '480px', margin: '0 auto 2rem', lineHeight: '1.6' }}>
            You have already completed <strong style={{ color: '#fff' }}>"{contest.title}"</strong>. What would you like to do?
          </p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', maxWidth: '380px', margin: '0 auto' }}>
            <Link to={`/contest-result/${contestId}`} className="btn-primary" style={{ justifyContent: 'center', padding: '0.75rem 1.2rem', fontSize: '0.95rem' }}>
              <FileText size={18} /> Review Last Submission &amp; Scorecard
            </Link>

            <button onClick={handleAttemptAgain} className="btn-secondary" style={{ justifyContent: 'center', padding: '0.75rem 1.2rem', fontSize: '0.95rem', color: 'var(--yellow)', borderColor: 'rgba(251,191,36,0.4)' }}>
              <RotateCcw size={18} /> Attempt Contest Again
            </button>

            <Link to="/" style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginTop: '0.5rem', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '0.4rem' }}>
              <ArrowLeft size={14} /> Back to Contests Dashboard
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // SUBMITTED SUCCESS SCREEN
  if (submitted) {
    return (
      <div style={{ maxWidth: '600px', margin: '4rem auto', padding: '0 1.5rem', textAlign: 'center' }}>
        <div className="card" style={{ padding: '3.5rem 2rem' }}>
          <CheckCircle size={64} style={{ color: 'var(--green)', marginBottom: '1.2rem' }} />
          <h2 style={{ fontSize: '1.6rem', fontWeight: 800, marginBottom: '0.5rem' }}>Contest Submitted! 🎉</h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem', marginBottom: '2rem', lineHeight: '1.6' }}>
            Your responses have been saved and sent to the instructor for evaluation.
          </p>

          <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center' }}>
            <Link to={`/contest-result/${contestId}`} className="btn-primary">
              <FileText size={16} /> View Scorecard &amp; Results
            </Link>
            <Link to="/" className="btn-secondary">
              Back to Dashboard
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const formatTime = (secs) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const currentQ = contest.questions[currentQIndex] || {};
  const currentAns = answers[currentQ._id] || {};

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: 'calc(100vh - 64px)', background: 'var(--bg)' }}>
      
      {/* CONTEST HEADER BAR */}
      <div style={{
        background: 'rgba(13,15,26,0.95)',
        borderBottom: '1px solid var(--border)',
        padding: '0.75rem 1.5rem',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        position: 'sticky',
        top: '64px',
        zIndex: 90
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <h2 style={{ fontSize: '1.1rem', fontWeight: 700 }}>{contest.title}</h2>
          <span className="badge badge-purple">
            Q{currentQIndex + 1} OF {contest.questions.length}
          </span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
          {/* AUTO-SAVE STATUS */}
          <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            {saveStatus === 'saving' ? (
              <span style={{ color: 'var(--yellow)' }}>⏳ Saving draft...</span>
            ) : (
              <span style={{ color: 'var(--green)' }}>🛡️ Draft Saved</span>
            )}
          </div>

          {/* TIMER */}
          <div style={{
            background: secondsLeft < 300 ? 'rgba(248,113,113,0.15)' : 'rgba(255,255,255,0.05)',
            border: `1px solid ${secondsLeft < 300 ? 'var(--red)' : 'var(--border)'}`,
            padding: '0.4rem 0.9rem',
            borderRadius: '10px',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            fontWeight: 800,
            fontSize: '1rem',
            color: secondsLeft < 300 ? 'var(--red)' : 'var(--text)',
            fontFamily: "'Fira Code', monospace"
          }}>
            <Clock size={16} /> {formatTime(secondsLeft)}
          </div>

          <button onClick={() => handleFinalSubmit(false)} className="btn-primary" disabled={submitting} style={{ padding: '0.45rem 1rem', fontSize: '0.85rem' }}>
            <Send size={15} /> {submitting ? 'Submitting...' : 'Submit Contest'}
          </button>
        </div>
      </div>

      {/* CONTEST WORKSPACE BODY */}
      <div style={{ display: 'grid', gridTemplateColumns: '220px 1fr', flex: 1, height: 'calc(100vh - 128px)' }}>
        
        {/* QUESTIONS SIDEBAR NAVIGATION */}
        <div style={{ borderRight: '1px solid var(--border)', background: 'rgba(10,12,24,0.4)', padding: '1.2rem', overflowY: 'auto' }}>
          <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '0.8rem', letterSpacing: '0.05em' }}>
            Questions
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            {contest.questions.map((q, idx) => {
              const isAnswered = Boolean(answers[q._id]?.selectedOption || answers[q._id]?.bugFix || answers[q._id]?.code);
              const isActive = idx === currentQIndex;
              return (
                <button
                  key={q._id}
                  onClick={() => { setCurrentQIndex(idx); setJudgeResults(null); }}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justify: 'space-between',
                    padding: '0.75rem 0.9rem',
                    borderRadius: '10px',
                    border: isActive ? '1px solid var(--accent)' : '1px solid transparent',
                    background: isActive ? 'rgba(108,99,255,0.15)' : 'rgba(255,255,255,0.02)',
                    color: isActive ? '#fff' : 'var(--text-muted)',
                    cursor: 'pointer',
                    fontSize: '0.85rem',
                    fontWeight: isActive ? 700 : 500,
                    textAlign: 'left'
                  }}
                >
                  <span>Q{idx + 1}. {q.type.toUpperCase()}</span>
                  {isAnswered && <CheckCircle size={14} style={{ color: 'var(--green)' }} />}
                </button>
              );
            })}
          </div>
        </div>

        {/* QUESTION DETAILS & ANSWER EDITOR WORKSPACE */}
        <div style={{ padding: '1.5rem', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          
          {/* MCQ WORKSPACE */}
          {currentQ.type === 'mcq' && (
            <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span className="badge badge-purple">Q{currentQIndex + 1} • {currentQ.marks} MARKS</span>
                <span className="badge badge-blue">MCQ</span>
              </div>
              <h3 style={{ fontSize: '1.2rem', fontWeight: 700 }}>{currentQ.title}</h3>
              <p style={{ color: 'var(--text)', fontSize: '0.95rem', lineHeight: '1.6' }}>{currentQ.description}</p>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem', marginTop: '0.5rem' }}>
                {currentQ.options?.map((opt, oIdx) => {
                  const letter = String.fromCharCode(65 + oIdx);
                  const isSelected = currentAns.selectedOption === letter;
                  return (
                    <div
                      key={oIdx}
                      onClick={() => updateAnswer(currentQ._id, { selectedOption: letter })}
                      style={{
                        padding: '1rem 1.2rem',
                        borderRadius: '12px',
                        border: isSelected ? '1.5px solid var(--accent)' : '1px solid var(--border)',
                        background: isSelected ? 'rgba(108,99,255,0.12)' : 'rgba(255,255,255,0.02)',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.8rem',
                        fontSize: '0.92rem'
                      }}
                    >
                      <div style={{
                        width: '24px', height: '24px', borderRadius: '50%',
                        border: isSelected ? '2px solid var(--accent2)' : '1px solid var(--text-muted)',
                        background: isSelected ? 'var(--accent2)' : 'transparent',
                        color: isSelected ? '#fff' : 'var(--text-muted)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: '0.75rem', fontWeight: 800
                      }}>
                        {letter}
                      </div>
                      <span>{opt}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* BUG HUNT WORKSPACE */}
          {currentQ.type === 'bug_hunt' && (
            <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span className="badge badge-purple">Q{currentQIndex + 1} • {currentQ.marks} MARKS</span>
                <span className="badge badge-yellow">BUG HUNT</span>
              </div>
              <h3 style={{ fontSize: '1.2rem', fontWeight: 700 }}>{currentQ.title}</h3>
              <p style={{ color: 'var(--text)', fontSize: '0.95rem', lineHeight: '1.6' }}>{currentQ.description}</p>

              {currentQ.codeSnippet && (
                <div>
                  <div style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--accent2)', marginBottom: '0.4rem' }}>
                    Buggy Code Snippet:
                  </div>
                  <div style={{ background: 'var(--code-bg)', border: '1px solid var(--border)', borderRadius: '10px', padding: '1rem', fontFamily: "'Fira Code', monospace", fontSize: '0.85rem', color: '#cdd6f4' }}>
                    <pre>{currentQ.codeSnippet}</pre>
                  </div>
                </div>
              )}

              <div>
                <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '0.4rem' }}>
                  Your Solution / Fix Explanation:
                </label>
                <textarea
                  className="input-field"
                  rows={6}
                  placeholder=""
                  value={currentAns.bugFix || ''}
                  onChange={(e) => updateAnswer(currentQ._id, { bugFix: e.target.value })}
                  style={{ fontFamily: "'Fira Code', monospace", fontSize: '0.88rem' }}
                />
              </div>
            </div>
          )}

          {/* CODING PROBLEM WORKSPACE (LeetCode-Style Split View) */}
          {currentQ.type === 'coding' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.2rem' }}>
              
              {/* PROBLEM TITLE & DESCRIPTION CARD */}
              <div className="card" style={{ padding: '1.25rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.8rem' }}>
                  <span className="badge badge-purple">Q{currentQIndex + 1} • {currentQ.marks} MARKS</span>
                  <span className="badge badge-green">CODING PROBLEM</span>
                </div>
                <h3 style={{ fontSize: '1.25rem', fontWeight: 800, marginBottom: '0.6rem' }}>{currentQ.title}</h3>
                <p style={{ color: 'var(--text)', fontSize: '0.95rem', lineHeight: '1.6', whiteSpace: 'pre-wrap' }}>{currentQ.description}</p>
              </div>

              {/* PROBLEM CONSTRAINTS & SAMPLES BANNER */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1rem' }}>
                <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid var(--border)', borderRadius: '12px', padding: '0.85rem' }}>
                  <div style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--accent2)', textTransform: 'uppercase', marginBottom: '0.2rem' }}>📥 Input Format</div>
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', whiteSpace: 'pre-wrap' }}>{currentQ.inputFormat || 'Standard input'}</div>
                </div>
                <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid var(--border)', borderRadius: '12px', padding: '0.85rem' }}>
                  <div style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--accent2)', textTransform: 'uppercase', marginBottom: '0.2rem' }}>📤 Output Format</div>
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', whiteSpace: 'pre-wrap' }}>{currentQ.outputFormat || 'Standard output'}</div>
                </div>
                <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid var(--border)', borderRadius: '12px', padding: '0.85rem' }}>
                  <div style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--accent2)', textTransform: 'uppercase', marginBottom: '0.2rem' }}>📐 Constraints</div>
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontFamily: "'Fira Code', monospace", whiteSpace: 'pre-wrap' }}>{currentQ.constraints || 'Standard limits'}</div>
                </div>
              </div>

              {/* SAMPLE TEST CASES DISPLAY */}
              {currentQ.testCases && (
                <div>
                  <div style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--yellow)', textTransform: 'uppercase', marginBottom: '0.5rem' }}>
                    💡 Example Test Cases
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                    {currentQ.testCases.filter(tc => !tc.isHidden).map((tc, idx) => (
                      <div key={idx} style={{ background: 'rgba(10,12,24,0.6)', border: '1px solid var(--border)', borderRadius: '10px', padding: '0.85rem' }}>
                        <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--green)', marginBottom: '0.4rem' }}>Sample {idx + 1}</div>
                        <div style={{ fontSize: '0.8rem', fontFamily: "'Fira Code', monospace" }}>
                          <div style={{ color: 'var(--text-muted)', fontWeight: 600, fontSize: '0.72rem' }}>INPUT:</div>
                          <pre style={{ margin: '0.2rem 0 0.6rem', padding: '0.4rem 0.6rem', background: 'rgba(0,0,0,0.4)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: '6px', color: '#cdd6f4', fontSize: '0.8rem', whiteSpace: 'pre-wrap' }}>{tc.input}</pre>
                          
                          <div style={{ color: 'var(--text-muted)', fontWeight: 600, fontSize: '0.72rem' }}>EXPECTED OUTPUT:</div>
                          <pre style={{ margin: '0.2rem 0 0', padding: '0.4rem 0.6rem', background: 'rgba(0,0,0,0.4)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: '6px', color: 'var(--green)', fontSize: '0.8rem', whiteSpace: 'pre-wrap' }}>{tc.expectedOutput}</pre>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* MONACO CODE EDITOR */}
              <div style={{ border: '1px solid var(--border)', borderRadius: '14px', overflow: 'hidden', background: 'var(--code-bg)' }}>
                <div style={{ background: 'rgba(255,255,255,0.03)', padding: '0.6rem 1rem', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <span style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--accent2)', fontFamily: "'Fira Code', monospace" }}>
                    C++ (GCC 13.2)
                  </span>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Auto-Saves code locally</span>
                </div>

                <Editor
                  height="340px"
                  defaultLanguage="cpp"
                  theme="vs-dark"
                  value={currentAns.code !== undefined ? currentAns.code : currentQ.starterCode || ''}
                  onChange={(val) => updateAnswer(currentQ._id, { code: val })}
                  options={{
                    fontSize: 14,
                    minimap: { enabled: false },
                    scrollBeyondLastLine: false,
                    automaticLayout: true
                  }}
                />
              </div>

              {/* RUN & TEST CODE BUTTON */}
              <div>
                <button
                  type="button"
                  onClick={() => handleRunCode(currentQ._id, currentAns.code !== undefined ? currentAns.code : currentQ.starterCode || '')}
                  className="btn-secondary"
                  disabled={judging}
                  style={{ padding: '0.6rem 1.2rem', fontSize: '0.88rem' }}
                >
                  <Play size={16} /> {judging ? 'Running Test Cases...' : 'Run & Test Code'}
                </button>
              </div>

              {/* JUDGE EVALUATION RESULTS DISPLAY */}
              {judgeResults && (
                <div style={{ background: 'rgba(10,12,24,0.9)', border: '1px solid var(--border)', borderRadius: '12px', padding: '1.2rem', marginTop: '0.5rem' }}>
                  {judgeResults.compileError ? (
                    <div>
                      <div style={{ color: 'var(--yellow)', fontWeight: 700, fontSize: '0.9rem', marginBottom: '0.4rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                        <AlertTriangle size={16} /> Compile Error:
                      </div>
                      <pre style={{ background: 'rgba(0,0,0,0.5)', padding: '0.8rem', borderRadius: '8px', color: 'var(--red)', fontSize: '0.8rem', fontFamily: "'Fira Code', monospace", overflowX: 'auto' }}>
                        {judgeResults.compileError}
                      </pre>
                    </div>
                  ) : (
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.8rem' }}>
                        <span style={{ fontWeight: 800, fontSize: '0.95rem', color: judgeResults.passedCount === judgeResults.totalCount ? 'var(--green)' : 'var(--yellow)' }}>
                          Evaluation Result: Passed {judgeResults.passedCount} / {judgeResults.totalCount} Test Cases
                        </span>
                      </div>

                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: '0.8rem' }}>
                        {judgeResults.testResults?.map((res, idx) => (
                          <div key={idx} style={{
                            padding: '0.6rem 0.8rem',
                            borderRadius: '8px',
                            background: res.passed ? 'rgba(34,211,160,0.1)' : 'rgba(248,113,113,0.1)',
                            border: res.passed ? '1px solid var(--green)' : '1px solid var(--red)',
                            fontSize: '0.8rem'
                          }}>
                            <div style={{ fontWeight: 700, color: res.passed ? 'var(--green)' : 'var(--red)' }}>
                              {res.passed ? '✓ Passed' : '✗ Failed'}: {res.name}
                            </div>
                            {!res.isHidden && !res.passed && (
                              <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>
                                Got: {res.got} | Expected: {res.expected}
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

            </div>
          )}

          {/* BOTTOM QUESTION NAVIGATION */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 'auto', paddingTop: '1rem', borderTop: '1px solid var(--border)' }}>
            <button
              type="button"
              onClick={() => { setCurrentQIndex(prev => Math.max(0, prev - 1)); setJudgeResults(null); }}
              className="btn-secondary"
              disabled={currentQIndex === 0}
              style={{ padding: '0.45rem 1rem', fontSize: '0.85rem' }}
            >
              <ChevronLeft size={16} /> Previous Question
            </button>

            <button
              type="button"
              onClick={() => { setCurrentQIndex(prev => Math.min(contest.questions.length - 1, prev + 1)); setJudgeResults(null); }}
              className="btn-secondary"
              disabled={currentQIndex === contest.questions.length - 1}
              style={{ padding: '0.45rem 1rem', fontSize: '0.85rem' }}
            >
              Next Question <ChevronRight size={16} />
            </button>
          </div>

        </div>

      </div>

    </div>
  );
}

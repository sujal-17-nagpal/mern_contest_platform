import React, { useState, useEffect, useContext } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { Plus, Trash2, Save, Code, CheckSquare, Bug, Eye, EyeOff, Edit3 } from 'lucide-react';

export default function CreateContest() {
  const { id: editContestId } = useParams(); // If editContestId exists, we are in Edit Mode!
  const isEditMode = Boolean(editContestId);

  const navigate = useNavigate();
  const { token } = useContext(AuthContext);

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [durationMinutes, setDurationMinutes] = useState(40);
  const [questions, setQuestions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(isEditMode);

  // FETCH EXISTING CONTEST DATA IN EDIT MODE
  useEffect(() => {
    if (isEditMode) {
      fetch(`/api/contests/${editContestId}`, {
        headers: { Authorization: `Bearer ${token}` }
      })
        .then(res => res.json())
        .then(data => {
          setTitle(data.title || '');
          setDescription(data.description || '');
          setDurationMinutes(data.durationMinutes || 40);
          setQuestions(data.questions || []);
        })
        .catch(err => alert('Error loading contest data for edit'))
        .finally(() => setFetching(false));
    }
  }, [editContestId, isEditMode, token]);

  const addQuestion = (type) => {
    const base = {
      title: `Question ${questions.length + 1}`,
      description: '',
      type,
      marks: 10
    };
    if (type === 'mcq') {
      base.options = ['', '', '', ''];
      base.correctOption = 'A';
    } else if (type === 'bug_hunt') {
      base.codeSnippet = '';
      base.expectedBug = '';
      base.expectedFix = '';
    } else if (type === 'coding') {
      base.inputFormat = 'Line 1: Integer N\nLine 2: N space-separated integers';
      base.outputFormat = 'Single integer output';
      base.constraints = '1 <= N <= 10^5';
      base.starterCode = 'long long solve(vector<int>& arr) {\n    // Write your code here\n    \n}';
      base.driverCode = 'int main() {\n    ios_base::sync_with_stdio(false);\n    cin.tie(NULL);\n    int n;\n    if (!(cin >> n)) return 0;\n    vector<int> arr(n);\n    for(int i=0; i<n; i++) cin >> arr[i];\n    cout << solve(arr);\n    return 0;\n}';
      base.testCases = [
        { input: '5\n1 2 3 4 5', expectedOutput: '15', isHidden: false },
        { input: '3\n-1 -2 -3', expectedOutput: '-6', isHidden: false },
        { input: '6\n10 20 30 40 50 60', expectedOutput: '210', isHidden: true }
      ];
    }
    setQuestions([...questions, base]);
  };

  const updateQ = (idx, field, value) => {
    const copy = [...questions];
    copy[idx][field] = value;
    setQuestions(copy);
  };

  const addTestCase = (qIdx) => {
    const copy = [...questions];
    copy[qIdx].testCases.push({ input: '', expectedOutput: '', isHidden: false });
    setQuestions(copy);
  };

  const updateTestCase = (qIdx, tcIdx, field, value) => {
    const copy = [...questions];
    copy[qIdx].testCases[tcIdx][field] = value;
    setQuestions(copy);
  };

  const removeTestCase = (qIdx, tcIdx) => {
    const copy = [...questions];
    copy[qIdx].testCases = copy[qIdx].testCases.filter((_, i) => i !== tcIdx);
    setQuestions(copy);
  };

  const removeQ = (idx) => {
    setQuestions(questions.filter((_, i) => i !== idx));
  };

  const handleSaveContest = async (e) => {
    e.preventDefault();
    if (!title || questions.length === 0) {
      alert('Please provide a contest title and at least 1 question.');
      return;
    }

    setLoading(true);
    const url = isEditMode ? `/api/contests/${editContestId}` : '/api/contests';
    const method = isEditMode ? 'PUT' : 'POST';

    try {
      const res = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          title,
          description,
          durationMinutes,
          questions
        })
      });
      if (!res.ok) throw new Error('Failed to save contest');
      navigate('/');
    } catch (err) {
      alert('Error saving contest: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  if (fetching) {
    return <div style={{ color: 'var(--text-muted)', textAlign: 'center', padding: '5rem' }}>Loading contest details for editing...</div>;
  }

  return (
    <div style={{ maxWidth: '960px', margin: '2rem auto', padding: '0 1.5rem' }}>
      <div className="card">
        <h1 style={{ fontSize: '1.6rem', fontWeight: 800, marginBottom: '0.4rem' }}>
          {isEditMode ? '✏️ Edit Contest' : '➕ Create New Contest'}
        </h1>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: '2rem' }}>
          {isEditMode ? 'Update contest details, questions, and test cases.' : 'Configure contest details and add MCQs, Bug Hunts, or Coding Problems.'}
        </p>

        <form onSubmit={handleSaveContest} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          
          {/* CONTEST DETAILS */}
          <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '1rem' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '0.4rem' }}>
                Contest Title
              </label>
              <input
                className="input-field"
                placeholder="e.g. DSA Assessment — Test 5"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
              />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '0.4rem' }}>
                Duration (Minutes)
              </label>
              <input
                type="number"
                className="input-field"
                value={durationMinutes}
                onChange={(e) => setDurationMinutes(Number(e.target.value))}
                min={5}
                max={300}
                required
              />
            </div>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '0.4rem' }}>
              Description
            </label>
            <textarea
              className="input-field"
              rows={3}
              placeholder="Brief description of topics covered in this contest..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>

          {/* QUESTION BUILDER */}
          <div style={{ marginTop: '1rem', paddingTop: '1.5rem', borderTop: '1px solid var(--border)' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.2rem' }}>
              <h2 style={{ fontSize: '1.2rem', fontWeight: 700 }}>Questions ({questions.length})</h2>
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <button type="button" onClick={() => addQuestion('mcq')} className="btn-secondary" style={{ fontSize: '0.82rem', padding: '0.4rem 0.8rem' }}>
                  <CheckSquare size={14} /> + MCQ
                </button>
                <button type="button" onClick={() => addQuestion('bug_hunt')} className="btn-secondary" style={{ fontSize: '0.82rem', padding: '0.4rem 0.8rem' }}>
                  <Bug size={14} /> + Bug Hunt
                </button>
                <button type="button" onClick={() => addQuestion('coding')} className="btn-secondary" style={{ fontSize: '0.82rem', padding: '0.4rem 0.8rem' }}>
                  <Code size={14} /> + Coding Problem
                </button>
              </div>
            </div>

            {/* QUESTIONS LIST */}
            {questions.map((q, idx) => (
              <div key={idx} style={{ background: 'rgba(10,12,24,0.6)', border: '1px solid var(--border)', borderRadius: '14px', padding: '1.4rem', marginBottom: '1.5rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                    <span className="badge badge-purple">Q{idx + 1}</span>
                    <span className="badge badge-blue">{q.type.replace('_', ' ').toUpperCase()}</span>
                  </div>
                  <button type="button" onClick={() => removeQ(idx)} style={{ background: 'none', border: 'none', color: 'var(--red)', cursor: 'pointer' }}>
                    <Trash2 size={16} />
                  </button>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  <div style={{ display: 'grid', gridTemplateColumns: '3fr 1fr', gap: '0.8rem' }}>
                    <input
                      className="input-field"
                      placeholder="Question Title (e.g. Array Sum)"
                      value={q.title}
                      onChange={(e) => updateQ(idx, 'title', e.target.value)}
                      required
                    />
                    <input
                      type="number"
                      className="input-field"
                      placeholder="Marks"
                      value={q.marks}
                      onChange={(e) => updateQ(idx, 'marks', Number(e.target.value))}
                    />
                  </div>

                  <textarea
                    className="input-field"
                    rows={3}
                    placeholder="Problem Description (Explain what the function should calculate)"
                    value={q.description}
                    onChange={(e) => updateQ(idx, 'description', e.target.value)}
                    required
                  />

                  {/* MCQ BUILDER */}
                  {q.type === 'mcq' && (
                    <div style={{ background: 'rgba(255,255,255,0.02)', padding: '1rem', borderRadius: '10px', border: '1px solid var(--border)' }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.6rem' }}>
                        <label style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-muted)' }}>
                          Options (Select the radio button for the Correct Answer):
                        </label>
                        <span className="badge badge-green">
                          Correct: Option {q.correctOption || 'A'}
                        </span>
                      </div>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.8rem' }}>
                        {q.options.map((opt, oIdx) => {
                          const letter = String.fromCharCode(65 + oIdx);
                          const isCorrect = (q.correctOption || 'A') === letter;
                          return (
                            <div key={oIdx} style={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: '0.7rem',
                              background: isCorrect ? 'rgba(34,211,160,0.08)' : 'rgba(10,12,24,0.4)',
                              border: isCorrect ? '1.5px solid var(--green)' : '1px solid var(--border)',
                              padding: '0.4rem 0.8rem',
                              borderRadius: '10px'
                            }}>
                              <input
                                type="radio"
                                name={`correct_option_${idx}`}
                                checked={isCorrect}
                                onChange={() => updateQ(idx, 'correctOption', letter)}
                                style={{ accentColor: 'var(--green)', cursor: 'pointer', width: '18px', height: '18px' }}
                              />
                              <span style={{ fontWeight: 700, color: isCorrect ? 'var(--green)' : 'var(--text-muted)', fontSize: '0.85rem' }}>
                                {letter}:
                              </span>
                              <input
                                className="input-field"
                                style={{ flex: 1, padding: '0.4rem 0.7rem', fontSize: '0.88rem' }}
                                placeholder={`Option ${letter}`}
                                value={opt}
                                onChange={(e) => {
                                  const opts = [...q.options];
                                  opts[oIdx] = e.target.value;
                                  updateQ(idx, 'options', opts);
                                }}
                              />
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* BUG HUNT BUILDER */}
                  {q.type === 'bug_hunt' && (
                    <div>
                      <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: 'var(--accent2)', marginBottom: '0.4rem' }}>
                        Buggy Code Snippet
                      </label>
                      <textarea
                        className="input-field"
                        rows={4}
                        placeholder="Paste Buggy Code Snippet..."
                        value={q.codeSnippet}
                        onChange={(e) => updateQ(idx, 'codeSnippet', e.target.value)}
                        style={{ fontFamily: "'Fira Code', monospace" }}
                      />
                    </div>
                  )}

                  {/* CODING PROBLEM BUILDER */}
                  {q.type === 'coding' && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', background: 'rgba(255,255,255,0.02)', padding: '1rem', borderRadius: '10px', border: '1px solid rgba(255,255,255,0.05)' }}>
                      
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '0.8rem' }}>
                        <div>
                          <label style={{ fontSize: '0.78rem', color: 'var(--text-muted)', fontWeight: 600 }}>Input Format</label>
                          <textarea className="input-field" rows={2} value={q.inputFormat || ''} onChange={(e) => updateQ(idx, 'inputFormat', e.target.value)} />
                        </div>
                        <div>
                          <label style={{ fontSize: '0.78rem', color: 'var(--text-muted)', fontWeight: 600 }}>Output Format</label>
                          <textarea className="input-field" rows={2} value={q.outputFormat || ''} onChange={(e) => updateQ(idx, 'outputFormat', e.target.value)} />
                        </div>
                        <div>
                          <label style={{ fontSize: '0.78rem', color: 'var(--text-muted)', fontWeight: 600 }}>Constraints</label>
                          <textarea className="input-field" rows={2} value={q.constraints || ''} onChange={(e) => updateQ(idx, 'constraints', e.target.value)} />
                        </div>
                      </div>

                      <div>
                        <label style={{ fontSize: '0.82rem', color: 'var(--accent2)', fontWeight: 600, display: 'block', marginBottom: '0.4rem' }}>
                          Function Signature &amp; Starter Code (Candidate Sees This)
                        </label>
                        <textarea
                          className="input-field"
                          rows={4}
                          value={q.starterCode || ''}
                          onChange={(e) => updateQ(idx, 'starterCode', e.target.value)}
                          style={{ fontFamily: "'Fira Code', monospace" }}
                        />
                      </div>

                      <div>
                        <label style={{ fontSize: '0.82rem', color: 'var(--text-muted)', fontWeight: 600, display: 'block', marginBottom: '0.4rem' }}>
                          Driver Main Function (Appended during judging)
                        </label>
                        <textarea
                          className="input-field"
                          rows={6}
                          value={q.driverCode || ''}
                          onChange={(e) => updateQ(idx, 'driverCode', e.target.value)}
                          style={{ fontFamily: "'Fira Code', monospace" }}
                        />
                      </div>

                      {/* TEST CASES SECTION */}
                      <div style={{ marginTop: '0.5rem' }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.6rem' }}>
                          <label style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--text)' }}>
                            Test Cases ({q.testCases ? q.testCases.length : 0})
                          </label>
                          <button type="button" onClick={() => addTestCase(idx)} className="btn-secondary" style={{ fontSize: '0.78rem', padding: '0.3rem 0.6rem' }}>
                            + Add Test Case
                          </button>
                        </div>

                        {q.testCases && q.testCases.map((tc, tcIdx) => (
                          <div key={tcIdx} style={{ background: 'rgba(0,0,0,0.3)', border: '1px solid var(--border)', borderRadius: '8px', padding: '0.8rem', marginBottom: '0.6rem' }}>
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.4rem' }}>
                              <span style={{ fontSize: '0.78rem', fontWeight: 600, color: tc.isHidden ? 'var(--yellow)' : 'var(--green)' }}>
                                {tc.isHidden ? '🔒 Hidden Test Case' : '👁️ Sample Test Case'}
                              </span>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '0.8rem' }}>
                                <label style={{ fontSize: '0.78rem', color: 'var(--text-muted)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                                  <input
                                    type="checkbox"
                                    checked={tc.isHidden}
                                    onChange={(e) => updateTestCase(idx, tcIdx, 'isHidden', e.target.checked)}
                                  /> Hidden Test Case?
                                </label>
                                <button type="button" onClick={() => removeTestCase(idx, tcIdx)} style={{ background: 'none', border: 'none', color: 'var(--red)', cursor: 'pointer' }}>
                                  <Trash2 size={14} />
                                </button>
                              </div>
                            </div>

                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.6rem' }}>
                              <div>
                                <label style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Input</label>
                                <textarea className="input-field" rows={2} value={tc.input} onChange={(e) => updateTestCase(idx, tcIdx, 'input', e.target.value)} style={{ fontFamily: "'Fira Code', monospace" }} />
                              </div>
                              <div>
                                <label style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Expected Output</label>
                                <textarea className="input-field" rows={2} value={tc.expectedOutput} onChange={(e) => updateTestCase(idx, tcIdx, 'expectedOutput', e.target.value)} style={{ fontFamily: "'Fira Code', monospace" }} />
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>

                    </div>
                  )}

                </div>
              </div>
            ))}
          </div>

          <button type="submit" className="btn-primary" disabled={loading} style={{ justifyContent: 'center', marginTop: '1rem' }}>
            <Save size={18} /> {loading ? 'Saving Contest...' : isEditMode ? 'Update Contest' : 'Publish Contest'}
          </button>
        </form>
      </div>
    </div>
  );
}

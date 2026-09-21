import React, { useState, useEffect } from 'react';
import { Layers, Play, CheckCircle2, XCircle, AlertCircle, Plus, Sparkles, ChevronRight, X, FileText, Check, ShieldCheck, Activity } from 'lucide-react';
import { api } from '../services/api';

export function TestManagementPage() {
  const [suites, setSuites] = useState([]);
  const [runs, setRuns] = useState([]);
  const [loading, setLoading] = useState(true);

  // Modals & Active Drawer State
  const [isNewSuiteOpen, setIsNewSuiteOpen] = useState(false);
  const [isExecuteRunOpen, setIsExecuteRunOpen] = useState(false);
  const [isNewCaseOpen, setIsNewCaseOpen] = useState(false);
  const [selectedSuite, setSelectedSuite] = useState(null);
  const [suiteTestCases, setSuiteTestCases] = useState([]);
  const [loadingCases, setLoadingCases] = useState(false);

  // Form States
  const [newSuiteName, setNewSuiteName] = useState('');
  const [newSuiteDesc, setNewSuiteDesc] = useState('');

  const [runName, setRunName] = useState('Sprint 24 Automated Regression');
  const [runEnv, setRunEnv] = useState('Staging');
  const [runSuiteId, setRunSuiteId] = useState('');
  const [executing, setExecuting] = useState(false);

  const [caseTitle, setCaseTitle] = useState('');
  const [casePreconditions, setCasePreconditions] = useState('');
  const [caseSteps, setCaseSteps] = useState('');
  const [caseExpected, setCaseExpected] = useState('');
  const [casePriority, setCasePriority] = useState('High');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [sRes, rRes] = await Promise.all([
        api.get('/api/v1/test-management/suites'),
        api.get('/api/v1/test-management/runs')
      ]);
      setSuites(sRes || []);
      setRuns(rRes || []);
    } catch (err) {
      console.error("Failed to fetch test management data:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateSuiteSubmit = async (e) => {
    e.preventDefault();
    if (!newSuiteName.trim()) return;

    try {
      await api.post('/api/v1/test-management/suites', {
        name: newSuiteName,
        description: newSuiteDesc
      });
      setIsNewSuiteOpen(false);
      setNewSuiteName('');
      setNewSuiteDesc('');
      fetchData();
    } catch (err) {
      alert("Failed to create test suite: " + (err.message || err));
    }
  };

  const handleExecuteRunSubmit = async (e) => {
    e.preventDefault();
    if (!runName.trim()) return;
    setExecuting(true);

    try {
      await api.post('/api/v1/test-management/runs/execute', {
        name: runName,
        environment: runEnv,
        suite_id: runSuiteId ? parseInt(runSuiteId) : null
      });
      setIsExecuteRunOpen(false);
      fetchData();
    } catch (err) {
      alert("Failed to execute test run: " + (err.message || err));
    } finally {
      setExecuting(false);
    }
  };

  const handleOpenSuiteDetails = async (suite) => {
    setSelectedSuite(suite);
    setLoadingCases(true);
    try {
      const cases = await api.get(`/api/v1/test-management/cases?suite_id=${suite.id}`);
      setSuiteTestCases(cases || []);
    } catch (err) {
      console.error("Failed to fetch suite test cases:", err);
    } finally {
      setLoadingCases(false);
    }
  };

  const handleCreateCaseSubmit = async (e) => {
    e.preventDefault();
    if (!selectedSuite || !caseTitle.trim()) return;

    try {
      await api.post('/api/v1/test-management/cases', {
        suite_id: selectedSuite.id,
        title: caseTitle,
        preconditions: casePreconditions,
        steps: caseSteps,
        expected_result: caseExpected,
        priority: casePriority
      });
      setIsNewCaseOpen(false);
      setCaseTitle('');
      setCasePreconditions('');
      setCaseSteps('');
      setCaseExpected('');
      handleOpenSuiteDetails(selectedSuite);
      fetchData();
    } catch (err) {
      alert("Failed to add test case: " + (err.message || err));
    }
  };

  if (loading) {
    return <div style={{ padding: '2.5rem', textAlign: 'center', color: 'var(--text-muted)' }}>Loading QA & Test Management...</div>;
  }

  return (
    <div style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.5rem', maxWidth: '1440px', margin: '0 auto' }}>
      
      {/* Page Header Banner */}
      <div className="glass-panel" style={{ padding: '1.75rem 2rem', borderRadius: '16px', background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.12) 0%, rgba(59, 130, 246, 0.12) 100%)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '0.25rem' }}>
            <span className="badge badge-low" style={{ background: '#10b981', color: '#fff', fontWeight: 800 }}>
              QA ENGINE V3.2
            </span>
          </div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 900, margin: 0, color: 'var(--text-primary)' }}>QA & Test Management</h1>
          <p style={{ margin: '0.35rem 0 0 0', color: 'var(--text-muted)', fontSize: '0.92rem' }}>
            Test Suites, Test Cases, Automated Regression Runs, and Verification Linkage.
          </p>
        </div>
        <div style={{ display: 'flex', gap: '0.75rem' }}>
          <button
            className="btn btn-secondary"
            onClick={() => setIsNewSuiteOpen(true)}
            style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 700 }}
          >
            <Plus size={16} /> New Test Suite
          </button>
          <button
            className="btn btn-primary"
            onClick={() => setIsExecuteRunOpen(true)}
            style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 700, background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)' }}
          >
            <Play size={16} /> Execute Test Run
          </button>
        </div>
      </div>

      {/* Active Test Suites Section */}
      <div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 800, margin: 0, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Layers size={20} color="#10b981" /> Active Test Suites ({suites.length})
          </h2>
          <span style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>
            Click any suite card to view and manage test cases
          </span>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '1.25rem' }}>
          {suites.map((s) => (
            <div
              key={s.id}
              className="glass-panel"
              onClick={() => handleOpenSuiteDetails(s)}
              style={{
                padding: '1.5rem',
                borderRadius: '14px',
                border: selectedSuite?.id === s.id ? '2px solid #10b981' : '1px solid var(--border-color)',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                background: selectedSuite?.id === s.id ? 'rgba(16, 185, 129, 0.08)' : 'var(--bg-card)'
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <h3 style={{ fontSize: '1.1rem', fontWeight: 800, margin: 0, color: 'var(--text-primary)' }}>{s.name}</h3>
                <span className="badge badge-assigned" style={{ fontSize: '0.75rem', fontWeight: 800 }}>
                  {s.test_cases_count} Test Cases
                </span>
              </div>
              <p style={{ fontSize: '0.88rem', color: 'var(--text-muted)', margin: '0.75rem 0', minHeight: '40px' }}>{s.description}</p>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.8rem', color: 'var(--text-dim)', paddingTop: '0.75rem', borderTop: '1px dashed var(--border-color)' }}>
                <span>Project: <strong>{s.project_name}</strong></span>
                <span style={{ color: '#10b981', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                  <ShieldCheck size={14} /> 96% Pass Rate
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Test Suite Detailed Inspector / Cases Drawer */}
      {selectedSuite && (
        <div className="glass-panel" style={{ padding: '1.75rem', borderRadius: '14px', border: '1px solid rgba(16, 185, 129, 0.3)', background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.04) 0%, rgba(59, 130, 246, 0.04) 100%)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <h3 style={{ fontSize: '1.3rem', fontWeight: 800, margin: 0, color: '#10b981' }}>{selectedSuite.name}</h3>
                <span className="badge badge-low" style={{ background: 'rgba(16, 185, 129, 0.2)', color: '#10b981' }}>Suite ID #{selectedSuite.id}</span>
              </div>
              <p style={{ margin: '0.25rem 0 0 0', color: 'var(--text-muted)', fontSize: '0.88rem' }}>{selectedSuite.description}</p>
            </div>
            
            <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
              <button className="btn btn-secondary" style={{ fontSize: '0.82rem' }} onClick={() => setIsNewCaseOpen(true)}>
                <Plus size={14} /> + Add Test Case
              </button>
              <button className="btn btn-secondary" style={{ padding: '0.35rem 0.65rem' }} onClick={() => setSelectedSuite(null)}>
                <X size={16} />
              </button>
            </div>
          </div>

          <h4 style={{ fontSize: '1rem', fontWeight: 800, marginBottom: '0.75rem', color: 'var(--text-primary)' }}>Test Cases in Suite:</h4>
          
          {loadingCases ? (
            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Loading test cases...</p>
          ) : suiteTestCases.length === 0 ? (
            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>No test cases created in this suite yet. Click "+ Add Test Case" to define test scenarios.</p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {suiteTestCases.map((tc) => (
                <div key={tc.id} style={{ padding: '1rem', borderRadius: '10px', background: 'rgba(0,0,0,0.03)', border: '1px solid var(--border-color)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.35rem' }}>
                    <strong style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--text-primary)' }}>{tc.title}</strong>
                    <span className="badge badge-high" style={{ fontSize: '0.7rem' }}>Priority: {tc.priority || 'High'}</span>
                  </div>
                  {tc.preconditions && <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '0.25rem' }}><strong>Preconditions:</strong> {tc.preconditions}</div>}
                  {tc.steps && <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '0.25rem' }}><strong>Steps:</strong> {tc.steps}</div>}
                  {tc.expected_result && <div style={{ fontSize: '0.8rem', color: '#10b981' }}><strong>Expected Result:</strong> {tc.expected_result}</div>}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Recent Test Execution Runs Table */}
      <div className="glass-panel" style={{ padding: '1.75rem', borderRadius: '14px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 800, margin: 0, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Activity size={20} color="#3b82f6" /> Automated Test Execution Runs ({runs.length})
          </h2>
          <button className="btn btn-primary" style={{ fontSize: '0.82rem' }} onClick={() => setIsExecuteRunOpen(true)}>
            <Play size={14} /> Execute Run Now
          </button>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
          {runs.map((r) => (
            <div key={r.id} style={{ padding: '1.1rem 1.25rem', borderRadius: '12px', background: 'rgba(0, 0, 0, 0.02)', border: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.75rem' }}>
              <div>
                <h4 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 800, color: 'var(--text-primary)' }}>{r.name}</h4>
                <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>
                  Environment: <strong style={{ color: 'var(--text-primary)' }}>{r.environment}</strong> • Status: <span className="badge badge-resolved" style={{ fontSize: '0.68rem', padding: '1px 6px' }}>{r.status}</span>
                </div>
              </div>

              <div style={{ display: 'flex', gap: '1.25rem', alignItems: 'center' }}>
                <span style={{ color: '#10b981', fontWeight: 800, fontSize: '0.95rem', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                  <CheckCircle2 size={18} /> {r.passed_count} Passed
                </span>
                <span style={{ color: '#ef4444', fontWeight: 800, fontSize: '0.95rem', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                  <XCircle size={18} /> {r.failed_count} Failed
                </span>
                <span style={{ fontSize: '0.8rem', color: 'var(--text-dim)', marginLeft: '0.5rem' }}>
                  {r.created_at ? new Date(r.created_at).toLocaleTimeString() : 'Just now'}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Modal 1: Create New Test Suite */}
      {isNewSuiteOpen && (
        <div className="modal-overlay">
          <div className="modal-card" style={{ maxWidth: '520px', width: '100%' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
              <h3 style={{ fontSize: '1.25rem', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Layers size={20} color="#10b981" /> Create New Test Suite
              </h3>
              <button className="btn btn-secondary" style={{ padding: '0.25rem 0.5rem' }} onClick={() => setIsNewSuiteOpen(false)}>✕</button>
            </div>

            <form onSubmit={handleCreateSuiteSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div className="form-group">
                <label style={{ fontWeight: 700, fontSize: '0.85rem' }}>Test Suite Name *</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="e.g. Authentication & Token Security Suite"
                  value={newSuiteName}
                  onChange={(e) => setNewSuiteName(e.target.value)}
                  required
                />
              </div>

              <div className="form-group">
                <label style={{ fontWeight: 700, fontSize: '0.85rem' }}>Suite Description</label>
                <textarea
                  className="form-textarea"
                  rows={3}
                  placeholder="e.g. Comprehensive regression tests for JWT rotation, OAuth2 logins, and secret redaction."
                  value={newSuiteDesc}
                  onChange={(e) => setNewSuiteDesc(e.target.value)}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '0.5rem' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setIsNewSuiteOpen(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary">Create Suite</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal 2: Execute Test Run */}
      {isExecuteRunOpen && (
        <div className="modal-overlay">
          <div className="modal-card" style={{ maxWidth: '520px', width: '100%' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
              <h3 style={{ fontSize: '1.25rem', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Play size={20} color="#10b981" /> Execute Automated Test Run
              </h3>
              <button className="btn btn-secondary" style={{ padding: '0.25rem 0.5rem' }} onClick={() => setIsExecuteRunOpen(false)}>✕</button>
            </div>

            <form onSubmit={handleExecuteRunSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div className="form-group">
                <label style={{ fontWeight: 700, fontSize: '0.85rem' }}>Test Run Title *</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="e.g. Sprint 24 Automated Regression Run"
                  value={runName}
                  onChange={(e) => setRunName(e.target.value)}
                  required
                />
              </div>

              <div className="form-group">
                <label style={{ fontWeight: 700, fontSize: '0.85rem' }}>Environment</label>
                <select className="form-select" value={runEnv} onChange={(e) => setRunEnv(e.target.value)}>
                  <option value="Staging">Staging</option>
                  <option value="QA Integration">QA Integration</option>
                  <option value="Production Pre-flight">Production Pre-flight</option>
                </select>
              </div>

              <div className="form-group">
                <label style={{ fontWeight: 700, fontSize: '0.85rem' }}>Target Test Suite (Optional)</label>
                <select className="form-select" value={runSuiteId} onChange={(e) => setRunSuiteId(e.target.value)}>
                  <option value="">All Active Test Suites (Full Regression)</option>
                  {suites.map((s) => (
                    <option key={s.id} value={s.id}>{s.name}</option>
                  ))}
                </select>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '0.5rem' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setIsExecuteRunOpen(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={executing}>
                  {executing ? 'Executing Run...' : '▶ Start Execution'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal 3: Add Test Case to Selected Suite */}
      {isNewCaseOpen && selectedSuite && (
        <div className="modal-overlay">
          <div className="modal-card" style={{ maxWidth: '550px', width: '100%' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
              <h3 style={{ fontSize: '1.25rem', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <FileText size={20} color="#10b981" /> Add Test Case to '{selectedSuite.name}'
              </h3>
              <button className="btn btn-secondary" style={{ padding: '0.25rem 0.5rem' }} onClick={() => setIsNewCaseOpen(false)}>✕</button>
            </div>

            <form onSubmit={handleCreateCaseSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div className="form-group">
                <label style={{ fontWeight: 700, fontSize: '0.85rem' }}>Test Case Title *</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="e.g. Verify Token Expiration Enforcement"
                  value={caseTitle}
                  onChange={(e) => setCaseTitle(e.target.value)}
                  required
                />
              </div>

              <div className="form-group">
                <label style={{ fontWeight: 700, fontSize: '0.85rem' }}>Preconditions</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="e.g. Valid user session active"
                  value={casePreconditions}
                  onChange={(e) => setCasePreconditions(e.target.value)}
                />
              </div>

              <div className="form-group">
                <label style={{ fontWeight: 700, fontSize: '0.85rem' }}>Execution Steps</label>
                <textarea
                  className="form-textarea"
                  rows={3}
                  placeholder="1. Send GET request to /api/auth/verify&#10;2. Wait for 200 OK"
                  value={caseSteps}
                  onChange={(e) => setCaseSteps(e.target.value)}
                />
              </div>

              <div className="form-group">
                <label style={{ fontWeight: 700, fontSize: '0.85rem' }}>Expected Result</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="e.g. Returns 200 OK with valid user payload"
                  value={caseExpected}
                  onChange={(e) => setCaseExpected(e.target.value)}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '0.5rem' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setIsNewCaseOpen(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary">Save Test Case</button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}

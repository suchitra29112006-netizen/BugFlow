import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { FlaskConical, Plus, CheckCircle, ShieldCheck, X } from 'lucide-react';

export function InvestigationWorkspaceModal({ isOpen, onClose, issueId }) {
  const [workspace, setWorkspace] = useState(null);
  const [loading, setLoading] = useState(true);
  const [newHypothesis, setNewHypothesis] = useState('');
  const [newTestCase, setNewTestCase] = useState({ name: 'Regression Step', assertion: 'Expected HTTP 200' });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (isOpen && issueId) {
      loadWorkspace();
    }
  }, [isOpen, issueId]);

  const loadWorkspace = async () => {
    try {
      setLoading(true);
      const data = await api.getInvestigationWorkspace(issueId);
      setWorkspace(data);
    } catch (err) {
      console.error('Failed to load investigation workspace:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleAddHypothesis = async (e) => {
    e.preventDefault();
    if (!newHypothesis.trim()) return;
    try {
      setSubmitting(true);
      await api.addHypothesis(issueId, newHypothesis);
      setNewHypothesis('');
      loadWorkspace();
    } catch (err) {
      console.error(err);
    } finally {
      setSubmitting(false);
    }
  };

  const handleAddTestCase = async (e) => {
    e.preventDefault();
    try {
      setSubmitting(true);
      await api.addVerificationTestCase(issueId, newTestCase);
      loadWorkspace();
    } catch (err) {
      console.error(err);
    } finally {
      setSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" style={{ zIndex: 1100 }} onClick={onClose}>
      <div
        className="modal-card"
        style={{ maxWidth: '800px', width: '92%', padding: '1.75rem' }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.85rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <div style={{ padding: '0.5rem', borderRadius: '10px', background: 'rgba(168, 85, 247, 0.15)', color: '#a855f7' }}>
              <FlaskConical size={22} />
            </div>
            <div>
              <h2 style={{ fontSize: '1.25rem', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                AI Investigation Workspace
                <span style={{ fontSize: '0.75rem', padding: '2px 8px', borderRadius: '4px', background: 'rgba(168, 85, 247, 0.15)', color: '#a855f7', fontFamily: 'monospace' }}>
                  Defect #{issueId}
                </span>
              </h2>
              <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>Hypothesis Sandbox & Automated Verification Plan</p>
            </div>
          </div>
          <button className="btn btn-secondary" style={{ padding: '0.35rem 0.65rem' }} onClick={onClose}>
            <X size={16} />
          </button>
        </div>

        {/* Content */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          {loading ? (
            <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>Loading Investigation Workspace...</div>
          ) : workspace ? (
            <>
              {/* Workspace Info */}
              <div style={{ padding: '1rem', borderRadius: '10px', background: 'rgba(0, 0, 0, 0.03)', border: '1px solid var(--border-color)', display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1rem' }}>
                <div>
                  <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', display: 'block', fontWeight: 700 }}>WORKSPACE STATUS</span>
                  <span style={{ fontSize: '0.9rem', color: '#a855f7', fontWeight: 800, textTransform: 'uppercase' }}>{workspace.status}</span>
                </div>
                <div>
                  <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', display: 'block', fontWeight: 700 }}>LEAD INVESTIGATOR</span>
                  <span style={{ fontSize: '0.9rem', fontFamily: 'monospace', fontWeight: 600 }}>{workspace.investigator}</span>
                </div>
                <div>
                  <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', display: 'block', fontWeight: 700 }}>HUMAN IN LOOP</span>
                  <span style={{ fontSize: '0.85rem', color: '#10b981', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <ShieldCheck size={14} /> Required
                  </span>
                </div>
              </div>

              {/* Hypotheses */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                <h3 style={{ fontSize: '0.95rem', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  🧠 Brainstormed Hypotheses ({workspace.hypotheses?.length || 0})
                </h3>

                <form onSubmit={handleAddHypothesis} style={{ display: 'flex', gap: '0.5rem' }}>
                  <input
                    type="text"
                    className="form-input"
                    style={{ flex: 1, fontSize: '0.85rem' }}
                    placeholder="Add hypothesis (e.g. Race condition under high concurrent database updates)..."
                    value={newHypothesis}
                    onChange={(e) => setNewHypothesis(e.target.value)}
                  />
                  <button
                    type="submit"
                    disabled={submitting || !newHypothesis.trim()}
                    className="btn btn-primary"
                    style={{ fontSize: '0.8rem', padding: '0.5rem 1rem' }}
                  >
                    <Plus size={14} /> Add Hypothesis
                  </button>
                </form>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  {workspace.hypotheses?.map((h) => (
                    <div key={h.id} style={{ padding: '0.75rem 1rem', borderRadius: '8px', background: 'rgba(0,0,0,0.02)', border: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div>
                        <span style={{ fontSize: '0.88rem', fontWeight: 700, display: 'block' }}>{h.statement}</span>
                        <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Status: {h.status} | Likelihood: {h.likelihood}</span>
                      </div>
                      <span className="badge badge-assigned" style={{ fontSize: '0.7rem' }}>
                        {h.status}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Verification Test Cases */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', paddingTop: '0.75rem', borderTop: '1px solid var(--border-color)' }}>
                <h3 style={{ fontSize: '0.95rem', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  🧪 Verification Test Suite ({workspace.verification_tests?.length || 0})
                </h3>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  {workspace.verification_tests?.map((tc) => (
                    <div key={tc.id} style={{ padding: '0.75rem 1rem', borderRadius: '8px', background: 'rgba(0,0,0,0.02)', border: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                        <CheckCircle size={16} color={tc.status === 'passed' ? '#10b981' : 'var(--text-dim)'} />
                        <div>
                          <span style={{ fontSize: '0.88rem', fontWeight: 700, display: 'block' }}>{tc.test_name}</span>
                          <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Assertion: {tc.expected_result}</span>
                        </div>
                      </div>
                      <span className={`badge ${tc.status === 'passed' ? 'badge-resolved' : 'badge-closed'}`} style={{ fontSize: '0.7rem' }}>
                        {tc.status || 'Pending'}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </>
          ) : (
            <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)' }}>No active workspace data.</div>
          )}
        </div>

        {/* Footer */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '1.5rem', borderTop: '1px solid var(--border-color)', paddingTop: '1rem' }}>
          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Human Execution Control: Developers approve all fix commits</span>
          <button onClick={onClose} className="btn btn-secondary">
            Close
          </button>
        </div>
      </div>
    </div>
  );
}


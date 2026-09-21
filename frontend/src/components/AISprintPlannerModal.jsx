import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { Sparkles, CheckCircle2, AlertTriangle, X, Check, ArrowRight, ShieldCheck, Flame, Loader2 } from 'lucide-react';

export const AISprintPlannerModal = ({ isOpen, onClose, sprintId, onPlanAccepted }) => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedIssues, setSelectedIssues] = useState([]);
  const [accepting, setAccepting] = useState(false);

  const fetchAIPlan = async () => {
    if (!sprintId) return;
    setLoading(true);
    try {
      const plan = await api.planSprintWithAI(sprintId);
      setData(plan);
      if (plan && plan.recommended_issues) {
        setSelectedIssues(plan.recommended_issues.map(i => i.issue_id));
      }
    } catch (err) {
      console.error("Failed to generate AI sprint plan:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen && sprintId) {
      fetchAIPlan();
    }
  }, [isOpen, sprintId]);

  const toggleSelectIssue = (id) => {
    setSelectedIssues(prev =>
      prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
    );
  };

  const handleAcceptPlan = async () => {
    if (!selectedIssues.length) return;
    setAccepting(true);
    try {
      await Promise.all(
        selectedIssues.map(id => api.assignIssueToSprint(sprintId, id))
      );
      onPlanAccepted();
      onClose();
    } catch (err) {
      alert("Failed to assign recommended issues to sprint: " + err.message);
    } finally {
      setAccepting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" style={{ zIndex: 1100 }} onClick={onClose}>
      <div
        className="modal-card"
        style={{ maxWidth: '850px', width: '92%', padding: '2rem' }}
        onClick={(e) => e.stopPropagation()}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.85rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <div style={{ background: 'linear-gradient(135deg, #10b981 0%, #3b82f6 100%)', padding: '0.45rem', borderRadius: '8px' }}>
              <Sparkles size={20} color="#fff" />
            </div>
            <div>
              <h2 style={{ fontSize: '1.35rem', fontWeight: 900 }}>🤖 AI Sprint Planner</h2>
              <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>Automated backlog selection based on SLA urgency, severity, capacity & developer skills</p>
            </div>
          </div>
          <button className="btn btn-secondary" style={{ padding: '0.35rem 0.65rem' }} onClick={onClose}>
            <X size={18} />
          </button>
        </div>

        {loading ? (
          <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.75rem' }}>
            <Loader2 className="animate-spin" size={28} color="#10b981" />
            <span>Analyzing unassigned backlog, developer capacity, SLA deadlines, and velocity...</span>
          </div>
        ) : !data || !data.recommended_issues || data.recommended_issues.length === 0 ? (
          <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)' }}>
            No unassigned backlog defects found for AI sprint recommendation.
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            
            {/* Header Capacity Metrics */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem', background: 'rgba(16, 185, 129, 0.06)', border: '1px solid rgba(16, 185, 129, 0.25)', padding: '1rem', borderRadius: '10px', textAlign: 'center' }}>
              <div>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block' }}>RECOMMENDED CAPACITY</span>
                <strong style={{ fontSize: '1.25rem', color: '#10b981' }}>{data.recommended_capacity_pts} Story Points</strong>
              </div>
              <div>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block' }}>TEAM TOTAL CAPACITY</span>
                <strong style={{ fontSize: '1.25rem', color: '#3b82f6' }}>{data.team_capacity_pts} Story Points</strong>
              </div>
              <div>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block' }}>CAPACITY UTILIZATION</span>
                <strong style={{ fontSize: '1.25rem', color: '#f97316' }}>{data.capacity_utilization_pct}% Optimal</strong>
              </div>
            </div>

            {/* Recommended Backlog Issues List */}
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                <span style={{ fontSize: '0.78rem', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                  RECOMMENDED BACKLOG DEFECTS ({selectedIssues.length} / {data.recommended_issues.length} Selected)
                </span>
                <div style={{ display: 'flex', gap: '0.5rem', fontSize: '0.75rem' }}>
                  <button style={{ background: 'none', border: 'none', color: '#10b981', cursor: 'pointer', fontWeight: 700 }} onClick={() => setSelectedIssues(data.recommended_issues.map(i => i.issue_id))}>
                    Select All
                  </button>
                  <span>•</span>
                  <button style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }} onClick={() => setSelectedIssues([])}>
                    Deselect All
                  </button>
                </div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', maxHeight: '350px', overflowY: 'auto', paddingRight: '4px' }}>
                {data.recommended_issues.map((rec) => {
                  const isChecked = selectedIssues.includes(rec.issue_id);
                  return (
                    <div
                      key={rec.issue_id}
                      style={{
                        padding: '1rem',
                        background: isChecked ? 'rgba(16, 185, 129, 0.05)' : 'rgba(0,0,0,0.02)',
                        border: isChecked ? '1px solid #10b981' : '1px solid var(--border-color)',
                        borderRadius: '8px',
                        display: 'flex',
                        alignItems: 'center',
                        justify: 'space-between',
                        gap: '1rem',
                        cursor: 'pointer'
                      }}
                      onClick={() => toggleSelectIssue(rec.issue_id)}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flex: 1 }}>
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => {}} // Handled by parent div
                          style={{ width: '16px', height: '16px', accentColor: '#10b981' }}
                        />

                        <div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
                            <strong style={{ fontSize: '0.92rem' }}>#{rec.issue_id} — {rec.title}</strong>
                            <span className={`badge badge-${rec.severity.toLowerCase()}`}>{rec.severity}</span>
                          </div>

                          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem', fontSize: '0.75rem' }}>
                            {rec.selection_reasons.map((r, idx) => (
                              <span key={idx} style={{ color: '#10b981', fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: '3px' }}>
                                ✓ {r}
                              </span>
                            ))}
                          </div>
                        </div>
                      </div>

                      <div style={{ textAlign: 'right' }}>
                        <span style={{ fontSize: '0.9rem', fontWeight: 800, color: '#3b82f6' }}>
                          {rec.story_points} pts
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* User Action Controls */}
            <div style={{ display: 'flex', justifyContent: 'between', alignItems: 'center', borderTop: '1px solid var(--border-color)', paddingTop: '1.25rem' }}>
              <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                ℹ️ Human manager review required. Issues will be moved into Sprint #{sprintId}.
              </span>

              <div style={{ display: 'flex', gap: '0.75rem' }}>
                <button className="btn btn-secondary" onClick={onClose}>
                  Reject Plan
                </button>
                <button
                  className="btn btn-primary"
                  style={{ padding: '0.45rem 1.25rem' }}
                  onClick={handleAcceptPlan}
                  disabled={selectedIssues.length === 0 || accepting}
                >
                  {accepting ? 'Adding Issues...' : `Accept Selected (${selectedIssues.length})`}
                </button>
              </div>
            </div>

          </div>
        )}
      </div>
    </div>
  );
};

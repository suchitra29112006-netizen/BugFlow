import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { Sparkles, Trophy, X, CheckCircle2, AlertTriangle, UserCheck, Sliders, Info, ShieldCheck, Flame, Loader2 } from 'lucide-react';

export const AIAssignmentAssistantModal = ({ isOpen, onClose, issueId, currentAssigneeId, onAssigned }) => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [assigningId, setAssigningId] = useState(null);
  const [overrideReason, setOverrideReason] = useState('');
  const [overrideTargetId, setOverrideTargetId] = useState(null);

  const fetchAnalysis = async () => {
    if (!issueId) return;
    setLoading(true);
    try {
      const res = await api.analyzeIssueAssignment(issueId);
      setData(res);
    } catch (err) {
      console.error("Failed to analyze issue assignment:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen && issueId) {
      fetchAnalysis();
    }
  }, [isOpen, issueId]);

  const handleAssign = async (userId, isRecommendation = true) => {
    setAssigningId(userId);
    try {
      await api.assignIssue(issueId, {
        user_id: userId,
        source: isRecommendation ? 'ai_recommendation' : 'manual_assignment',
        override_reason: !isRecommendation ? overrideReason : undefined
      });
      setOverrideTargetId(null);
      setOverrideReason('');
      onAssigned();
      onClose();
    } catch (err) {
      alert("Assignment failed: " + err.message);
    } finally {
      setAssigningId(null);
    }
  };

  if (!isOpen) return null;

  const ranks = ['🥇', '🥈', '🥉'];

  return (
    <div className="modal-overlay" style={{ zIndex: 1100 }} onClick={onClose}>
      <div
        className="modal-card"
        style={{ maxWidth: '850px', width: '92%', padding: '2rem' }}
        onClick={(e) => e.stopPropagation()}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.85rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <div style={{ background: 'linear-gradient(135deg, #10b981 0%, #f97316 100%)', padding: '0.45rem', borderRadius: '8px' }}>
              <Sparkles size={20} color="#fff" />
            </div>
            <div>
              <h2 style={{ fontSize: '1.35rem', fontWeight: 900 }}>AI Assignment Assistant</h2>
              <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>Deterministic 8-part weighted candidate scoring & explainable recommendations</p>
            </div>
          </div>
          <button className="btn btn-secondary" style={{ padding: '0.35rem 0.65rem' }} onClick={onClose}>
            <X size={18} />
          </button>
        </div>

        {loading ? (
          <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.75rem' }}>
            <Loader2 className="animate-spin" size={28} color="#10b981" />
            <span>Analyzing issue requirements, developer skill profiles, and workload capacity...</span>
          </div>
        ) : !data || !data.recommendations || data.recommendations.length === 0 ? (
          <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)' }}>
            <Info size={24} style={{ marginBottom: '0.5rem' }} />
            <p>Insufficient information or zero eligible developers for recommendation.</p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            
            {/* Extracted Issue Signal Pills */}
            <div style={{ background: 'rgba(16, 185, 129, 0.06)', border: '1px solid rgba(16, 185, 129, 0.25)', padding: '1rem', borderRadius: '10px', fontSize: '0.85rem', display: 'flex', flexWrap: 'wrap', gap: '1rem', alignItems: 'center' }}>
              <div><strong>Domain:</strong> <span style={{ color: '#10b981', fontWeight: 700 }}>{data.domain}</span></div>
              <div><strong>Category:</strong> {data.category}</div>
              <div><strong>Complexity:</strong> <span className={`badge badge-${data.complexity.toLowerCase()}`}>{data.complexity}</span></div>
              <div><strong>Required Skills:</strong> {data.required_skills.join(', ')}</div>
            </div>

            {/* Top 3 Ranked Candidate Cards */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              {data.recommendations.map((cand, idx) => {
                const medal = ranks[idx] || `#${idx + 1}`;
                const isAssigned = currentAssigneeId === cand.user_id;

                return (
                  <div
                    key={cand.user_id}
                    className="glass-panel"
                    style={{
                      padding: '1.25rem',
                      border: idx === 0 ? '1.5px solid #10b981' : '1px solid var(--border-color)',
                      background: idx === 0 ? 'rgba(16, 185, 129, 0.03)' : 'transparent',
                      position: 'relative'
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.75rem' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                        <span style={{ fontSize: '1.6rem' }}>{medal}</span>
                        <div>
                          <h3 style={{ fontSize: '1.15rem', fontWeight: 800, margin: 0 }}>
                            {cand.name} <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 500 }}>({cand.role})</span>
                          </h3>
                          <div style={{ display: 'flex', gap: '0.5rem', marginTop: '2px' }}>
                            <span style={{ fontSize: '0.72rem', color: '#10b981', fontWeight: 700 }}>
                              Confidence: {cand.confidence}
                            </span>
                            <span style={{ fontSize: '0.72rem', color: 'var(--text-dim)' }}>
                              • Status: {cand.availability_status}
                            </span>
                          </div>
                        </div>
                      </div>

                      <div style={{ textAlign: 'right' }}>
                        <span style={{ fontSize: '1.6rem', fontWeight: 900, color: idx === 0 ? '#10b981' : '#3b82f6' }}>
                          {cand.overall_score}% Match
                        </span>
                      </div>
                    </div>

                    {/* Score Component Breakdown Bar */}
                    <div style={{ height: '6px', background: 'rgba(0,0,0,0.08)', borderRadius: '3px', overflow: 'hidden', marginBottom: '1rem' }}>
                      <div style={{ width: `${cand.overall_score}%`, height: '100%', background: idx === 0 ? 'linear-gradient(90deg, #10b981 0%, #34d399 100%)' : '#3b82f6' }} />
                    </div>

                    {/* Component Score Pills */}
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.75rem', fontSize: '0.78rem', marginBottom: '0.85rem', background: 'rgba(0,0,0,0.02)', padding: '0.6rem 0.85rem', borderRadius: '8px' }}>
                      <div>Skill: <strong>{cand.scores.skill_score}%</strong></div>
                      <div>Exp: <strong>{cand.scores.experience_score}%</strong></div>
                      <div>Project: <strong>{cand.scores.project_score}%</strong></div>
                      <div>Domain: <strong>{cand.scores.domain_score}%</strong></div>
                      <div>Workload: <strong>{cand.scores.workload_score}%</strong></div>
                      <div>Availability: <strong>{cand.scores.availability_score}%</strong></div>
                    </div>

                    {/* Positive Reasons */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem', marginBottom: '0.75rem' }}>
                      {cand.reasons.map((r, i) => (
                        <div key={i} style={{ fontSize: '0.82rem', color: '#10b981', display: 'flex', alignItems: 'center', gap: '0.4rem', fontWeight: 600 }}>
                          <CheckCircle2 size={13} /> {r}
                        </div>
                      ))}
                    </div>

                    {/* Concerns */}
                    {cand.concerns && cand.concerns.length > 0 && (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem', marginBottom: '1rem' }}>
                        {cand.concerns.map((c, i) => (
                          <div key={i} style={{ fontSize: '0.82rem', color: '#f97316', display: 'flex', alignItems: 'center', gap: '0.4rem', fontWeight: 600 }}>
                            <AlertTriangle size={13} /> {c}
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Action Button */}
                    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem' }}>
                      <button
                        className={`btn ${idx === 0 ? 'btn-primary' : 'btn-secondary'}`}
                        style={{ padding: '0.45rem 1.25rem', fontSize: '0.85rem' }}
                        onClick={() => handleAssign(cand.user_id, true)}
                        disabled={isAssigned || assigningId === cand.user_id}
                      >
                        {isAssigned ? '✓ Currently Assigned' : `Assign ${cand.name.split(' ')[0]}`}
                      </button>
                    </div>

                  </div>
                );
              })}
            </div>

            <div style={{ textAlign: 'center', fontSize: '0.78rem', color: 'var(--text-muted)', borderTop: '1px solid var(--border-color)', paddingTop: '1rem' }}>
              ℹ️ Deterministic AI recommendation assists assignment decisions. Human manager confirmation is required.
            </div>

          </div>
        )}
      </div>
    </div>
  );
};

import React, { useEffect, useState } from 'react';
import { api } from '../services/api';
import { Sparkles, UserCheck, AlertTriangle, CheckCircle2, Sliders, ChevronRight, Info, Award } from 'lucide-react';

export const AIAssignmentCard = ({ issueId, currentAssigneeId, onAssigned, onOpenCompare, onOpenFeedback }) => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [assigning, setAssigning] = useState(false);
  const [overrideReason, setOverrideReason] = useState('');
  const [showOverrideInput, setShowOverrideInput] = useState(false);
  const [targetAssigneeId, setTargetAssigneeId] = useState(null);

  const fetchRecommendations = async () => {
    setLoading(true);
    try {
      const res = await api.getAssignmentRecommendations(issueId);
      setData(res);
    } catch (err) {
      console.error("Failed to load assignment recommendations:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRecommendations();
  }, [issueId]);

  const handleConfirmAssignment = async (candidateId, isOverride = false) => {
    setAssigning(true);
    try {
      await api.assignDeveloperWithAudit(issueId, candidateId, isOverride ? overrideReason : null);
      setShowOverrideInput(false);
      setOverrideReason('');
      onAssigned();
    } catch (err) {
      alert("Assignment failed: " + err.message);
    } finally {
      setAssigning(false);
    }
  };

  if (loading) return <div style={{ padding: '1rem', fontSize: '0.85rem', color: 'var(--text-muted)' }}>Calculating AI assignment scores...</div>;

  if (!data || data.status === 'INSUFFICIENT_DATA' || !data.recommendations || data.recommendations.length === 0) {
    return (
      <div className="glass-panel" style={{ padding: '1.25rem', border: '1px solid var(--border-color)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
          <Info size={16} />
          <span>Insufficient information for a reliable AI recommendation.</span>
        </div>
      </div>
    );
  }

  const topCandidate = data.recommendations[0];
  const otherCandidates = data.recommendations.slice(1, 4);

  return (
    <div className="glass-panel" style={{ padding: '1.5rem', border: '1px solid rgba(16, 185, 129, 0.4)', background: 'rgba(16, 185, 129, 0.04)' }}>
      
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#10b981', fontWeight: 800, fontSize: '1.05rem' }}>
          <Sparkles size={18} />
          🤖 Explainable AI Assignment
        </div>
        <button
          className="btn btn-secondary"
          style={{ padding: '0.25rem 0.6rem', fontSize: '0.75rem' }}
          onClick={() => onOpenCompare(data.recommendations, data.intelligence)}
        >
          <Sliders size={12} /> Compare Candidates
        </button>
      </div>

      {/* Top Candidate Spotlight Box */}
      <div style={{ background: 'var(--bg-secondary)', padding: '1.25rem', borderRadius: '10px', border: '1px solid var(--border-color)', marginBottom: '1.25rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
          <div>
            <span style={{ fontSize: '0.75rem', fontWeight: 800, color: '#10b981', textTransform: 'uppercase', letterSpacing: '0.04em' }}>TOP RECOMMENDED ASSIGNEE</span>
            <h3 style={{ fontSize: '1.2rem', fontWeight: 800, marginTop: '2px' }}>{topCandidate.candidate_name}</h3>
          </div>

          <div style={{ textAlign: 'right' }}>
            <span style={{ fontSize: '1.5rem', fontWeight: 900, color: '#10b981' }}>{topCandidate.overall_score}/100</span>
            <div style={{ fontSize: '0.72rem', fontWeight: 800, color: '#34d399' }}>{topCandidate.recommendation_level}</div>
          </div>
        </div>

        {/* Component Progress Bar */}
        <div style={{ height: '6px', background: 'rgba(0,0,0,0.08)', borderRadius: '3px', overflow: 'hidden', marginBottom: '1rem' }}>
          <div style={{ width: `${topCandidate.overall_score}%`, height: '100%', background: 'linear-gradient(90deg, #10b981 0%, #3b82f6 100%)' }} />
        </div>

        {/* Positive Reasons Traceability */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem', marginBottom: '0.85rem' }}>
          {topCandidate.positive_reasons.map((reason, idx) => (
            <div key={idx} style={{ fontSize: '0.82rem', color: '#10b981', display: 'flex', alignItems: 'center', gap: '0.4rem', fontWeight: 600 }}>
              <CheckCircle2 size={13} /> {reason}
            </div>
          ))}
        </div>

        {/* Potential Concerns Traceability */}
        {topCandidate.concerns && topCandidate.concerns.length > 0 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem', marginBottom: '1rem' }}>
            {topCandidate.concerns.map((concern, idx) => (
              <div key={idx} style={{ fontSize: '0.82rem', color: '#f97316', display: 'flex', alignItems: 'center', gap: '0.4rem', fontWeight: 600 }}>
                <AlertTriangle size={13} /> {concern}
              </div>
            ))}
          </div>
        )}

        {/* Action Button */}
        <button
          className="btn btn-primary"
          style={{ width: '100%', justifyContent: 'center', padding: '0.6rem' }}
          onClick={() => handleConfirmAssignment(topCandidate.candidate_id)}
          disabled={assigning || currentAssigneeId === topCandidate.candidate_id}
        >
          {currentAssigneeId === topCandidate.candidate_id ? '✓ Currently Assigned' : `Assign to ${topCandidate.candidate_name}`}
        </button>
      </div>

      {/* Other Candidate Rankings List */}
      {otherCandidates.length > 0 && (
        <div>
          <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '0.5rem', display: 'block' }}>
            Other Eligible Candidates
          </span>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            {otherCandidates.map((cand) => (
              <div
                key={cand.candidate_id}
                style={{
                  padding: '0.65rem 0.85rem',
                  borderRadius: '8px',
                  background: 'rgba(0,0,0,0.02)',
                  border: '1px solid var(--border-color)',
                  display: 'flex',
                  alignItems: 'center',
                  justify: 'space-between',
                  fontSize: '0.85rem'
                }}
              >
                <div>
                  <span style={{ fontWeight: 700 }}>{cand.candidate_name}</span>
                  <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginLeft: '8px' }}>{cand.recommendation_level}</span>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  <strong style={{ color: '#3b82f6' }}>{cand.overall_score}/100</strong>
                  <button
                    className="btn btn-secondary"
                    style={{ padding: '0.2rem 0.5rem', fontSize: '0.72rem' }}
                    onClick={() => {
                      setTargetAssigneeId(cand.candidate_id);
                      setShowOverrideInput(true);
                    }}
                  >
                    Assign
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Override Reason Prompt */}
      {showOverrideInput && (
        <div style={{ marginTop: '1rem', background: 'rgba(249, 115, 22, 0.1)', padding: '1rem', borderRadius: '8px', border: '1px solid rgba(249, 115, 22, 0.4)' }}>
          <div style={{ fontSize: '0.82rem', fontWeight: 700, color: '#f97316', marginBottom: '0.5rem' }}>
            Manual Override Reason (Audit Trail)
          </div>
          <input
            type="text"
            className="form-input"
            style={{ fontSize: '0.85rem', marginBottom: '0.6rem' }}
            placeholder="e.g. Developer possesses specialized domain context..."
            value={overrideReason}
            onChange={(e) => setOverrideReason(e.target.value)}
          />
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem' }}>
            <button className="btn btn-secondary" style={{ padding: '0.3rem 0.6rem', fontSize: '0.75rem' }} onClick={() => setShowOverrideInput(false)}>Cancel</button>
            <button className="btn btn-primary" style={{ padding: '0.3rem 0.6rem', fontSize: '0.75rem' }} onClick={() => handleConfirmAssignment(targetAssigneeId, true)}>Confirm Assignment</button>
          </div>
        </div>
      )}

    </div>
  );
};

import React from 'react';
import { Sliders, X, CheckCircle2, AlertTriangle, ShieldCheck, Zap } from 'lucide-react';

export const CandidateComparisonModal = ({ isOpen, onClose, candidates = [], intelligence }) => {
  if (!isOpen || !candidates || candidates.length === 0) return null;

  const candidateList = candidates.slice(0, 5);

  return (
    <div className="modal-overlay" style={{ zIndex: 1100 }} onClick={onClose}>
      <div
        className="modal-card"
        style={{ maxWidth: '1000px', width: '90%', padding: '2rem' }}
        onClick={(e) => e.stopPropagation()}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.85rem' }}>
          <div>
            <div style={{ fontSize: '0.75rem', fontWeight: 800, color: '#10b981', textTransform: 'uppercase', letterSpacing: '0.04em' }}>EXPLAINABLE AI ASSIGNMENT ENGINE</div>
            <h2 style={{ fontSize: '1.4rem', fontWeight: 900 }}>Side-by-Side Candidate Developer Comparison</h2>
          </div>
          <button className="btn btn-secondary" style={{ padding: '0.35rem 0.65rem' }} onClick={onClose}>
            <X size={16} />
          </button>
        </div>

        {intelligence && (
          <div style={{ background: 'rgba(59, 130, 246, 0.08)', padding: '0.85rem 1.25rem', borderRadius: '8px', marginBottom: '1.5rem', fontSize: '0.85rem', display: 'flex', flexWrap: 'wrap', gap: '1.5rem' }}>
            <div><strong>Target Category:</strong> {intelligence.category}</div>
            <div><strong>Domain:</strong> {intelligence.domain}</div>
            <div><strong>Complexity:</strong> {intelligence.complexity}</div>
            <div><strong>Required Skills:</strong> {Array.isArray(intelligence.required_skills) ? intelligence.required_skills.join(', ') : intelligence.required_skills}</div>
          </div>
        )}

        {/* Side by Side Comparison Grid */}
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.88rem' }}>
            <thead>
              <tr style={{ borderBottom: '2px solid var(--border-color)', textAlign: 'left' }}>
                <th style={{ padding: '0.75rem', minWidth: '160px', color: 'var(--text-muted)' }}>Scoring Criteria</th>
                {candidateList.map((c, idx) => (
                  <th key={c.candidate_id} style={{ padding: '0.75rem', minWidth: '160px', textAlign: 'center', background: idx === 0 ? 'rgba(16, 185, 129, 0.08)' : 'transparent' }}>
                    <div style={{ fontSize: '1rem', fontWeight: 800 }}>{c.candidate_name}</div>
                    <span style={{ fontSize: '0.72rem', color: idx === 0 ? '#10b981' : 'var(--text-muted)', fontWeight: 800 }}>{c.recommendation_level}</span>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>

              <tr style={{ borderBottom: '1px solid var(--border-color)', background: 'rgba(0,0,0,0.02)' }}>
                <td style={{ padding: '0.75rem', fontWeight: 800 }}>OVERALL SCORE (100%)</td>
                {candidateList.map((c, idx) => (
                  <td key={c.candidate_id} style={{ padding: '0.75rem', textAlign: 'center', fontSize: '1.3rem', fontWeight: 900, color: idx === 0 ? '#10b981' : '#3b82f6' }}>
                    {c.overall_score}/100
                  </td>
                ))}
              </tr>

              <tr style={{ borderBottom: '1px solid var(--border-color)' }}>
                <td style={{ padding: '0.75rem' }}>Skill Match (35%)</td>
                {candidateList.map(c => (
                  <td key={c.candidate_id} style={{ padding: '0.75rem', textAlign: 'center', fontWeight: 700 }}>
                    {c.component_scores.skill_score}%
                  </td>
                ))}
              </tr>

              <tr style={{ borderBottom: '1px solid var(--border-color)' }}>
                <td style={{ padding: '0.75rem' }}>Technology Match (20%)</td>
                {candidateList.map(c => (
                  <td key={c.candidate_id} style={{ padding: '0.75rem', textAlign: 'center', fontWeight: 700 }}>
                    {c.component_scores.technology_score}%
                  </td>
                ))}
              </tr>

              <tr style={{ borderBottom: '1px solid var(--border-color)' }}>
                <td style={{ padding: '0.75rem' }}>Experience Match (15%)</td>
                {candidateList.map(c => (
                  <td key={c.candidate_id} style={{ padding: '0.75rem', textAlign: 'center', fontWeight: 700 }}>
                    {c.component_scores.experience_score}%
                  </td>
                ))}
              </tr>

              <tr style={{ borderBottom: '1px solid var(--border-color)' }}>
                <td style={{ padding: '0.75rem' }}>Workload Capacity (15%)</td>
                {candidateList.map(c => (
                  <td key={c.candidate_id} style={{ padding: '0.75rem', textAlign: 'center', fontWeight: 700 }}>
                    {c.component_scores.workload_score}% ({c.active_workload} active)
                  </td>
                ))}
              </tr>

              <tr style={{ borderBottom: '1px solid var(--border-color)' }}>
                <td style={{ padding: '0.75rem' }}>Past Similar Fixes (10%)</td>
                {candidateList.map(c => (
                  <td key={c.candidate_id} style={{ padding: '0.75rem', textAlign: 'center', fontWeight: 700 }}>
                    {c.component_scores.past_issue_score}% ({c.resolved_count} fixed)
                  </td>
                ))}
              </tr>

              <tr style={{ borderBottom: '1px solid var(--border-color)' }}>
                <td style={{ padding: '0.75rem' }}>Availability (5%)</td>
                {candidateList.map(c => (
                  <td key={c.candidate_id} style={{ padding: '0.75rem', textAlign: 'center', fontWeight: 700 }}>
                    {c.component_scores.availability_score}%
                  </td>
                ))}
              </tr>

              <tr style={{ borderBottom: '1px solid var(--border-color)' }}>
                <td style={{ padding: '0.75rem', fontWeight: 700 }}>Positive Reasons</td>
                {candidateList.map(c => (
                  <td key={c.candidate_id} style={{ padding: '0.75rem', fontSize: '0.78rem', color: '#10b981', verticalAlign: 'top' }}>
                    {c.positive_reasons.map((r, i) => (
                      <div key={i} style={{ marginBottom: '4px' }}>✓ {r}</div>
                    ))}
                  </td>
                ))}
              </tr>

            </tbody>
          </table>
        </div>

        <div style={{ marginTop: '1.5rem', textAlign: 'center', fontSize: '0.8rem', color: 'var(--text-muted)', borderTop: '1px solid var(--border-color)', paddingTop: '1rem' }}>
          ℹ️ The AI assignment score is a deterministic recommendation calculated from weighted skill matrix metrics and capacity limits. Human confirmation is required to assign defects.
        </div>
      </div>
    </div>
  );
};

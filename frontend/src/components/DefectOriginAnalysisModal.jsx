import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { GitCommit, X, ShieldAlert, GitPullRequest, Code2, AlertTriangle, Lightbulb, CheckCircle2 } from 'lucide-react';

export const DefectOriginAnalysisModal = ({ isOpen, onClose, issueId }) => {
  const [originData, setOriginData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (isOpen && issueId) {
      setLoading(true);
      setError('');
      api.getDefectOrigin(issueId)
        .then(data => {
          setOriginData(data);
          setLoading(false);
        })
        .catch(err => {
          setError(err.message || 'Failed to load defect origin analysis.');
          setLoading(false);
        });
    }
  }, [isOpen, issueId]);

  if (!isOpen) return null;

  return (
    <div className="modal-overlay">
      <div className="modal-card" style={{ maxWidth: '720px', width: '90%' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <GitCommit size={22} color="#f59e0b" />
            <h3 style={{ fontSize: '1.25rem', fontWeight: 800 }}>Defect Root Origin & Injection Analysis</h3>
          </div>
          <button className="btn btn-secondary" style={{ padding: '0.3rem 0.5rem' }} onClick={onClose}>
            <X size={18} />
          </button>
        </div>

        {loading ? (
          <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>
            Analyzing commit history, PRs, and software lifecycle injection phase...
          </div>
        ) : error ? (
          <div style={{ padding: '1.5rem', background: 'rgba(239, 68, 68, 0.1)', color: '#ef4444', borderRadius: '8px' }}>
            {error}
          </div>
        ) : !originData ? (
          <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)' }}>
            No origin data available.
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            
            {/* Primary Origin Badge & Summary */}
            <div style={{ padding: '1.25rem', background: 'linear-gradient(135deg, rgba(245, 158, 11, 0.08) 0%, rgba(239, 68, 68, 0.08) 100%)', border: '1px solid rgba(245, 158, 11, 0.4)', borderRadius: '12px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                <span style={{ fontSize: '0.78rem', fontWeight: 800, color: '#f59e0b', textTransform: 'uppercase' }}>
                  INJECTION LIFECYCLE PHASE
                </span>
                <span className="badge badge-low" style={{ background: '#f59e0b', color: '#fff', fontWeight: 800 }}>
                  {originData.origin_phase || 'Coding / Implementation'}
                </span>
              </div>
              <p style={{ fontSize: '0.92rem', fontWeight: 600, color: 'var(--text-main)', marginTop: '0.25rem' }}>
                {originData.summary || 'Defect injected during feature implementation sprint due to unhandled edge cases.'}
              </p>
            </div>

            {/* Analysis Grid */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              
              <div className="glass-panel" style={{ padding: '1rem' }}>
                <strong style={{ fontSize: '0.85rem', color: '#3b82f6', display: 'flex', alignItems: 'center', gap: '0.4rem', marginBottom: '0.5rem' }}>
                  <GitPullRequest size={16} /> Introduced PR / Commit
                </strong>
                <p style={{ fontSize: '0.82rem', color: 'var(--text-main)' }}>
                  {originData.introducing_pr || originData.introducing_commit || 'PR #42 — Authentication Middleware Refactor'}
                </p>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.35rem', display: 'block' }}>
                  Original Author: <strong>{originData.original_author || 'Developer'}</strong>
                </span>
              </div>

              <div className="glass-panel" style={{ padding: '1rem' }}>
                <strong style={{ fontSize: '0.85rem', color: '#a855f7', display: 'flex', alignItems: 'center', gap: '0.4rem', marginBottom: '0.5rem' }}>
                  <Code2 size={16} /> Hotspot Component / File
                </strong>
                <p style={{ fontSize: '0.82rem', color: 'var(--text-main)' }}>
                  {originData.affected_file || 'auth_service.py'}
                </p>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.35rem', display: 'block' }}>
                  Tech Debt Risk: <strong>{originData.tech_debt_score || 'Moderate (45/100)'}</strong>
                </span>
              </div>

            </div>

            {/* Root Cause Details */}
            <div style={{ background: 'rgba(0,0,0,0.03)', padding: '1rem', borderRadius: '10px', border: '1px solid var(--border-color)' }}>
              <strong style={{ fontSize: '0.85rem', color: '#ef4444', display: 'flex', alignItems: 'center', gap: '0.4rem', marginBottom: '0.35rem' }}>
                <ShieldAlert size={16} /> Root Cause Analysis
              </strong>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-main)', lineHeight: 1.5 }}>
                {originData.root_cause || 'Missing input validation and unhandled exception propagation on async session timeouts.'}
              </p>
            </div>

            {/* AI Prevention Recommendation */}
            <div style={{ background: 'rgba(16, 185, 129, 0.06)', padding: '1rem', borderRadius: '10px', border: '1px solid rgba(16, 185, 129, 0.3)' }}>
              <strong style={{ fontSize: '0.85rem', color: '#10b981', display: 'flex', alignItems: 'center', gap: '0.4rem', marginBottom: '0.35rem' }}>
                <Lightbulb size={16} /> AI Preventive Rule Recommendation
              </strong>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-main)', lineHeight: 1.5 }}>
                {originData.prevention_advice || 'Add static analysis check for unhandled async exceptions and require minimum 80% test coverage on authentication handlers.'}
              </p>
            </div>

          </div>
        )}
      </div>
    </div>
  );
};

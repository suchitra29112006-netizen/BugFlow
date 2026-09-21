import React, { useEffect, useState } from 'react';
import { HelpCircle, X, CheckCircle2, ShieldAlert, Sparkles, Loader2 } from 'lucide-react';
import { api } from '../services/api';

export const ExplainWhyModal = ({ isOpen, onClose, recommendationType = 'triage', targetId }) => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!isOpen || !targetId) return;

    const fetchExplainWhy = async () => {
      setLoading(true);
      setError('');
      try {
        const res = await api.getExplainWhy(targetId, recommendationType);
        setData(res);
      } catch (err) {
        setError(err.message || 'Failed to generate explanation.');
      } finally {
        setLoading(false);
      }
    };

    fetchExplainWhy();
  }, [isOpen, targetId, recommendationType]);

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" style={{ zIndex: 1100, background: 'rgba(0,0,0,0.65)' }} onClick={onClose}>
      <div className="modal-card" style={{ width: '560px', padding: '1.75rem' }} onClick={(e) => e.stopPropagation()}>
        
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.85rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <div style={{ background: 'linear-gradient(135deg, #10b981 0%, #3b82f6 100%)', padding: '0.45rem', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <HelpCircle size={20} color="#fff" />
            </div>
            <div>
              <h3 style={{ fontSize: '1.15rem', fontWeight: 800 }}>Explain Why? — Transparent AI Reasoning</h3>
              <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>Observable system factors, confidence %, and evidence checklist</p>
            </div>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}>
            <X size={20} />
          </button>
        </div>

        {loading ? (
          <div style={{ padding: '2.5rem', textAlign: 'center', color: 'var(--text-muted)' }}>
            <Loader2 className="animate-spin" size={24} style={{ margin: '0 auto 0.5rem auto' }} />
            <p style={{ fontSize: '0.85rem' }}>Synthesizing observable system factors...</p>
          </div>
        ) : error ? (
          <div style={{ padding: '1rem', borderRadius: '8px', background: 'rgba(239, 68, 68, 0.15)', color: '#ef4444', fontSize: '0.85rem' }}>
            {error}
          </div>
        ) : data ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.1rem' }}>
            
            {/* Recommendation Title & Confidence Badge */}
            <div style={{ background: 'rgba(16, 185, 129, 0.08)', padding: '1rem', borderRadius: '10px', border: '1px solid rgba(16, 185, 129, 0.3)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <span className="badge badge-assigned" style={{ fontSize: '0.68rem', textTransform: 'uppercase', marginBottom: '0.2rem', display: 'inline-block' }}>
                  AI RECOMMENDATION
                </span>
                <h4 style={{ fontSize: '1.05rem', fontWeight: 800, color: 'var(--text-main)' }}>{data.recommendation}</h4>
              </div>
              <div style={{ textAlign: 'right' }}>
                <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', display: 'block', fontWeight: 700 }}>CONFIDENCE</span>
                <span style={{ fontSize: '1.2rem', fontWeight: 900, color: '#10b981' }}>{data.confidence_pct}%</span>
              </div>
            </div>

            {/* Evidence Checklist */}
            <div>
              <strong style={{ fontSize: '0.85rem', color: '#10b981', display: 'block', marginBottom: '0.5rem', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                Observable System Evidence Checklist:
              </strong>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.45rem' }}>
                {data.evidence.map((ev, idx) => (
                  <div key={idx} style={{ padding: '0.6rem 0.85rem', background: 'rgba(0,0,0,0.02)', borderRadius: '8px', border: '1px solid var(--border-color)', fontSize: '0.85rem', color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <CheckCircle2 size={16} color="#10b981" />
                    <span>{ev.replace(/^✓\s*/, '')}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Summary */}
            <div style={{ background: 'rgba(0,0,0,0.02)', padding: '0.85rem 1rem', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
              <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', display: 'block', marginBottom: '0.25rem' }}>DETERMINISTIC SUMMARY</span>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-main)', lineHeight: 1.5 }}>{data.summary}</p>
            </div>

            {/* Action Footer */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid var(--border-color)', paddingTop: '0.85rem', fontSize: '0.78rem', color: 'var(--text-muted)' }}>
              <span>Final decision remains under authorized human control.</span>
              <button className="btn btn-secondary" style={{ padding: '0.4rem 0.85rem', fontSize: '0.8rem' }} onClick={onClose}>
                Close
              </button>
            </div>

          </div>
        ) : null}

      </div>
    </div>
  );
};

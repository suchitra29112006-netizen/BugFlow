import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { GitFork, Dna, X } from 'lucide-react';

export function BugFamilyTreeModal({ isOpen, onClose, issueId }) {
  const [familyData, setFamilyData] = useState(null);
  const [fingerprint, setFingerprint] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (isOpen && issueId) {
      loadData();
    }
  }, [isOpen, issueId]);

  const loadData = async () => {
    try {
      setLoading(true);
      const [tree, dna] = await Promise.all([
        api.getBugFamilyTree(issueId).catch(() => null),
        api.getDefectFingerprint(issueId).catch(() => null),
      ]);
      setFamilyData(tree);
      setFingerprint(dna);
    } catch (err) {
      console.error('Failed to load family tree:', err);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" style={{ zIndex: 1100 }} onClick={onClose}>
      <div
        className="modal-card"
        style={{ maxWidth: '750px', width: '92%', padding: '1.75rem' }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.85rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <div style={{ padding: '0.5rem', borderRadius: '10px', background: 'rgba(6, 182, 212, 0.15)', color: '#06b6d4' }}>
              <GitFork size={22} />
            </div>
            <div>
              <h2 style={{ fontSize: '1.25rem', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                Bug Family Tree & Defect DNA
                <span style={{ fontSize: '0.75rem', padding: '2px 8px', borderRadius: '4px', background: 'rgba(6, 182, 212, 0.15)', color: '#06b6d4', fontFamily: 'monospace' }}>
                  Defect #{issueId}
                </span>
              </h2>
              <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>Structural Genealogy & Normalized Fingerprint</p>
            </div>
          </div>
          <button className="btn btn-secondary" style={{ padding: '0.35rem 0.65rem' }} onClick={onClose}>
            <X size={16} />
          </button>
        </div>

        {/* Content */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          {loading ? (
            <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>Analyzing Defect DNA & Family Genealogy...</div>
          ) : (
            <>
              {/* Fingerprint DNA Card */}
              {fingerprint && (
                <div style={{ padding: '1rem', borderRadius: '10px', background: 'rgba(6, 182, 212, 0.08)', border: '1px solid rgba(6, 182, 212, 0.3)', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#06b6d4', fontWeight: 800, fontSize: '0.9rem' }}>
                    <Dna size={18} /> Defect DNA Fingerprint
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                    <div style={{ background: 'rgba(0,0,0,0.03)', padding: '0.65rem 0.85rem', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
                      <span style={{ fontSize: '0.68rem', color: 'var(--text-muted)', display: 'block', fontWeight: 700 }}>HASH FINGERPRINT</span>
                      <span style={{ fontSize: '0.78rem', fontFamily: 'monospace', color: '#06b6d4', wordBreak: 'break-all' }}>{fingerprint.fingerprint_hash}</span>
                    </div>
                    <div style={{ background: 'rgba(0,0,0,0.03)', padding: '0.65rem 0.85rem', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
                      <span style={{ fontSize: '0.68rem', color: 'var(--text-muted)', display: 'block', fontWeight: 700 }}>NORMALIZED MODULE</span>
                      <span style={{ fontSize: '0.82rem', fontFamily: 'monospace', fontWeight: 600 }}>{fingerprint.target_module}</span>
                    </div>
                  </div>

                  <div>
                    <span style={{ fontSize: '0.68rem', color: 'var(--text-muted)', display: 'block', fontWeight: 700, marginBottom: '0.35rem' }}>NORMALIZED ERROR KEYWORDS</span>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.35rem' }}>
                      {fingerprint.error_tokens?.map((tok, idx) => (
                        <span key={idx} style={{ fontSize: '0.72rem', padding: '2px 8px', borderRadius: '4px', background: 'rgba(0,0,0,0.04)', border: '1px solid var(--border-color)', fontFamily: 'monospace' }}>
                          {tok}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* Family Tree Structure */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
                <h3 style={{ fontSize: '0.95rem', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <GitFork size={16} color="#6366f1" /> Defect Lineage & Ancestry
                </h3>

                {familyData?.parents && familyData.parents.length > 0 && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                    <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: 700 }}>ROOT CAUSE PARENTS</span>
                    {familyData.parents.map((p) => (
                      <div key={p.id} style={{ padding: '0.75rem 1rem', borderRadius: '8px', background: 'rgba(0,0,0,0.02)', border: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ fontSize: '0.88rem', fontWeight: 700 }}>#{p.id} — {p.title}</span>
                        <span style={{ fontSize: '0.78rem', color: '#6366f1', fontFamily: 'monospace' }}>{p.relation}</span>
                      </div>
                    ))}
                  </div>
                )}

                <div style={{ padding: '0.85rem 1rem', borderRadius: '10px', background: 'rgba(99, 102, 241, 0.1)', border: '1px solid rgba(99, 102, 241, 0.3)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: 'rgba(99, 102, 241, 0.2)', color: '#6366f1', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: '0.85rem' }}>
                      #{issueId}
                    </div>
                    <div>
                      <span style={{ fontSize: '0.9rem', fontWeight: 800, display: 'block' }}>Current Defect Node</span>
                      <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Active Focal Point</span>
                    </div>
                  </div>
                  <span className="badge badge-assigned" style={{ fontSize: '0.7rem' }}>
                    Target Issue
                  </span>
                </div>

                {familyData?.children && familyData.children.length > 0 ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                    <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: 700 }}>DERIVED CHILD DEFECTS</span>
                    {familyData.children.map((c) => (
                      <div key={c.id} style={{ padding: '0.75rem 1rem', borderRadius: '8px', background: 'rgba(0,0,0,0.02)', border: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ fontSize: '0.88rem', fontWeight: 700 }}>#{c.id} — {c.title}</span>
                        <span style={{ fontSize: '0.78rem', color: '#6366f1', fontFamily: 'monospace' }}>{c.relation}</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div style={{ padding: '0.85rem', borderRadius: '8px', background: 'rgba(0,0,0,0.02)', border: '1px solid var(--border-color)', color: 'var(--text-muted)', fontSize: '0.82rem', textAlign: 'center' }}>
                    No derived downstream child defects linked to this issue.
                  </div>
                )}
              </div>
            </>
          )}
        </div>

        {/* Footer */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '1.5rem', borderTop: '1px solid var(--border-color)', paddingTop: '1rem' }}>
          <button onClick={onClose} className="btn btn-secondary">
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

